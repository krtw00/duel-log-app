import type { ROI } from './types.js';

// ROI regions (normalized 0-1 coordinates for 16:9 aspect ratio)
export const COIN_ROI: ROI = {
  left: 0.3303125,
  top: 0.6105556,
  width: 0.3359375,
  height: 0.1055556,
};

export const RESULT_ROI: ROI = {
  left: 0.086563,
  top: 0.352778,
  width: 0.822187,
  height: 0.466111,
};

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
