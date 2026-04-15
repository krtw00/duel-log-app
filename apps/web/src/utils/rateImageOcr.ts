type RegionPreset = {
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

type VariantPreset = {
  label: string;
  region: RegionPreset;
  threshold: number;
};

type ValueMode = 'RATE' | 'DC';

type GlyphBox = {
  left: number;
  top: number;
  width: number;
  height: number;
  area: number;
};

type RecognizedGlyph = {
  char: string;
  score: number;
  box: GlyphBox;
};

type TextCandidate = {
  token: string;
  value: number;
  score: number;
};

export type RateOcrCandidate = TextCandidate;

export type RateOcrAttempt = {
  label: string;
  text: string;
  candidate: RateOcrCandidate | null;
};

export type RateOcrResult = {
  value: number | null;
  rawText: string;
  attemptLabel: string | null;
  attempts: RateOcrAttempt[];
};

const MIN_IMAGE_EDGE = 1200;
const TEMPLATE_WIDTH = 15;
const TEMPLATE_HEIGHT = 21;

const RATE_FINAL_REGION: RegionPreset = {
  label: 'rate-final',
  left: 0.555,
  top: 0.425,
  width: 0.23,
  height: 0.13,
};
const RATE_VALUE_LINE_REGION: RegionPreset = {
  label: 'rate-value-line',
  left: 0.305,
  top: 0.425,
  width: 0.49,
  height: 0.13,
};
const RATE_RESULT_BAND_REGION: RegionPreset = {
  label: 'rate-result-band',
  left: 0.22,
  top: 0.36,
  width: 0.58,
  height: 0.22,
};
const DC_FINAL_REGION: RegionPreset = {
  label: 'dc-final',
  left: 0.52,
  top: 0.425,
  width: 0.27,
  height: 0.13,
};
const DC_VALUE_LINE_REGION: RegionPreset = {
  label: 'dc-value-line',
  left: 0.29,
  top: 0.425,
  width: 0.5,
  height: 0.13,
};
const DC_RESULT_BAND_REGION: RegionPreset = {
  label: 'dc-result-band',
  left: 0.22,
  top: 0.36,
  width: 0.58,
  height: 0.22,
};

const RATE_VARIANTS: VariantPreset[] = [
  { label: 'rate-final-160', region: RATE_FINAL_REGION, threshold: 160 },
  { label: 'rate-final-175', region: RATE_FINAL_REGION, threshold: 175 },
  { label: 'rate-line-160', region: RATE_VALUE_LINE_REGION, threshold: 160 },
  { label: 'rate-line-175', region: RATE_VALUE_LINE_REGION, threshold: 175 },
  { label: 'rate-band-175', region: RATE_RESULT_BAND_REGION, threshold: 175 },
];

const DC_VARIANTS: VariantPreset[] = [
  { label: 'dc-final-160', region: DC_FINAL_REGION, threshold: 160 },
  { label: 'dc-final-175', region: DC_FINAL_REGION, threshold: 175 },
  { label: 'dc-line-160', region: DC_VALUE_LINE_REGION, threshold: 160 },
  { label: 'dc-line-175', region: DC_VALUE_LINE_REGION, threshold: 175 },
  { label: 'dc-band-175', region: DC_RESULT_BAND_REGION, threshold: 175 },
];

const DIGIT_PATTERNS = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '11100'],
} satisfies Record<string, string[]>;

const DIGIT_TEMPLATES = Object.entries(DIGIT_PATTERNS).map(([char, rows]) => ({
  char,
  pixels: rasterizePattern(rows),
}));

function normalizeValueText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[»≫〉》＞]/g, '>')
    .replace(/[Oo〇○◯]/g, '0')
    .replace(/[Il｜|!]/g, '1')
    .replace(/[Ss]/g, '5')
    .replace(/[Bb]/g, '8')
    .replace(/[．。]/g, '.')
    .replace(/[，､]/g, ',')
    .replace(/\s+/g, '')
    .trim();
}

