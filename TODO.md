# To-do list

Ideas for improving Communication Quest, roughly in priority order.

## Fixes
- [x] **Save a quest in progress.** The current quest (topic, transcript, scores) only lives in memory, so a reload or closing the app on a phone loses it.
- [x] **Pause the room when it's hidden.** On phone, a full-screen panel covers the room but it keeps animating behind it and draining battery.
- [x] **Version control.** Put the project under git so changes can be rolled back.

## Quest 2.0: make the speaking practice itself better
- [ ] **Built-in timers.** A prep countdown (60 / 45 / 30 s by level) and a speaking timer showing the 2–5 minute target, with the cat watching.
- [ ] **Record and auto-transcribe.** Use the browser's speech recognition so the transcript fills itself in; allow playing the recording back. Check Safari/iPhone support first.
- [ ] **Read scores from pasted feedback.** Pick out "Clarity: 7, Structure: 8…" from the pasted AI feedback and pre-fill the Scores step.
- [ ] **Built-in AI coach (optional).** Get feedback and scores straight from Claude. Needs a small server or a user-supplied API key, so only worth it if copy-paste still feels slow.

## Game depth
- [ ] **Phase 2 progression.** Decor shop (Lv 2), earned room styles (Lv 3), second cat (Lv 4), room expansion (Lv 5), caretaker (Lv 6), third cat and special items (Lv 7), rare coats and seasonal decor (Lv 8+). Progress panel becomes an unlocks track.
  - Open questions: unlock order (cats earlier?), caretaker as a booked sitter vs. automatic insurance, whether the main cat stars in quests, bigger room vs. extra rooms.
- [ ] **Cat reacts to your sessions.** A proud animation for scores of 8+, sits near you on streak days, shows today's quest as a speech bubble.
- [ ] **More varied topics.** More base prompts (today ~60 × 8 variations), custom topics, or picking a category on the wheel.

## Foundations
- [ ] **Data safety.** A "back up now?" reminder every week or two; optional sync across devices (needs a backend).
- [ ] **Code health.** Split `app.js` into readable modules; add tests for XP, cat decay and scoring rules.

## Remember
The README's week-1 rule: use the app for a week before adding more, and note friction, boring topics, and whether the cat brings you back.
