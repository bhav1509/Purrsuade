# Purrsuade cloud

The optional backend: **sign in** (Amazon Cognito: Google and email), **progress backup and sync**
(one JSON file per person in S3) and **instant AI feedback** (Claude Haiku 4.5 in Amazon Bedrock, with a daily
allowance per person). The app stays on GitHub Pages and keeps working without any of this.

```
GitHub Pages (app)  ──sign in──►  Cognito sign-in page (Google / email)
        │  access token
        └──────────►  Lambda function URL ──► S3        users/<id>/progress.json  (versioned, 30 days of old copies)
                                          ├─► DynamoDB  daily feedback counters
                                          └─► Bedrock   Claude Haiku 4.5
```

A Lambda function URL is used instead of API Gateway because AI feedback can take longer than API Gateway's
30-second limit. The function checks the Cognito token on every request.

## Live setup (October 2026)
The live backend was created by hand in the AWS console (project **purrsuade**, account 858109978484, Sydney), not
with `sam deploy`; `template.yaml` describes the same setup. Resources: Cognito user pool `ap-southeast-2_k4Xfr0RZy`
(app client `purrsuade-web`, Google sign-in), Lambda `purrsuade-api` with role `purrsuade-api-role`
(inline policy `purrsuade-api-access`) and a function URL, S3 bucket `purrsuade-progress`, DynamoDB table
`purrsuade-usage`. Model: `global.anthropic.claude-haiku-4-5-20251001-v1:0`.

**Update the backend code:** `cd cloud/src && npm ci --omit=dev && zip -qr ../purrsuade-api.zip .`, then
Lambda → purrsuade-api → Code → Upload from .zip. (Run `npm install` again afterwards if you use the test tools.)

## Deploy with SAM (alternative)

1. **AWS credentials.** Purrsuade has its own project (its own AWS account) on the free plan, locked to
   **ap-southeast-2 (Sydney)**. The deploy user is `purrsuade-admin`, set up as the `purrsuade` CLI profile:
   `aws sts get-caller-identity --profile purrsuade`.
2. **Tools:** `brew install aws-sam-cli`.
3. **Bedrock model access.** AWS console → Amazon Bedrock → *Model catalog* → **Claude Haiku 4.5** (Anthropic's
   one-time use-case form is needed first). Newer models such as Haiku 5.5 weren't available to this account.
4. **Google sign-in (optional, recommended).** In Google Cloud Console → *APIs & Services* → *Credentials* →
   *Create OAuth client ID* → *Web application*. Authorized redirect URI:
   `https://<DomainPrefix>.auth.<region>.amazoncognito.com/oauth2/idpresponse`
   (e.g. `https://purrsuade.auth.ap-southeast-2.amazoncognito.com/oauth2/idpresponse`). Keep the client ID and secret.
   To let anyone sign in (not just test users), fill in *Branding* (homepage, `privacy.html`, authorized domains
   `amazoncognito.com` and `bhav1509.github.io`) and *Publish app*.
5. **Deploy:**
   ```bash
   cd cloud
   sam build
   sam deploy --guided --profile purrsuade --region ap-southeast-2 --stack-name purrsuade-cloud \
     --capabilities CAPABILITY_IAM --tags Project=purrsuade \
     --parameter-overrides DomainPrefix=purrsuade GoogleClientId=… GoogleClientSecret=…
   ```
   If `purrsuade` is taken as a sign-in domain, pick another `DomainPrefix` (and update the Google redirect URI).
   `samconfig.toml` (which can hold the Google secret) is git-ignored.
6. **Connect the app.** Copy the stack outputs into `CLOUD_CONFIG` at the top of `../cloud.js`:
   `api` = `ApiUrl`, `authDomain` = `AuthDomainUrl`, `clientId` = `ClientId`, and `google: true` if you set up
   Google. Test on `http://localhost:8080` (it's an allowed address), then release with `scripts/release.sh`.

## Settings worth knowing

| Parameter | Default | What it does |
|---|---|---|
| `DailyCoachLimit` | 10 | Instant feedbacks per person per day (UTC) |
| `GlobalDailyCoachLimit` | 500 | Instant feedbacks for everyone together per day: the spending cap |
| `CoachModel` | `global.anthropic.claude-haiku-4-5-20251001-v1:0` | Bedrock model ID; older models (Haiku 4.5) need the inference profile ID |
| `CoachEffort` | empty | `low` / `medium` / `high` for models that support effort (Haiku 4.5 doesn't) |
| `SesIdentityArn` / `SesFromAddress` | empty | Send sign-in emails through your own SES address; also turns on passwordless email codes |
| `AppUrls` / `AppOrigins` | GitHub Pages + localhost:8080 | Where sign-in may return to and who may call the API |

**Email limits.** Without SES, Cognito sends sign-up emails from its own address with a small daily quota
(about 50 a day). Google sign-in sends no email. If you expect many email sign-ups at launch, verify an
address in Amazon SES and request SES production access. AWS can take a day or more to approve it, so start
early. Then redeploy with `SesIdentityArn` and `SesFromAddress`.

## Cost

- **AI feedback:** about 0.5 US cents per feedback with Haiku 4.5 (a real test: 1,123 tokens in, 756 out, 8 s; check
  current Bedrock pricing). The global cap bounds the worst case at about `GlobalDailyCoachLimit × $0.005` a day.
- The account runs on the free plan's credits ($120, plan ends **20 April 2027**). Upgrade or move before then: AWS
  suspends free-plan accounts at the end of the plan.
- **Everything else** (Cognito, Lambda, S3, DynamoDB) is pennies at launch scale.
- Set an **AWS Budgets** alert (e.g. $20/month) before announcing.

## Look after it

- Logs: CloudWatch → `/aws/lambda/<function>` (kept 30 days).
- Restore someone's progress: S3 → the bucket → `users/<id>/progress.json` → *Versions*.
- The coach prompt lives in `src/coach-prompt.mjs` and in `coachPrompt()` in `app.js`. Keep them the same.