function parseValueToken(token: string, mode: ValueMode): number | null {
  let normalized = normalizeValueText(token);
  if (mode === 'DC') {
    normalized = normalized.replace(/[.,]/g, '');
  } else if (normalized.includes(',')) {
    const commaCount = (normalized.match(/,/g) ?? []).length;
    if (!normalized.includes('.') && commaCount === 1) {
      const commaIndex = normalized.indexOf(',');
      const decimals = normalized.length - commaIndex - 1;
      normalized =
        decimals >= 1 && decimals <= 2
          ? `${normalized.slice(0, commaIndex)}.${normalized.slice(commaIndex + 1)}`
          : normalized.replace(/,/g, '');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  }

  if (!normalized || !/\d/.test(normalized)) return null;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function extractCandidateFromText(text: string, mode: ValueMode): TextCandidate | null {
  const normalized = normalizeValueText(text);
  const matches =
    mode === 'RATE'
      ? [...normalized.matchAll(/\d{3,4}(?:[.,]\d{1,2})?/g)]
      : [...normalized.matchAll(/\d[\d.,]{2,7}/g)];

  let best: TextCandidate | null = null;
  for (const match of matches) {
    const token = match[0];
    if (!token) continue;

    const value = parseValueToken(token, mode);
    if (value == null) continue;

    let score = token.length;
    const index = match.index ?? 0;
    const isTail = index + token.length >= normalized.length - 1;
    if (isTail) score += 6;
    if (index / Math.max(normalized.length, 1) >= 0.55) score += 3;
    if (mode === 'RATE' && token.includes('.')) score += 4;
    if (normalized.includes('>') && index > normalized.lastIndexOf('>')) score += 8;

    if (
      !best ||
      score > best.score ||
      (score === best.score && index > normalized.lastIndexOf(best.token))
    ) {
      best = { token, value, score };
    }
  }

  return best;
}

export function extractBestRateCandidate(text: string): RateOcrCandidate | null {
  return extractCandidateFromText(text, 'RATE');
}

export function extractBestDcCandidate(text: string): RateOcrCandidate | null {
  return extractCandidateFromText(text, 'DC');
}

function rasterizePattern(rows: string[]): Uint8Array {
  const sourceHeight = rows.length;
  const sourceWidth = rows[0]?.length ?? 1;
  const pixels = new Uint8Array(TEMPLATE_WIDTH * TEMPLATE_HEIGHT);

  for (let y = 0; y < TEMPLATE_HEIGHT; y += 1) {
    const sourceY = Math.min(sourceHeight - 1, Math.floor((y / TEMPLATE_HEIGHT) * sourceHeight));
    const row = rows[sourceY] ?? '';
    for (let x = 0; x < TEMPLATE_WIDTH; x += 1) {
      const sourceX = Math.min(sourceWidth - 1, Math.floor((x / TEMPLATE_WIDTH) * sourceWidth));
      pixels[y * TEMPLATE_WIDTH + x] = row[sourceX] === '1' ? 1 : 0;
    }
  }

  return pixels;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function applyMorphologicalClose(binary: Uint8Array, width: number, height: number): Uint8Array {
  const dilated = new Uint8Array(binary.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let on = 0;
      for (let dy = -1; dy <= 1 && !on; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (binary[ny * width + nx]) {
            on = 1;
            break;
          }
        }
      }
      dilated[y * width + x] = on;
    }
  }

  const eroded = new Uint8Array(binary.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let on = 1;
      for (let dy = -1; dy <= 1 && on; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || !dilated[ny * width + nx]) {
            on = 0;
            break;
          }
        }
      }
      eroded[y * width + x] = on;
    }
  }

  return eroded;
}

