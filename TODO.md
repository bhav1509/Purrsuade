# To-do list

Ideas for improving Purrsuade, roughly in priority order.

## v1.0.0 launch (Sunday 1 November 2026)
v0.3.2 is live: sign-in, cloud backup and sync, instant AI feedback, the shop, the reworked room and cat. Details
and the device checklist are in [LAUNCH.md](LAUNCH.md).

Status on Sat 31 Oct: Wed–Fri went to the shop, room and UI rounds (v0.3.0 → v0.3.2, and v0.3.3 waiting to be
released), so the usage tracking and dashboard planned for Thu–Fri are not built yet. They now come straight after
launch (see "Launch week"), so the first testers' sessions before that won't be recorded.

**Wed 28 Oct: AWS settings, testers, shop decision**
- [x] **Publish the Google sign-in first** (blocks testers). Google Cloud → Branding: homepage `https://bhav1509.github.io/Purrsuade/`, privacy policy `https://bhav1509.github.io/Purrsuade/privacy.html`, authorized domains `bhav1509.github.io` and `amazoncognito.com` → Audience → Publish app. Until then only listed test users can use Google sign-in.
- [x] **Raise `GLOBAL_DAILY_LIMIT`** from 50 to ~200 (Lambda environment variables; at most ~$1 a day).
- [x] **Cognito refresh token → 365 days** (App client → App client information → Edit).
- [x] **CloudWatch log retention → 1 month** (`/aws/lambda/purrsuade-api`).
- [x] **Budget alert covers the purrsuade project** (not just drobe).
- [x] **Try email sign-up once.** Cognito's own sender allows ~50 emails a day; fine if most people use Google.
- [x] **Calendar reminder for late March 2027:** the AWS free plan ends 20 April 2027 and the account is suspended unless upgraded.
- [x] **Decide on the shop:** shipping it in v1.0.
- [x] **Test the shop on my own phone.** Done through the review rounds (v0.3.1–v0.3.3); the automated phone and
      laptop suite (58 checks) covers buying, placing, put away, wall decor, colours, room, coat, rename and old saves.
      Sync to a second device is still in the QA checklist below.
- [x] **Release v0.3.0** with `scripts/release.sh minor "Shop: furniture, colours, room styles and coats"`.
- [ ] ~~**Message 3–5 LinkedIn testers**~~ Skipped for lack of time (a ready-to-send message is in the chat history); the public post does this job.
- [ ] Start device testing on my own phone: iPhone Safari, the installed iPhone app (sign-in is the biggest risk there).

**Thu 29 Oct: build tracking and the feedback popups** → moved to launch week (not started)
Goal: see where signed-in beta testers drop off, and whether the idea is worth charging for.
- [ ] **Usage events in the app.** `track(name, details)` queues events on the device (capped ~500) and sends them in
      batches while signed in (every 30 s, on hide, on sign-in); events from before sign-in go up on first sign-in.
      Events: app open, tour start/done/skip, spin/reroll, speak start/done/cancel, typed instead, instant feedback
      (ok/failed/limit), copy to AI app, feedback skipped, quest complete/abandoned, care, shop buy, cat died/adopted,
      sign in/out, delete account, install, survey answer/dismiss. Never the transcript.
- [ ] **"Share usage" switch** in Settings → Privacy (on by default).
- [ ] **Feedback popups**, answered once per account (stored in the synced progress):
  - After the first finished quest: how useful (1–5), what would you pay a month (Nothing / $2 / $5 / $10+), what
    would make it worth paying for (optional text).
  - After the 5th quest: "How would you feel if you could no longer use Purrsuade?" (very / somewhat / not
    disappointed; 40%+ "very" is a good sign), main benefit (optional text).
- [ ] **`POST /events` in the Lambda.** Up to 100 events per call, validated; stored in the existing `purrsuade-usage`
      table as one item per user per day (`EV#<user id>#<date>`), kept 13 months. Delete account removes them too.
      Deploy by zip upload (no new AWS resources or permissions).
