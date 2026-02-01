import type { ROI } from './types.js';

// ROI regions (normalized 0-1 coordinates for 16:9 aspect ratio)
export const COIN_BAR_ROI: ROI = {
  left: 0.12,
  top: 0.52,
  width: 0.76,
  height: 0.12,
};

export const COIN_BUTTONS_ROI: ROI = {
  left: 0.26,
  top: 0.66,
  width: 0.48,
  height: 0.16,
};

export const RESULT_TEXT_ROI: ROI = {
  left: 0.1,
  top: 0.3,
  width: 0.8,
  height: 0.28,
};

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

// Coin screen detection thresholds
export const COIN_BAR_DARK_MIN = 0.2;
export const COIN_BAR_TEXT_MIN = 0.006;
export const COIN_BUTTON_DARK_MIN = 0.18;
export const COIN_BUTTON_YELLOW_MIN = 0.003;

// Result text detection thresholds
export const RESULT_BRIGHT_MIN = 0.008;
export const RESULT_VICTORY_WIDTH_MIN = 0.5;
export const RESULT_LOSE_WIDTH_MIN = 0.18;
