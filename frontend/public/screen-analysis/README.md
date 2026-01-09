# Screen Analysis Templates

Place the normalized template images here so the screen analysis feature can
detect turn-choice and match results.

Required files:
- turn-choice.png
- ok-button.png
- result-win.png
- result-lose.png

Notes:
- Templates should be captured from a 16:9 frame normalized to 1280px width.
- Keep the templates tightly cropped around the text for better matching.
- Transparent backgrounds are supported; the matcher uses the alpha channel as a mask.
- If templates are captured from a different base resolution, update
  `templateBaseWidth` in `frontend/src/utils/screenAnalysis.ts` to match the
  capture width so the loader can rescale them.