- [ ] **Privacy policy:** what's recorded (actions, not what you say), why, how long, and the opt-out. Decide on an email contact.
- [ ] Release v0.3.x; check on the laptop that events reach DynamoDB.

**Fri 30 Oct: dashboard and device testing** (dashboard → launch week)
- [ ] **Local dashboard** `node scripts/dashboard.mjs` → `http://localhost:8787`, rereads DynamoDB + Cognito users
      (`purrsuade` profile) on every refresh; nothing with emails is committed. Shows: headline numbers (users, active
      today / 7 days, quests, next-day and 7-day return, usefulness, would pay, % very disappointed), the funnel
      (opened → spun → spoke → finished speaking → feedback → quest done → came back → 3+ quests), a day 0–7 retention
      grid by start date, one row per user with where they stopped and a click-through timeline, survey answers and
      comments, and feature use (instant vs copy-paste, transcription mode, shop and cat care).
- [ ] Full QA checklist in LAUNCH.md on iPhone Safari, the installed iPhone app, Android Chrome and laptop: sync between
      two devices, offline, sign out/in, delete account, copy-paste with ChatGPT and Claude. (Events and popups once built.)
- [ ] Fix what comes up (patch releases); read the testers' first data in the dashboard.
- [x] **Clean up the UI.** Done over v0.3.1–v0.3.3: starter room, shop (two tabs, colour picker, wall decor),
      selection rings, the cat walking round furniture and using the cat tree / condo / teepee / box, garden, icons,
      phone zoom and crisp lines, a shorter Speak screen, own-API-key option removed.
- [x] **Clean up the topics** (goes out with the next release): 76 prompts; levels 1–3 are one sentence, levels
      4–7 add a short matching challenge; duplicates and tech-only prompts replaced; all prompts now come up.

**Sat 31 Oct: feature freeze and launch content**
- [x] **Release v0.3.3**: API key option removed, desk-mic icon everywhere, shorter Speak screen, no glowing mic,
      smooth pinch zoom on phones. Checked live on phone size.
