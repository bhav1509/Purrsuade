#!/usr/bin/env node
// Usage insights from the anonymous events the app sends (POST /events): who reached which step, who came back,
// and the survey answers. Reads the purrsuade-usage table with the `purrsuade` AWS profile; changes nothing.
//   node scripts/insights.mjs            everything so far
//   node scripts/insights.mjs --today    today only (UTC)
//   node scripts/insights.mjs --days 7   the last 7 days
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const days = args.includes('--today') ? 1 : args.includes('--days') ? +args[args.indexOf('--days') + 1] || 7 : 0;
const since = days ? new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10) : '';

// Every EV#<day>#<device> item (the CLI follows the pages itself).
const out = execFileSync('aws', ['dynamodb', 'scan', '--table-name', 'purrsuade-usage', '--profile', 'purrsuade',
  '--region', 'ap-southeast-2', '--filter-expression', 'begins_with(pk, :p)',
  '--expression-attribute-values', JSON.stringify({ ':p': { S: 'EV#' } }), '--output', 'json'], { maxBuffer: 1 << 28 });
const rows = JSON.parse(out).Items.map(it => {
  const [, day, device] = it.pk.S.split('#');
  const events = (it.ev?.L || []).map(e => ({ n: e.M.n.S, t: +e.M.t.N, d: e.M.d?.S }));
  return { day, device, signedIn: it.signedIn?.BOOL, events };
}).filter(r => !since || r.day >= since);

// One record per device: the days it was used, every event, and the first time it opened the app.
const devices = new Map();
for (const r of rows) {
  const d = devices.get(r.device) || { days: new Set(), events: [], signedIn: false };
  d.days.add(r.day); d.events.push(...r.events); d.signedIn ||= r.signedIn;
  devices.set(r.device, d);
}
for (const d of devices.values()) d.events.sort((a, b) => a.t - b.t);
const has = (d, ...names) => d.events.some(e => names.includes(e.n));
const count = test => [...devices.values()].filter(test).length;
const total = devices.size;
const pct = n => total ? `${Math.round(n / total * 100)}%`.padStart(4) : '  - ';
const line = (label, n) => console.log(`  ${label.padEnd(34)}${String(n).padStart(5)}  ${pct(n)}`);

console.log(`\nPurrsuade usage ${days ? `(last ${days === 1 ? 'day' : days + ' days'}, from ${since})` : '(all time)'}`);
console.log(`  ${rows.length} device-days from ${total} devices\n`);

console.log('Funnel (devices that ever reached each step)');
line('Opened the app', count(d => has(d, 'open')));
line('Spun a topic', count(d => has(d, 'spin', 'reroll')));
line('Started speaking', count(d => has(d, 'speak_start')));
line('Finished speaking', count(d => has(d, 'speak_done')));
line('Got feedback (instant or AI app)', count(d => has(d, 'feedback_instant', 'feedback_ai_app')));
line('Completed a quest', count(d => has(d, 'quest_done')));
line('Signed in', count(d => d.signedIn || has(d, 'signin')));
line('Came back on another day', count(d => d.days.size > 1));
line('Completed 3+ quests', count(d => d.events.filter(e => e.n === 'quest_done').length >= 3));

const opens = [...devices.values()].map(d => d.events.find(e => e.n === 'open')?.d || '').filter(Boolean);
const tally = word => opens.filter(o => o.includes(word)).length;
console.log(`\nDevices: ${tally('phone')} phone, ${tally('computer')} computer · ${tally(' app')} installed app, ${tally('browser')} browser`);
const spoke = [...devices.values()].flatMap(d => d.events.filter(e => e.n === 'speak_done').map(e => +e.d || 0)).sort((a, b) => a - b);
if (spoke.length) console.log(`Speaking: ${spoke.length} talks, median ${spoke[spoke.length >> 1]} s, ${spoke.filter(s => s < 30).length} under 30 s`);
const all = [...devices.values()].flatMap(d => d.events);
const by = name => all.filter(e => e.n === name).length;
console.log(`Feedback: ${by('feedback_instant')} instant (${all.filter(e => e.n === 'feedback_instant' && e.d === 'guest').length} free tries), ` +
  `${by('feedback_ai_app')} through an AI app, ${by('feedback_failed')} failed (${[...new Set(all.filter(e => e.n === 'feedback_failed').map(e => e.d))].join(', ') || 'none'})`);
console.log(`Tour: ${by('tour_done')} finished, ${by('tour_skip')} skipped`);

// Survey answers, newest first.
const answers = all.filter(e => e.n === 'survey').map(e => { try { return { t: e.t, ...JSON.parse(e.d) }; } catch { return null; } }).filter(Boolean).sort((a, b) => b.t - a.t);
console.log(`\nSurvey: ${answers.length} answered, ${by('survey_skip')} skipped, ${by('survey_shown')} shown`);
if (answers.length) {
  const useful = answers.map(a => +a.useful).filter(Boolean);
  if (useful.length) console.log(`  How useful (1–5): average ${(useful.reduce((a, b) => a + b, 0) / useful.length).toFixed(1)} · ` +
    [1, 2, 3, 4, 5].map(n => `${n}: ${useful.filter(u => u === n).length}`).join('  '));
  const pay = { no: 'No', 2: '$2/mo', 5: '$5/mo', 10: '$10+/mo' };
  console.log(`  Would pay: ${Object.entries(pay).map(([k, l]) => `${l} ${answers.filter(a => a.pay === k).length}`).join(' · ')}`);
  console.log('  What would make it better:');
  for (const a of answers.filter(a => a.better)) console.log(`   - ${new Date(a.t).toISOString().slice(0, 16).replace('T', ' ')}  ${a.better}`);
}
console.log('');
