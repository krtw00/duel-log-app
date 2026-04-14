import type { ROI } from './types.js';

// ROI regions (normalized 0-1 coordinates for 16:9 aspect ratio)
export const COIN_ROI: ROI = {
  left: 0.3303125,
  top: 0.6105556,
  width: 0.3359375,
  height: 0.1055556,
};

export const COIN_OCR_ROI: ROI = {
  left: 0.2603125,
  top: 0.5805556,
  width: 0.4759375,
  height: 0.1555556,
};

export const COIN_OCR_SELECTION_ROI: ROI = {
  left: 0.285,
  top: 0.64,
  width: 0.54,
  height: 0.15,
};

export const COIN_OCR_CONFIRM_ROI: ROI = {
  left: 0.315,
  top: 0.61,
  width: 0.37,
  height: 0.115,
};

export const COIN_OCR_ROIS: Array<{ label: string; roi: ROI }> = [
  { label: 'selection', roi: COIN_OCR_SELECTION_ROI },
  { label: 'confirm', roi: COIN_OCR_CONFIRM_ROI },
  { label: 'legacy', roi: COIN_OCR_ROI },
];

export const RESULT_ROI: ROI = {
  left: 0.086563,
  top: 0.352778,
  width: 0.822187,
  height: 0.466111,
};

export const RESULT_TEXT_ROI: ROI = {
  left: 0.085,
  top: 0.225,
  width: 0.83,
  height: 0.43,
};

export const RESULT_CENTER_ROI: ROI = {
  left: 0.2,
  top: 0.3,
  width: 0.64,
  height: 0.28,
};

export const RESULT_ROIS: Array<{ label: string; roi: ROI }> = [
  { label: 'text', roi: RESULT_TEXT_ROI },
  { label: 'center', roi: RESULT_CENTER_ROI },
  { label: 'legacy', roi: RESULT_ROI },
];

export const COIN_MATCH_THRESHOLD = 0.62;
export const RESULT_MATCH_THRESHOLD = 0.65;
export const HASH_MARGIN = 0.05;

// FSM thresholds
export const COIN_STREAK_THRESHOLD = 5; // Frames needed for coin detection
export const RESULT_STREAK_THRESHOLD = 3; // Frames needed for result detection
export const COIN_VALIDITY_MS = 20000; // 20 seconds coin detection validity
export const COOLDOWN_MS = 5000; // 5 seconds cooldown after detection
export const CONFIDENCE_THRESHOLD = 0.6; // Minimum confidence for detection

// Capture settings
export const SCAN_FPS = 5; // Frames per second for scanning
export const CANVAS_WIDTH = 640; // Normalized canvas width (16:9)
export const CANVAS_HEIGHT = 360; // Normalized canvas height (16:9)

// Streak accumulation rates
export const STREAK_INCREASE_RATE = 1.0;
export const STREAK_DECREASE_RATE = 0.5;
export const STREAK_CHANGE_PENALTY = 1.5;