function extractGlyphBoxes(binary: Uint8Array, width: number, height: number): GlyphBox[] {
  const visited = new Uint8Array(binary.length);
  const boxes: GlyphBox[] = [];
  const stack: number[] = [];

  for (let index = 0; index < binary.length; index += 1) {
    if (!binary[index] || visited[index]) continue;

    visited[index] = 1;
    stack.push(index);

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let area = 0;

    while (stack.length > 0) {
      const current = stack.pop() ?? 0;
      const x = current % width;
      const y = Math.floor(current / width);

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      area += 1;

      const neighbors = [current - 1, current + 1, current - width, current + width];
      for (const next of neighbors) {
        if (next < 0 || next >= binary.length) continue;
        const nx = next % width;
        const ny = Math.floor(next / width);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        if (!binary[next] || visited[next]) continue;
        visited[next] = 1;
        stack.push(next);
      }
    }

    const box = {
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      area,
    };

    if (box.area >= 8 && box.width >= 2 && box.height >= 2) {
      boxes.push(box);
    }
  }

  return boxes.sort((a, b) => a.left - b.left || a.top - b.top);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);
}

function sampleGlyph(binary: Uint8Array, width: number, glyph: GlyphBox): Uint8Array {
  const sampled = new Uint8Array(TEMPLATE_WIDTH * TEMPLATE_HEIGHT);

  for (let y = 0; y < TEMPLATE_HEIGHT; y += 1) {
    const startY = glyph.top + Math.floor((y / TEMPLATE_HEIGHT) * glyph.height);
    const endY = glyph.top + Math.ceil(((y + 1) / TEMPLATE_HEIGHT) * glyph.height);
    for (let x = 0; x < TEMPLATE_WIDTH; x += 1) {
      const startX = glyph.left + Math.floor((x / TEMPLATE_WIDTH) * glyph.width);
      const endX = glyph.left + Math.ceil(((x + 1) / TEMPLATE_WIDTH) * glyph.width);

      let hits = 0;
      let total = 0;
      for (let sy = startY; sy < endY; sy += 1) {
        for (let sx = startX; sx < endX; sx += 1) {
          const clampedX = clamp(sx, 0, width - 1);
          const index = sy * width + clampedX;
          hits += binary[index] ?? 0;
          total += 1;
        }
      }

      sampled[y * TEMPLATE_WIDTH + x] = total > 0 && hits / total >= 0.35 ? 1 : 0;
    }
  }

  return sampled;
}

function diceScore(a: Uint8Array, b: Uint8Array): number {
  let intersection = 0;
  let aCount = 0;
  let bCount = 0;
  const length = Math.min(a.length, b.length);

  for (let i = 0; i < length; i += 1) {
    if (a[i]) aCount += 1;
    if (b[i]) bCount += 1;
    if (a[i] && b[i]) intersection += 1;
  }

  if (aCount === 0 && bCount === 0) return 1;
  return (2 * intersection) / Math.max(1, aCount + bCount);
}

function classifyGlyph(
  binary: Uint8Array,
  width: number,
  glyph: GlyphBox,
  medianHeight: number,
): RecognizedGlyph | null {
  if (medianHeight > 0 && glyph.height <= medianHeight * 0.32 && glyph.width <= glyph.height * 1.5) {
    return { char: '.', score: 0.95, box: glyph };
  }

  if (medianHeight > 0 && glyph.height <= medianHeight * 0.22 && glyph.width >= glyph.height * 1.6) {
    return { char: '-', score: 0.92, box: glyph };
  }

  const sample = sampleGlyph(binary, width, glyph);
  let best: RecognizedGlyph | null = null;

  for (const template of DIGIT_TEMPLATES) {
    const score = diceScore(sample, template.pixels);
    if (!best || score > best.score) {
      best = { char: template.char, score, box: glyph };
    }
  }

  return best && best.score >= 0.48 ? best : null;
}

function recognizeTemplateText(binary: Uint8Array, width: number, height: number): {
  text: string;
  confidence: number;
} {
  const boxes = extractGlyphBoxes(binary, width, height);
  if (boxes.length === 0) return { text: '', confidence: 0 };

  const medianHeight = median(boxes.map((box) => box.height));
  const recognized: RecognizedGlyph[] = [];

  for (const box of boxes) {
    const glyph = classifyGlyph(binary, width, box, medianHeight);
    if (glyph) {
      recognized.push(glyph);
    }
  }

  if (recognized.length === 0) return { text: '', confidence: 0 };

  const text = recognized.map((glyph) => glyph.char).join('');
  const confidence =
    recognized.reduce((sum, glyph) => sum + glyph.score, 0) / Math.max(1, recognized.length);

  return { text, confidence };
}

