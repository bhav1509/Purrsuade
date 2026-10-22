// Purrsuade API (one Lambda behind a function URL). Every request carries a Cognito access token.
//   GET  /progress?etag=…  → {state, etag} | {unchanged:true} | {none:true} when nothing is saved yet
//   PUT  /progress         {state, etag|null} → {etag} | 409 when another device saved in between
//   GET  /usage            → {remaining, limit}
//   POST /coach            {topic, transcript, spokeSec, targetMin} → {text, remaining} | 429 when today's limit is used
//   DELETE /account        → {deleted:true}: removes the saved progress (every version) and the sign-in
import { AnthropicBedrock, AnthropicBedrockMantle } from '@anthropic-ai/bedrock-sdk';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectVersionsCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { coachPrompt } from './coach-prompt.mjs';

const { USER_POOL_ID, CLIENT_ID, BUCKET, TABLE, COACH_MODEL, COACH_EFFORT, AWS_REGION } = process.env;
const DAILY_LIMIT = +process.env.DAILY_LIMIT || 5;
const GLOBAL_DAILY_LIMIT = +process.env.GLOBAL_DAILY_LIMIT || 300;
const MAX_STATE_BYTES = 4_000_000, MAX_TRANSCRIPT = 20_000;

const verifier = CognitoJwtVerifier.create({ userPoolId: USER_POOL_ID, tokenUse: 'access', clientId: CLIENT_ID });
const s3 = new S3Client({});
const ddb = new DynamoDBClient({});
const cognito = new CognitoIdentityProviderClient({});
// Newer Claude models (anthropic.claude-…) use Bedrock's Messages endpoint. Older ones such as Haiku 4.5 are reached
// through InvokeModel with an inference profile ID, e.g. global.anthropic.claude-haiku-4-5-20251001-v1:0.
const viaInvokeModel = /^(global|us|eu|au|jp|apac)\.|:\d+$/.test(COACH_MODEL || '');
const claude = viaInvokeModel ? new AnthropicBedrock({ awsRegion: AWS_REGION }) : new AnthropicBedrockMantle({ awsRegion: AWS_REGION });

const json = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const progressKey = sub => `users/${sub}/progress.json`;
const utcDay = () => new Date().toISOString().slice(0, 10);

export async function handler(event) {
  const method = event.requestContext?.http?.method, path = event.rawPath;
  let user;
  try {
    const token = (event.headers?.authorization || '').replace(/^Bearer\s+/i, '');
    user = await verifier.verify(token);
  } catch {
    return json(401, { error: 'signed-out' });
  }
  let body = {};
  if (event.body) {
    try { body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body); }
    catch { return json(400, { error: 'bad-json' }); }
  }
  try {
    if (path === '/progress' && method === 'GET') return await getProgress(user.sub, event.queryStringParameters?.etag);
    if (path === '/progress' && method === 'PUT') return await putProgress(user.sub, body);
    if (path === '/usage' && method === 'GET') return json(200, { remaining: await remaining(user.sub), limit: DAILY_LIMIT });
    if (path === '/coach' && method === 'POST') return await coach(user.sub, body);
    if (path === '/account' && method === 'DELETE') return await deleteAccount(user);
    return json(404, { error: 'not-found' });
  } catch (e) {
    console.error(path, method, e);
    return json(500, { error: 'server' });
  }
}

// ---- Progress: one JSON file per person. S3 conditional writes stop two devices overwriting each other. ----
async function getProgress(sub, etag) {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: progressKey(sub), IfNoneMatch: etag || undefined }));
    return json(200, { state: JSON.parse(await r.Body.transformToString()), etag: r.ETag });
  } catch (e) {
    if (e.$metadata?.httpStatusCode === 304) return json(200, { unchanged: true, etag });
    if (e.name === 'NoSuchKey') return json(200, { none: true });
    throw e;
  }
}
async function putProgress(sub, { state, etag }) {
  if (!state || typeof state !== 'object' || !Array.isArray(state.history) || !state.cat) return json(400, { error: 'bad-state' });
  const data = JSON.stringify(state);
  if (Buffer.byteLength(data) > MAX_STATE_BYTES) return json(413, { error: 'too-big' });
  try {
    const r = await s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: progressKey(sub), Body: data, ContentType: 'application/json',
      ...(etag ? { IfMatch: etag } : { IfNoneMatch: '*' }),
    }));
    return json(200, { etag: r.ETag });
  } catch (e) {
    const status = e.$metadata?.httpStatusCode;
    if (status === 412 || status === 409) return json(409, { error: 'conflict' });
    throw e;
  }
}

