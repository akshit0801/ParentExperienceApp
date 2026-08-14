# Voice assets

The game narrates itself using the browser's built-in text-to-speech
(Web Speech API) out of the box — no files needed to play it.

If you'd rather use a real recorded narrator voice, drop `.mp3` files
in this folder named to match the line IDs in `game.js` (see the
`NARRATION` block), for example:

```
Voice assets/
├── s_title.mp3
├── s_worry_prompt.mp3
├── s_worry_ack.mp3
├── s_r1_prompt.mp3
├── s_r1_reveal_correct.mp3
├── s_r1_reveal_wrong.mp3
├── s_r2_prompt.mp3
├── s_r2_reveal.mp3
├── s_r3_prompt.mp3
├── s_r3_aha.mp3
├── s_r4_prompt.mp3
├── s_r4_reveal.mp3
├── s_score.mp3
├── s_reflection_prompt.mp3
└── s_close.mp3
```

`game.js` checks for a matching file here first and plays it; if the
file is missing it automatically falls back to the synthesized voice.
No code changes are required — just add the files.