async function recognizeValueFromFile(file: Blob, mode: ValueMode): Promise<RateOcrResult> {
  const variants = mode === 'RATE' ? RATE_VARIANTS : DC_VARIANTS;
  const source = await createImageBitmap(file);

  try {
    return recognizeValueFromSource(source, source.width, source.height, mode, variants);
  } finally {
    source.close();
  }
}

function recognizeValueFromSource(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  mode: ValueMode,
  variants: VariantPreset[],
): RateOcrResult {
  const attempts: RateOcrAttempt[] = [];
  let bestAttempt: RateOcrAttempt | null = null;
  let bestConfidence = -1;

  for (const preset of variants) {
    const { binary, width, height } = createBinaryImageFromSource(
      source,
      sourceWidth,
      sourceHeight,
      preset,
    );
    const { text, confidence } = recognizeTemplateText(binary, width, height);
    const candidate = extractCandidateFromText(text, mode);
    const attempt = {
      label: preset.label,
      text,
      candidate: candidate
        ? {
            ...candidate,
            score: candidate.score + confidence * 10,
          }
        : null,
    };

    attempts.push(attempt);

    const nextScore = attempt.candidate?.score ?? -1;
    const totalScore = nextScore + confidence;
    if (!bestAttempt || totalScore > bestConfidence) {
      bestAttempt = attempt;
      bestConfidence = totalScore;
    }
  }

  return {
    value: bestAttempt?.candidate?.value ?? null,
    rawText: bestAttempt?.text ?? '',
    attemptLabel: bestAttempt?.label ?? null,
    attempts,
  };
}

function createBinaryImageFromSource(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  preset: VariantPreset,
): { binary: Uint8Array; width: number; height: number } {
  const cropWidth = Math.max(1, Math.floor(sourceWidth * preset.region.width));
  const cropHeight = Math.max(1, Math.floor(sourceHeight * preset.region.height));
  const cropX = Math.max(0, Math.floor(sourceWidth * preset.region.left));
  const cropY = Math.max(0, Math.floor(sourceHeight * preset.region.top));
  const scale = Math.max(1, MIN_IMAGE_EDGE / Math.max(cropWidth, cropHeight));
  const width = Math.max(1, Math.round(cropWidth * scale));
  const height = Math.max(1, Math.round(cropHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Template matching canvas initialization failed');
  }

  ctx.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const binary = new Uint8Array(width * height);

  for (let i = 0; i < width * height; i += 1) {
    const index = i * 4;
    const r = imageData.data[index] ?? 0;
    const g = imageData.data[index + 1] ?? 0;
    const b = imageData.data[index + 2] ?? 0;
    const lum = luminance(r, g, b);
    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    const isWhiteish = lum >= preset.threshold && maxChannel - minChannel <= 42;
    binary[i] = isWhiteish ? 1 : 0;
  }

  return {
    binary: applyMorphologicalClose(binary, width, height),
    width,
    height,
  };
}

export function recognizeRateValueFromVideoFrame(video: HTMLVideoElement): RateOcrResult {
  return recognizeValueFromSource(video, video.videoWidth, video.videoHeight, 'RATE', RATE_VARIANTS);
}

export function recognizeDcValueFromVideoFrame(video: HTMLVideoElement): RateOcrResult {
  return recognizeValueFromSource(video, video.videoWidth, video.videoHeight, 'DC', DC_VARIANTS);
}

export async function recognizeRateValueFromFile(file: Blob): Promise<RateOcrResult> {
  return recognizeValueFromFile(file, 'RATE');
}

export async function recognizeDcValueFromFile(file: Blob): Promise<RateOcrResult> {
  return recognizeValueFromFile(file, 'DC');
}
