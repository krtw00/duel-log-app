import type { ColorTarget, ROI } from './types.js';

// ROI regions (normalized 0-1 coordinates for 16:9 aspect ratio)
export const COIN_ROI: ROI = {
  left: 0.28,
  top: 0.58,
  width: 0.44,
  height: 0.12,
};

export const RESULT_ROI: ROI = {
  left: 0.05,
  top: 0.2,
  width: 0.9,
  height: 0.4,
};

// Color targets for detection
export const COIN_WIN_COLOR: ColorTarget = { r: 255, g: 215, b: 0, tolerance: 80 };
export const COIN_LOSS_COLOR: ColorTarget = { r: 192, g: 192, b: 192, tolerance: 80 };

export const RESULT_WIN_COLOR: ColorTarget = { r: 255, g: 200, b: 50, tolerance: 100 };
export const RESULT_LOSS_COLOR: ColorTarget = { r: 100, g: 100, b: 180, tolerance: 100 };

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
