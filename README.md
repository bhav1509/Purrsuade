# Purrsuade

A cozy speaking-practice game. Spin a topic, speak for a couple of minutes, get feedback
from an AI, and earn coins to look after your pixel cat.

**Play it:** https://bhav1509.github.io/Purrsuade/

## Install it
It's a web app you can install like a normal app (full screen, works offline).

- **iPhone / iPad (Safari):** open the link → **Share** → **Add to Home Screen** → **Add**.
- **Android (Chrome):** open the link → menu **⋮** → **Install app** (or **Add to Home screen**).
- **Laptop (Chrome / Edge):** open the link → click the install icon in the address bar,
  or Settings (⚙) in the app → **Install app**.

## How a quest works
1. **Topic:** spin the wheel for today's topic (one free reroll).
2. **Speak:** a short planning countdown, then talk while a timer tracks your target length.
   Your words are written out for you.
3. **Feedback:** tap **Get feedback** for instant AI feedback: the scores and key points fill in by
   themselves. It works when you're signed in (a few free a day).
   Or use your own AI app (ChatGPT, Claude, Gemini or another): your talk opens there ready to send; copy the
   answer, come back and tap **Paste the answer**. Complete the quest for XP and coins (or skip feedback for the day).

Unfinished quests are saved to the journal as incomplete at midnight.

## Transcription
- **High accuracy (default on laptops):** Whisper runs on your own device after you stop
  speaking. One-time ~79 MB download, then it works offline.
- **Quick (default on phones):** live text from the browser's speech service. Fast, but can
  miss words around pauses.

Switch in Settings → Transcription.

## Account and backup
Signing in is optional (Settings → Account: Google or email). When you're signed in, your progress backs up to
your account automatically and syncs across your devices, so clearing the browser no longer loses your cat.
Without an account, progress lives in that browser only: use Settings → **Export** now and then (and **Import**
to restore or move devices).

## Privacy
Without an account everything stays on your device. With an account, your progress (cat, coins, journal with
transcripts and feedback) is stored on Amazon Web Services; recordings never leave your device. High-accuracy
transcription runs locally. Quick transcription uses the browser's speech service (Chrome sends audio to
Google). Your talk only goes to an AI when you ask for feedback: instant feedback sends it to Claude (through
AWS, when signed in).

The backend is in [`cloud/`](cloud/README.md) (Cognito, Lambda, S3, DynamoDB, Bedrock).

## Features
- Daily quest + unlimited practice, adaptive difficulty (1–7), 76 prompts (196 topics with their variations)
- In-app recording with planning countdown, timer and live transcript
- Instant AI feedback (Claude) when signed in, or one-tap ChatGPT / Claude / Gemini
- Optional sign-in (Google or email) with automatic backup and sync across devices
- XP, coins, levels, streaks; progress meters and a journal with a monthly calendar
- Isometric pixel cat room with a garden: time-of-day sky, tap-to-pet, needs (food, water, litter, play)
  and movable furniture
- Shop (the bag next to "move furniture"): new furniture, new colours for the room, 6 room styles,
  9 coats and renaming your cat, all paid with the coins you earn by speaking

## Versions
Versions follow [Semantic Versioning](https://semver.org) (MAJOR.MINOR.PATCH). Each release to the live
site gets a new version, shown in Settings → About and listed in [CHANGELOG.md](CHANGELOG.md).
1.0.0 will be the public launch. To publish:

```bash
scripts/release.sh patch "Fix the recording crash"   # 0.1.0 -> 0.1.1  (bug fixes)
scripts/release.sh minor "Add keyboard dictation"     # 0.1.1 -> 0.2.0  (new features)
scripts/release.sh 1.0.0 "Public launch"              # set an exact version
```

## Run it locally
```bash
python3 -m http.server 8080
```
Then open http://localhost:8080 (the microphone needs `localhost` or HTTPS).

## Credits
Art: Cat Game Pixel Pack (`cat-game-pack/`, original art, free to use in games).
Font: Jersey 10. Speech model: Whisper via transformers.js.
