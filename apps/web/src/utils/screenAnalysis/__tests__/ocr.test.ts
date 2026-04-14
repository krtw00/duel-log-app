import { describe, expect, it } from 'vitest';
import { parseCoinText, parseSelectionPromptText } from '../ocr.js';

const SELF_SELECT_PROMPT =
  '\u5148\u653b\u30fb\u5f8c\u653b\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044';
const OPPONENT_SELECT_PROMPT =
  '\u5bfe\u6226\u76f8\u624b\u304c\u5148\u653b\u30fb\u5f8c\u653b\u3092\u9078\u629e\u3057\u3066\u3044\u307e\u3059';

describe('parseSelectionPromptText', () => {
  it('detects the self-select prompt', () => {
    expect(parseSelectionPromptText(SELF_SELECT_PROMPT)).toEqual({
      state: 'selfSelect',
      confidence: 0.92,
    });
  });

  it('detects the opponent-selecting prompt', () => {
    expect(parseSelectionPromptText(OPPONENT_SELECT_PROMPT)).toEqual({
      state: 'opponentSelect',
      confidence: 0.92,
    });
  });

  it('tolerates light OCR noise', () => {
    expect(
      parseSelectionPromptText(
        '\u5bfe\u6226\u76f8\u624b\u304c\u5148\u653b \u5f8c\u653b\u3092\u9078\u629e\u3057\u3066\u3044\u307e\u3059|',
      ),
    ).toEqual({
      state: 'opponentSelect',
      confidence: 0.92,
    });
  });
});

describe('parseCoinText', () => {
  it('maps the self-select prompt to coin won', () => {
    expect(parseCoinText(SELF_SELECT_PROMPT)).toEqual({
      result: 'won',
      confidence: 0.92,
    });
  });

  it('maps the opponent-selecting prompt to coin lost', () => {
    expect(parseCoinText(OPPONENT_SELECT_PROMPT)).toEqual({
      result: 'lost',
      confidence: 0.92,
    });
  });
});
