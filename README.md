# Communication Quest

A cozy speaking-practice game. Spin a topic, speak for a couple of minutes, get feedback
from an AI, and earn coins to look after your pixel cat.

**Play it:** https://bhav1509.github.io/communication-quest/

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
3. **Coach:** tap **Copy for AI** (or **Share to app** on a phone), paste it into ChatGPT,
   Claude or Gemini, then paste the reply back. The scores fill in automatically.
4. **Reflect:** rate how it felt and complete the quest for XP and coins.

Unfinished quests are saved to the journal as incomplete at midnight.

## Transcription
- **High accuracy (default on laptops):** Whisper runs on your own device after you stop
  speaking. One-time ~79 MB download, then it works offline.
- **Quick (default on phones):** live text from the browser's speech service. Fast, but can
  miss words around pauses.

Switch in Settings → Transcription.

## Privacy
Everything stays on your device: there are no accounts and no server. High-accuracy
transcription runs locally. Quick transcription uses the browser's speech service (Chrome
sends audio to Google). Feedback only goes to an AI when you copy or share it yourself.

Progress lives in that browser on that device, so use Settings → **Export** now and then to
keep a backup (and **Import** to restore or move devices).

## Features
- Daily quest + unlimited practice, adaptive difficulty (1–7), 500 topics
- In-app recording with planning countdown, timer and live transcript
- Score reading from pasted AI feedback
- XP, coins, levels, streaks; progress meters and a journal with a monthly calendar
- Isometric pixel cat room with a garden: 9 coats, 6 room styles, time-of-day sky,
  tap-to-pet, needs (food, water, litter, play) and movable furniture

## Run it locally
```bash
python3 -m http.server 8080
```
Then open http://localhost:8080 (the microphone needs `localhost` or HTTPS).

## Credits
Art: Cat Game Pixel Pack (`cat-game-pack/`, original art, free to use in games).
Font: Jersey 10. Speech model: Whisper via transformers.js.
