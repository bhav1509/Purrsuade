// The same coach prompt the app copies into ChatGPT / Claude (coachPrompt() in app.js); keep the two in step
// so the replies parse the same way (the six ## sections, then KEY POINTS + SCORES at the end).
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Words per minute and where that sits against the comfortable 130–160 (paceOf() in app.js).
const PACE_BANDS = [[100, 'Slow'], [130, 'A little slow'], [161, 'Comfortable'], [181, 'A little fast'], [Infinity, 'Fast']];
export function paceOf(transcript = '', sec = 0) {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  if (!sec || !words) return null;
  const wpm = Math.round(words / (sec / 60));
  return { words, sec, wpm, label: PACE_BANDS.find(([max]) => wpm < max)[1], short: sec < 20 || words < 40 };
}

export function coachPrompt({ topic, transcript, spokeSec, targetMin }) {
  const p = paceOf(transcript, spokeSec);
  const timing = p
    ? `SPEAKING TIME: ${mmss(p.sec)} (target: about ${targetMin} min)
PACE: ${p.wpm} words per minute (${p.words} words), which counts as "${p.label.toLowerCase()}" (comfortable is 130–160)${p.short ? '. The talk was very short, so the pace is only a rough guide' : ''}.
The app measured these. Use these exact numbers and this pace verdict; don't recalculate them.`
    : `TARGET LENGTH: about ${targetMin} min (the actual time wasn't recorded, so don't comment on pace)`;
  return `You are my friendly but honest communication mentor. I am practicing speaking, not writing. The transcript below was captured by speech recognition, so ignore small transcription errors.

Score each from 1–10: Clarity, Structure, Confidence, Vocabulary, Conciseness, Grammar, Overall.

Then give these six sections, each starting with its heading on its own line, written exactly like this:
## Strengths
Three specific strengths, as "- " bullet points.
## Improvements
Three specific improvements, as "- " bullet points.
## Timing and pace
Did my length suit the target? Was the pace given below comfortable to listen to? One or two "- " bullet points.
## A stronger structure
The structure I could have used, as short "- " bullet points.
## Example answer
A short improved example answer, as one paragraph.
## Next focus
One focus for my next speaking session, in one sentence.

No title, no tables and no list of scores before the sections. Do not overpraise me. Be encouraging, concrete and concise.

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
