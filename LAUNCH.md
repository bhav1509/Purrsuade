# Purrsuade v1.0 launch · Sunday 1 November 2026

## Timeline
| When | What |
|---|---|
| Oct 21–22 | ✓ AWS project + deploy user, ✓ Claude Haiku 4.5 in Bedrock, ✓ Google OAuth client (Testing mode). `sam deploy` (see `cloud/README.md`), fill in `CLOUD_CONFIG` in `cloud.js`. |
| Oct 23 | Release **v0.2.0** (`scripts/release.sh minor "Sign in, cloud backup and instant AI feedback"`). Set an AWS Budgets alert. |
| Oct 23–27 | Run the QA checklist below on real devices. Give the link to 3–5 testers, including one less technical person. Fix what they hit (patch releases). |
| Oct 28–29 | Record and edit the demo video. Take 3–4 clean screenshots for the post. |
| Oct 30 | Feature freeze. Final pass of the checklist. **Publish the Google sign-in app**: Google Cloud → Branding (homepage, `https://bhav1509.github.io/Purrsuade/privacy.html`, authorized domain `bhav1509.github.io`) → Audience → Publish app. Draft the LinkedIn post and schedule it. |
| Nov 1 | `scripts/release.sh 1.0.0 "Public launch"`, check the live site on a phone, then post. Watch CloudWatch logs and the GitHub issues for the first day. |

## QA checklist (real devices)
Run each on **iPhone Safari**, **iPhone installed app (Add to Home Screen)**, **Android Chrome** and **laptop Chrome**.
- [ ] Fresh visit: tour, spin, speak (each transcription mode the device defaults to), feedback, complete quest.
- [ ] Copy-paste feedback still works with ChatGPT and Claude.
- [ ] Own API key: save, instant feedback, remove.
- [ ] Sign in with Google and with email, coming back to the app (**check this inside the installed iPhone app**,
      where sign-in pages can behave differently), instant feedback, "N left today" goes down, limit message at 0.
- [ ] Existing local progress uploads on first sign-in. Clear site data, sign in again: the cat and journal come back.
- [ ] Two devices: a session on one shows up on the other after reopening. Sessions on both while offline → the "which progress" choice.
- [ ] Offline: the app opens and practice works; instant feedback shows the offline message; changes sync once back online.
- [ ] Sign out, then sign in as a different account on the same device.
- [ ] Delete my account: sign-in removed, progress stays on the device, signing in again starts fresh.
- [ ] Privacy policy link in Settings → Privacy opens and reads right.
- [ ] Settings → About shows 1.0.0 after the launch release (and the offline cache refreshed).

## Demo video (60–90 s, vertical 9:16 for LinkedIn, captions on)
Record on a phone screen recorder (or the browser's device mode), with the room art on screen as much as possible.
1. **Hook (0–5 s).** Close-up of the cat. Caption: *"I built a game that makes me practice speaking every day."*
2. **Spin (5–15 s).** Tap Quest → the wheel spins → topic lands.
3. **Speak (15–35 s).** Planning countdown, then you talking (picture-in-picture of your face if you can), live words filling in. Cut down to ~10 s of actual talk.
4. **Instant feedback (35–50 s).** Tap **Get feedback** → scores and key points appear. Hold on the scores for a beat.
5. **Reward (50–65 s).** Complete quest → XP and coins → feed the cat / it reacts. Show the journal calendar filling up.
6. **Close (65–80 s).** "Free to try, works on your phone, your progress saved to your account." End card with the link and "Purrsuade v1.0".

Tips: record at 1080×1920, use a short real topic, keep the UI at a calm pace (no fast scrolling), add light music,
burn in captions (most people watch muted).

## LinkedIn post (draft)
> I get nervous speaking off the cuff, so I built a little game to make myself practice every day. Today it's public. 🐱
>
> **Purrsuade** gives you a topic, you talk for a couple of minutes, and an AI coach scores your clarity, structure
> and confidence with one concrete thing to improve. Every session earns coins to look after a pixel cat, so
> there's a reason to come back tomorrow.
>
> What's in v1.0:
> • Instant AI feedback (Claude), or use your own ChatGPT / Claude / Gemini
> • Your words written out as you speak, on your device
> • Sign in to keep your progress safe and use it on any device (or play without an account)
> • Works on your phone and installs like an app
>
> Built as a side project with vanilla JS, AWS (Cognito, Lambda, S3, DynamoDB, Bedrock) and a lot of pixel art.
>
> Try it: https://bhav1509.github.io/Purrsuade/
> I'd love feedback, especially from anyone who finds speaking up hard. What topic should I add next?
>
> #publicspeaking #communication #sideproject #buildinpublic #aws

Post with the video attached natively (not as a YouTube link). Put the link in the post text, and reply to
early comments in the first hour.
