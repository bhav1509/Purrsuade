# Changelog

Versions follow [Semantic Versioning](https://semver.org): MAJOR.MINOR.PATCH.
PATCH = bug fixes, MINOR = new features, MAJOR = the 1.0.0 public launch (and later, big breaking changes).
Every push to the live app gets a new version, shown in Settings → About. Publish with `scripts/release.sh`.

## v1.0.2 · 2026-11-01
- Fix: usage steps are recorded again

## v1.0.1 · 2026-11-01
- Anonymous usage steps (no words, no account; can be turned off in Settings) and a one-time survey after the first quest; privacy policy updated

## v1.0.0 · 2026-11-01
- Public launch: 76 cleaner speaking prompts (one sentence at the easy levels, a fitting extra challenge from level 4)

## v0.3.4 · 2026-10-31
- One free instant feedback without an account; signing out resets this device to a fresh room (progress stays in your account)

## v0.3.3 · 2026-10-31
- Instant feedback through sign-in only (own API key option removed); desk microphone icon everywhere; shorter Speak screen; steady listening mic; smooth pinch zoom on phones

## v0.3.2 · 2026-10-31
- Phone: whole room in view at the start, pinch out a little further, even crisp lines; clearer arranging grid on wood and carpet floors; tidier starting room; the cat goes into and out of the cardboard box; chunkier menu and Speak icons; no gap under the island's side corners

## v0.3.1 · 2026-10-31
- Simpler starter room (bed, bowls, litter tray, a window, a plant and a box); windows, paintings and clocks in the shop; the cat walks round furniture, climbs the cat tree level by level and goes into condos and teepees; selection rings that hug each piece; tidier shop with colours in Cat stuff and Room & cat together; armchair instead of sofa; new grass details and icons

## v0.3.0 · 2026-10-31
- Shop: furniture, colours, room styles and coats; put things away, shelves with racks, movable wall decor, the cat uses furniture and scratches the post, pixel font everywhere

## v0.2.0 · 2026-10-22
- Sign in with Google or email, cloud backup and sync, instant AI feedback (Claude Haiku 4.5 or your own key), delete account, privacy policy

## v0.1.1 · 2026-10-13
- Crash guard: ignore background closes, switch to dictation only after two real crashes, skip stuck pieces, add diagnostics to feedback

## v0.1.0 · 2026-10-13
First numbered test release (everything built so far):
- Daily speaking quest: topic wheel (difficulty follows your level), plan countdown, recording with
  start / 15-seconds-left / done tones and auto-stop at the target time
- On-device transcription with Whisper, written out in pieces while you talk (no crash on long talks);
  keyboard dictation and quick live text as alternatives; replay of the recording
- Feedback: one tap opens ChatGPT / Claude with your talk ready to send (Gemini / other: copied);
  paste the answer back and scores + key points fill in; quest results screen
- Pixel cat room with garden: needs, care, bowls / litter that show the cat's state, sickness, death,
  headstones and adopting a kitten; movable furniture and headstones
- XP, coins, levels, streaks, Progress and Journal (calendar, key points), midnight reset
- Interactive first-run tour, backup reminder, feedback button, installable app with paw icon
