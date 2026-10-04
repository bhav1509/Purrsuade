# Communication Quest — Week 1 V1

A single-user, local-first speaking practice game.

## What is included
- Daily speaking quest + unlimited practice
- One free reroll per attempt
- Adaptive difficulty (1–7)
- 500-topic general library generated from curated base challenges
- 2–5 minute speaking target that adapts from recent scores
- Manual transcript + one-tap ChatGPT coaching prompt
- Manual AI feedback and 7 scoring dimensions
- Self-rating: confidence, fluency, satisfaction
- XP, coins, levels, streaks
- Isometric pixel cat room (Cat Game Pixel Pack art) with 9 selectable coats, 6 room styles, a time-of-day sky, tap-to-pet, and hunger, water, cleanliness, and happiness
- Feed / refill / clean / play / treat actions
- History and progress dashboards
- Local-only storage
- JSON export/import backup
- Installable PWA manifest + offline service worker

## Use on Mac immediately
Double-click `index.html`. All progress stays in that browser.

For full PWA/offline behavior, serve the folder over HTTP/HTTPS. For example while developing:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Install on iPhone
The files must be hosted once on an HTTPS static host. After deployment:
1. Open the site in Safari on iPhone.
2. Share → Add to Home Screen → Add.
3. Open Communication Quest from the Home Screen.

After the first successful load, the service worker caches the app for offline use. Your progress remains local to that browser/device, so export a backup periodically.

## Data safety
Settings → Export backup downloads a JSON copy of your history and cat state. Import backup restores it.
