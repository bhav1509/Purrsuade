// The same coach prompt the app copies into ChatGPT / Claude (coachPrompt() in app.js); keep the two in step
// so the replies parse the same way (KEY POINTS + SCORES at the end).
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function coachPrompt({ topic, transcript, spokeSec, targetMin }) {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  const timing = spokeSec
    ? `SPEAKING TIME: ${mmss(spokeSec)} (target: about ${targetMin} min) · roughly ${Math.round(words / (spokeSec / 60))} words per minute`
    : `TARGET LENGTH: about ${targetMin} min (actual time not recorded)`;
  return `You are my friendly but honest communication mentor. I am practicing speaking, not writing. The transcript below was captured by speech recognition, so ignore small transcription errors.

Score each from 1–10: Clarity, Structure, Confidence, Vocabulary, Conciseness, Grammar, Overall.

Then give:
1. Three specific strengths
2. Three specific improvements
3. Timing and pace: did my length suit the target, and was my pace comfortable to listen to (around 130–160 words per minute is typical)?
4. A stronger structure I could have used
5. A short improved example answer
6. One focus for my next speaking session

Do not overpraise me. Be encouraging, concrete and concise.

Finish your reply with these two sections as plain text (no headings, bold or other formatting), exactly in this format:
KEY POINTS:
- 3 to 5 bullet points, each under 15 words: the most important takeaways
SCORES: clarity=X; structure=X; confidence=X; vocabulary=X; conciseness=X; grammar=X; overall=X

TOPIC:
${topic}

${timing}

TRANSCRIPT:
${transcript}`;
}