- [x] **Hand check on my iPhone.** Fine apart from three things, fixed in **v0.3.4** (live, checked):
      signing out now resets the device to a fresh room; one free instant feedback without an account (backend
      guest path, 2 per network a day, 100 for all guests); Cognito password rule relaxed to 8+ characters.
      (Email sign-in with my Gmail can't work: that account was made with Google, so it has no password.)
- [ ] Feature freeze: bug fixes only from here.
- [ ] Demo video (60–90 s, vertical, captions; shot list in LAUNCH.md), recorded on the final build.
- [x] 3–4 screenshots for the post (room, topic, feedback with scores, shop, progress; phone size 1170×2532).
- [ ] Edit the LinkedIn post draft in LAUNCH.md into my own voice (updated 1 Nov to match what's live); schedule it if possible.
- [ ] Check the dashboard and tester comments; fix anything that blocks launch.
- [ ] Final pass of the LAUNCH.md checklist.

**Sun 1 Nov: launch day**
- [ ] `scripts/release.sh 1.0.0 "Public launch"`, then check the live site on a phone (Settings → About shows 1.0.0).
- [ ] Post on LinkedIn with the video.
- [ ] Watch CloudWatch logs and GitHub issues for the first day.

**Launch week (Mon 2 Nov →)**
- [ ] **Usage tracking + feedback popups + `POST /events` + privacy policy update** (the Thu 29 Oct plan above), then
      a patch release and a check that events reach DynamoDB.
- [ ] **Local dashboard** (the Fri 30 Oct plan above).
- [ ] Read tester comments; fix what comes up.
- [ ] **Sign-in emails from my own address (Amazon SES):** Cognito's default sender often lands in spam and allows
      ~50 emails a day. Verify an address in SES, request production access (can take a day), then switch the user
      pool's email to SES.
- [ ] Later, if testers report transcription mistakes: cloud transcription (e.g. AWS Transcribe) as an option. Costs a
      few cents a talk, and the audio leaves the device, so the privacy policy changes.
- [ ] Optional: remove `examples/sample-backup-2026-10-05.json` (my own transcripts) from the git history.

## Fixes
- [x] **Save a quest in progress.** The current quest (topic, transcript, scores) only lives in memory, so a reload or closing the app on a phone loses it.
- [x] **Pause the room when it's hidden.** On phone, a full-screen panel covers the room but it keeps animating behind it and draining battery.
- [x] **Version control.** Put the project under git so changes can be rolled back.

## Quest 2.0: make the speaking practice itself better
- [x] **Built-in timers.** A prep countdown (60 / 45 / 30 s by level) and a speaking timer showing the 2–5 minute target, with the cat watching.
- [x] **Record and auto-transcribe.** Use the browser's speech recognition so the transcript fills itself in; allow playing the recording back. Check Safari/iPhone support first.
- [x] **Read scores from pasted feedback.** Pick out "Clarity: 7, Structure: 8…" from the pasted AI feedback and pre-fill the Scores step.
- [x] **One-tap AI apps.** Feedback step opens ChatGPT / Claude with the talk already typed in (Gemini / other: copied).
- [x] ~~**Bring your own API key.**~~ Built, then removed in v0.3.3: instant feedback is through sign-in only.
- [x] **Hosted coach.** AWS backend (`cloud/`) with sign-in, a daily limit and cloud backup.
  - [ ] Payments / higher limits for regular users.
- [ ] **Keep recordings across reloads.** Audio playback currently lasts only until the page reloads (store in IndexedDB).

## v2: support for less confident speakers
Older testers found it hard to even frame sentences, and the copy-to-AI step confusing. Ideas, kept out of v1 on purpose:
- [ ] **Starter level below Everyday.** Very simple prompts ("Tell me about your breakfast today") with a 30-second target.
- [ ] **Sentence starters on screen.** While speaking, show 3 tappable openers for the topic ("One thing I love is…", "For example…", "That's why…").
- [ ] **Plan in three taps.** Before speaking, answer: What's your main point? One example? How will you finish? Show the answers as a cheat card while talking.
- [ ] **Hear an example first.** Read aloud (text-to-speech) a short model answer, then the user tries their own version.
- [ ] **Repeat-after-me warm-up.** Say 2–3 short sentences after the app to build confidence before the real topic.
- [ ] **Gentler feedback mode.** Ask the AI for one encouraging point and one small tip only, in plain words.
- [x] **Built-in feedback (no copy-paste).** The hosted coach from Quest 2.0 removes the hardest step for non-technical users.
- [ ] **Bigger text option** and a simpler layout for older users.
- [ ] **Helper mode.** A family member sets it up and can see progress, encourage, or rate the talk instead of an AI.

## v3: real conversations (out of the bubble)
Goal: help less confident people connect with others: have something to say, respond in the moment, and take it into real life.
The problems fall into three groups, and each needs its own feature:
- **Nothing to say** (blanking on stories, no opinions, out of the loop on trends) → build and rehearse your own material.
- **Freezing in the moment** (saying no, teasing back, jokes, small talk) → lots of short, quick reps.
- **Staying in the bubble** (making friends, office connections) → small real-world steps that get gradually harder.

All features read from and add to one local **"Me" profile** (likes, stories, takes), so the app becomes a record of who you are.

- [ ] **Opinion Builder ("Why do I like it?").** Log a movie, book, meal or place; the cat asks 4–5 narrow questions by voice (which moment stuck, who would you recommend it to and who'd hate it, why isn't it a 10, what does it remind you of). Each answer becomes a "take" card. Offline, question templates only.
  - [ ] **Taste Profile.** Show patterns across entries ("you keep rating underdog stories highly"): the "find your personality" part.
- [ ] **Story Bank.** Memory prompts ("a time you got completely lost"); tell it, the AI cuts it down to a 3-beat card (hook → twist → ending) plus a title. Reuses the transcript → coach prompt → paste pipeline.
  - [ ] **Retell drills** on a spaced-repetition schedule: tell it in 30 s, then 60 s.
  - [ ] **Tags** by setting (work, date, group).
- [ ] **Reflex Drills ("Sparring with the cat").** 15-second reps from a JSON scenario bank (~50 per type), in rounds of 5, then example replies + self-rating; all 5 answers go to the AI in one prompt. Each type teaches one technique:
  - Tease-back: agree and exaggerate, playful misreading (light, never cutting).
  - Warm no: appreciate the ask, clear no, optional alternative.
  - Small talk: comment on something around you, then ask a question; FORD (family, occupation, recreation, dreams); pick up a detail they mentioned.
  - Jokes: callbacks, rule of three, exaggeration.
- [ ] **Live Roleplay.** AI characters (chatty new coworker, friend who teases you, colleague pushing for a favour), back-and-forth by voice, debrief at the end. Loop: speech-to-text → Claude (Haiku 5.5, for low latency) → browser text-to-speech. Needs the hosted coach (Quest 2.0).
- [ ] **Real-World Missions.** A ladder of steps that get harder (say hi to the barista → ask a coworker about their weekend → tell a story from your bank → invite someone for coffee). Rate fear before (1–10) and after; showing the fear was bigger than reality is the main point. Big rewards, the cat celebrates.
- [ ] **Trend Brief.** A daily card with 3 things people are talking about + one line of context each, then a 30-second "take a stance" quest that feeds the Opinion Builder. A daily GitHub Action pulls RSS or Wikipedia's "In the news" (optionally summarised by an LLM using a repo secret) and commits `trends.json` to GitHub Pages.
- [ ] **Pre-Event Prep ("Party in 2 hours").** Pick the kind of event; get a cheat card with 2 stories, 2 trend takes and 3 openers that fit, then one quick drill. Build once the Story Bank, Opinion Builder and Trend Brief have content.
- [ ] **Later, maybe: matching people.** Needs accounts, a backend, moderation and user safety. Start with Taste-Profile-based community suggestions as missions; consider peer practice partners at the same level after that.
- [ ] **Product notes.** A clear "playful, not mean" line on tease-back drills; a short "practice, not therapy" note with a pointer to support for people whose social anxiety is severe.

Order: Phase 1 Opinion Builder, Story Bank, Missions (no new infrastructure) → Phase 2 Reflex Drills → Phase 3 Live Roleplay → Phase 4 Trend Brief, Pre-Event Prep. Split `app.js` into modules (Foundations) before adding these modes.

## Game depth
- [ ] **Phase 2 progression.** Decor shop (Lv 2), earned room styles (Lv 3), second cat (Lv 4), room expansion (Lv 5), caretaker (Lv 6), third cat and special items (Lv 7), rare coats and seasonal decor (Lv 8+). Progress panel becomes an unlocks track.
  - Open questions: unlock order (cats earlier?), caretaker as a booked sitter vs. automatic insurance, whether the main cat stars in quests, bigger room vs. extra rooms.
- [ ] **Cat reacts to your sessions.** A proud animation for scores of 8+, sits near you on streak days, shows today's quest as a speech bubble.
- [ ] **More varied topics.** More base prompts (today ~60 × 8 variations), custom topics, or picking a category on the wheel.

## Phone app
- [ ] **Wrap with Capacitor** for iOS and Android. In-app web views don't offer browser speech recognition, so the Speak step needs a native speech plugin there (e.g. `@capacitor-community/speech-recognition`).
- [ ] **Test live transcription on real phones** (Chrome on Android, Safari on iPhone) before relying on it.
- [ ] **Privacy policy + microphone permission text** (required by both stores). Web privacy page done (`privacy.html`).

## Foundations
- [x] **Data safety.** Backup reminder; sign-in with automatic backup and sync across devices.
- [ ] **Code health.** Split `app.js` into readable modules; add tests for XP, cat decay and scoring rules.

## Remember
The README's week-1 rule: use the app for a week before adding more, and note friction, boring topics, and whether the cat brings you back.
