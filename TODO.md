# To-do list

Ideas for improving Purrsuade, roughly in priority order.

## Fixes
- [x] **Save a quest in progress.** The current quest (topic, transcript, scores) only lives in memory, so a reload or closing the app on a phone loses it.
- [x] **Pause the room when it's hidden.** On phone, a full-screen panel covers the room but it keeps animating behind it and draining battery.
- [x] **Version control.** Put the project under git so changes can be rolled back.

## Quest 2.0: make the speaking practice itself better
- [x] **Built-in timers.** A prep countdown (60 / 45 / 30 s by level) and a speaking timer showing the 2–5 minute target, with the cat watching.
- [x] **Record and auto-transcribe.** Use the browser's speech recognition so the transcript fills itself in; allow playing the recording back. Check Safari/iPhone support first.
- [x] **Read scores from pasted feedback.** Pick out "Clarity: 7, Structure: 8…" from the pasted AI feedback and pre-fill the Scores step.
- [x] **One-tap AI apps.** Feedback step opens ChatGPT / Claude with the talk already typed in (Gemini / other: copied).
- [x] **Bring your own API key.** Settings option: the app calls Claude directly and fills feedback + scores (no server needed).
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
- [x] **Built-in feedback (no copy-paste).** The bring-your-own-key / hosted coach from Quest 2.0 removes the hardest step for non-technical users.
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
- [ ] **Live Roleplay.** AI characters (chatty new coworker, friend who teases you, colleague pushing for a favour), back-and-forth by voice, debrief at the end. Loop: speech-to-text → Claude (Haiku 5.5, for low latency) → browser text-to-speech. Needs **Bring your own API key** (Quest 2.0) or the hosted coach.
- [ ] **Real-World Missions.** A ladder of steps that get harder (say hi to the barista → ask a coworker about their weekend → tell a story from your bank → invite someone for coffee). Rate fear before (1–10) and after; showing the fear was bigger than reality is the main point. Big rewards, the cat celebrates.
- [ ] **Trend Brief.** A daily card with 3 things people are talking about + one line of context each, then a 30-second "take a stance" quest that feeds the Opinion Builder. A daily GitHub Action pulls RSS or Wikipedia's "In the news" (optionally summarised by an LLM using a repo secret) and commits `trends.json` to GitHub Pages.
- [ ] **Pre-Event Prep ("Party in 2 hours").** Pick the kind of event; get a cheat card with 2 stories, 2 trend takes and 3 openers that fit, then one quick drill. Build once the Story Bank, Opinion Builder and Trend Brief have content.
- [ ] **Later, maybe: matching people.** Needs accounts, a backend, moderation and user safety. Start with Taste-Profile-based community suggestions as missions; consider peer practice partners at the same level after that.
- [ ] **Product notes.** A clear "playful, not mean" line on tease-back drills; a short "practice, not therapy" note with a pointer to support for people whose social anxiety is severe.

Order: Phase 1 Opinion Builder, Story Bank, Missions (no new infrastructure) → Phase 2 Reflex Drills → Phase 3 bring-your-own key + Live Roleplay → Phase 4 Trend Brief, Pre-Event Prep. Split `app.js` into modules (Foundations) before adding these modes.

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
