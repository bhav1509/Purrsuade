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
- [ ] **Bring your own API key.** Settings option: the app calls the user's LLM directly and fills feedback + scores (no server needed).
- [ ] **Hosted coach (paid).** Small backend with accounts, payments and a daily limit; also gives cloud backup.
- [ ] **Keep recordings across reloads.** Audio playback currently lasts only until the page reloads (store in IndexedDB).

## v2: support for less confident speakers
Older testers found it hard to even frame sentences, and the copy-to-AI step confusing. Ideas, kept out of v1 on purpose:
- [ ] **Starter level below Everyday.** Very simple prompts ("Tell me about your breakfast today") with a 30-second target.
- [ ] **Sentence starters on screen.** While speaking, show 3 tappable openers for the topic ("One thing I love is…", "For example…", "That's why…").
- [ ] **Plan in three taps.** Before speaking, answer: What's your main point? One example? How will you finish? Show the answers as a cheat card while talking.
- [ ] **Hear an example first.** Read aloud (text-to-speech) a short model answer, then the user tries their own version.
- [ ] **Repeat-after-me warm-up.** Say 2–3 short sentences after the app to build confidence before the real topic.
- [ ] **Gentler feedback mode.** Ask the AI for one encouraging point and one small tip only, in plain words.
- [ ] **Built-in feedback (no copy-paste).** The bring-your-own-key / hosted coach from Quest 2.0 removes the hardest step for non-technical users.
- [ ] **Bigger text option** and a simpler layout for older users.
- [ ] **Helper mode.** A family member sets it up and can see progress, encourage, or rate the talk instead of an AI.

## Game depth
- [ ] **Phase 2 progression.** Decor shop (Lv 2), earned room styles (Lv 3), second cat (Lv 4), room expansion (Lv 5), caretaker (Lv 6), third cat and special items (Lv 7), rare coats and seasonal decor (Lv 8+). Progress panel becomes an unlocks track.
  - Open questions: unlock order (cats earlier?), caretaker as a booked sitter vs. automatic insurance, whether the main cat stars in quests, bigger room vs. extra rooms.
- [ ] **Cat reacts to your sessions.** A proud animation for scores of 8+, sits near you on streak days, shows today's quest as a speech bubble.
- [ ] **More varied topics.** More base prompts (today ~60 × 8 variations), custom topics, or picking a category on the wheel.

## Phone app
- [ ] **Wrap with Capacitor** for iOS and Android. In-app web views don't offer browser speech recognition, so the Speak step needs a native speech plugin there (e.g. `@capacitor-community/speech-recognition`).
- [ ] **Test live transcription on real phones** (Chrome on Android, Safari on iPhone) before relying on it.
- [ ] **Privacy policy + microphone permission text** (required by both stores).

## Foundations
- [ ] **Data safety.** A "back up now?" reminder every week or two; optional sync across devices (needs a backend).
- [ ] **Code health.** Split `app.js` into readable modules; add tests for XP, cat decay and scoring rules.

## Remember
The README's week-1 rule: use the app for a week before adding more, and note friction, boring topics, and whether the cat brings you back.
