# Cat room art

- `cat-game-atlas.png` / `cat-game-atlas.js`: the Cat Game Pixel Pack atlas (original art, free to use).
  The `.js` file is the pack's `cat_game_atlas.json` wrapped as `const CAT_ATLAS=…` so it also works
  when `index.html` is opened directly from disk. Both are copied from the original pack in
  `../cat-game-pack/` (loose sprites, previews and the Python generators live there); re-copy and
  regenerate the `.js` if the pack changes.
- 9 cat coats, each with idle / sit / walk / run / sleep / jump / box / play animations (32×32, feet at 16,29).
- The room layout (style, furniture, wall decor, cat spots) lives in `ROOM` and `SPOT` in `room-art.js`.
  Any sprite name from the atlas can be swapped in there.
- `legacy/` holds the previous hand-made sprites; nothing loads them any more and they can be deleted.
- `fonts/jersey10-latin.woff2`: Jersey 10 by Sarah Cadigan-Fried (SIL Open Font License), used for text inside the cat room.
  Bundled locally so the app works offline.
