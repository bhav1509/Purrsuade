# Changelog

Versions follow [Semantic Versioning](https://semver.org): MAJOR.MINOR.PATCH.
PATCH = bug fixes, MINOR = new features, MAJOR = the 1.0.0 public launch (and later, big breaking changes).
Every push to the live app gets a new version, shown in Settings → About. Publish with `scripts/release.sh`.

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