async function deleteAccount(user) {
  const Prefix = `users/${user.sub}/`;
  let more = true;
  while (more) {
    const r = await s3.send(new ListObjectVersionsCommand({ Bucket: BUCKET, Prefix }));
    const Objects = [...(r.Versions || []), ...(r.DeleteMarkers || [])].map(v => ({ Key: v.Key, VersionId: v.VersionId }));
    if (Objects.length) await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects, Quiet: true } }));
    more = !!r.IsTruncated && Objects.length > 0;
  }
  await cognito.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: user.username }));
  return json(200, { deleted: true });
}

// ---- Built-in AI feedback, with a daily allowance per person and a shared daily cap ----
async function claim(pk, limit) {
  try {
    await ddb.send(new UpdateItemCommand({
      TableName: TABLE, Key: { pk: { S: pk } },
      UpdateExpression: 'ADD n :one SET #ttl = if_not_exists(#ttl, :ttl)',
      ConditionExpression: 'attribute_not_exists(n) OR n < :limit',
      ExpressionAttributeNames: { '#ttl': 'ttl' },
      ExpressionAttributeValues: { ':one': { N: '1' }, ':limit': { N: String(limit) }, ':ttl': { N: String(Math.floor(Date.now() / 1000) + 3 * 86400) } },
    }));
    return true;
  } catch (e) {
    if (e.name === 'ConditionalCheckFailedException') return false;
    throw e;
  }
}
async function release(pk) {
  try {
    await ddb.send(new UpdateItemCommand({
      TableName: TABLE, Key: { pk: { S: pk } }, UpdateExpression: 'ADD n :minus', ExpressionAttributeValues: { ':minus': { N: '-1' } },
    }));
  } catch (e) { console.error('release', pk, e); }
}
async function remaining(sub) {
  const r = await ddb.send(new GetItemCommand({ TableName: TABLE, Key: { pk: { S: `${sub}#${utcDay()}` } } }));
  return Math.max(0, DAILY_LIMIT - (+r.Item?.n?.N || 0));
}

async function coach(sub, { topic, transcript, spokeSec, targetMin }) {
  if (typeof topic !== 'string' || typeof transcript !== 'string' || !transcript.trim()) return json(400, { error: 'bad-input' });
  if (transcript.length > MAX_TRANSCRIPT || topic.length > 500) return json(413, { error: 'too-long' });
  const day = utcDay(), mine = `${sub}#${day}`, all = `ALL#${day}`;
  if (!(await claim(mine, DAILY_LIMIT))) return json(429, { error: 'limit', remaining: 0, limit: DAILY_LIMIT });
  if (!(await claim(all, GLOBAL_DAILY_LIMIT))) { await release(mine); return json(429, { error: 'busy', limit: DAILY_LIMIT }); }
  let msg;
  try {
    msg = await claude.messages.create({
      model: COACH_MODEL,
      max_tokens: 8000,
      ...(COACH_EFFORT ? { output_config: { effort: COACH_EFFORT } } : {}),
      messages: [{ role: 'user', content: coachPrompt({ topic, transcript, spokeSec: +spokeSec || 0, targetMin: +targetMin || 2 }) }],
    });
  } catch (e) {
    await Promise.all([release(mine), release(all)]);
    throw e;
  }
  const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
  if (msg.stop_reason === 'refusal' || !text) {
    await Promise.all([release(mine), release(all)]);
    return json(502, { error: 'no-answer' });
  }
  return json(200, { text, remaining: await remaining(sub) });
}
