import { describe, expect, it } from 'vitest';
import { extractBestDcCandidate, extractBestRateCandidate } from '../rateImageOcr.js';

describe('extractBestRateCandidate', () => {
  it('extracts a decimal rate value', () => {
    expect(extractBestRateCandidate('現在レート 1732.4')?.value).toBe(1732.4);
  });

  it('handles OCR noise around digits', () => {
    expect(extractBestRateCandidate('RATE I732,O')?.value).toBe(1732);
  });

  it('prefers the token near a rate keyword', () => {
    expect(extractBestRateCandidate('相手 1200 / RATE 1734')?.value).toBe(1734);
  });

  it('supports full-width digits and decimal commas', () => {
    expect(extractBestRateCandidate('レート １７５０，５')?.value).toBe(1750.5);
  });

  it('prefers the final rate after the arrow in result text', () => {
    expect(extractBestRateCandidate('レート戦リザルト 1500.00 - 7.46 >> 1492.54')?.value).toBe(
      1492.54,
    );
  });

  it('returns null when no numeric candidate exists', () => {
    expect(extractBestRateCandidate('レート更新なし')).toBeNull();
  });
});

describe('extractBestDcCandidate', () => {
  it('extracts the final dc value', () => {
    expect(extractBestDcCandidate('DC RESULT 15200 >> 15340')?.value).toBe(15340);
  });

  it('ignores decimal punctuation for dc values', () => {
    expect(extractBestDcCandidate('DC 12,340')?.value).toBe(12340);
  });
});
