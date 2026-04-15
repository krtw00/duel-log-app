import { describe, expect, it } from 'vitest';
import {
  parseCoinText,
  parseResultMessageText,
  parseSelectionPromptText,
  parseTurnOrderText,
} from '../ocr.js';

const SELF_SELECT_PROMPT =
  '\u5148\u653b\u30fb\u5f8c\u653b\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044';
const OPPONENT_SELECT_PROMPT =
  '\u5bfe\u6226\u76f8\u624b\u304c\u5148\u653b\u30fb\u5f8c\u653b\u3092\u9078\u629e\u3057\u3066\u3044\u307e\u3059';
const YOU_GO_FIRST_PROMPT = '\u3042\u306a\u305f\u304c\u5148\u653b\u3067\u3059\u3002';
const YOU_GO_SECOND_PROMPT = '\u3042\u306a\u305f\u304c\u5f8c\u653b\u3067\u3059\u3002';
const GO_FIRST_SHORT_PROMPT = '\u5148\u653b\u3067\u3059';
const GO_SECOND_SHORT_PROMPT = '\u5f8c\u653b\u3067\u3059';
const FALSE_POSITIVE_PROMPT =
  '\u79fb\u884c\u3059\u308b\u30d5\u30a7\u30a4\u30b9\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044';
const OPPONENT_NOISY_PROMPT_1 =
  '\u751f\u307e \u6709 \u30fb \u5f8c\u653b \u3092 \u9078\u629e \u3057 \u3066 \u3044\u307e \u3059';
const OPPONENT_NOISY_PROMPT_2 =
  '\u3057 \u9593 \u76f8 \u624b \u304c \u5b8c \u5974 \u30fb \u5f8c\u653b \u3092 \u9078\u629e \u3057 \u3066 \u304d\u307e \u3059';
const RESULT_WIN_MESSAGE = '\u76f8\u624b\u304c\u964d\u53c2\u3057\u307e\u3057\u305f';
const RESULT_LOSS_MESSAGE = '\u964d\u53c2\u3057\u307e\u3057\u305f';

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

  it('does not treat unrelated selection prompts as coin selection', () => {
    expect(parseSelectionPromptText(FALSE_POSITIVE_PROMPT)).toBeNull();
  });

  it('treats noisy in-progress opponent prompts as opponent selection', () => {
    expect(parseSelectionPromptText(OPPONENT_NOISY_PROMPT_1)).toEqual({
      state: 'opponentSelect',
      confidence: 0.92,
    });
    expect(parseSelectionPromptText(OPPONENT_NOISY_PROMPT_2)).toEqual({
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

  it('maps a first-player confirmation prompt to coin won as a fallback', () => {
    expect(parseCoinText(YOU_GO_FIRST_PROMPT)).toEqual({
      result: 'won',
      confidence: 0.96,
    });
  });

  it('maps a second-player confirmation prompt to coin lost as a fallback', () => {
    expect(parseCoinText(YOU_GO_SECOND_PROMPT)).toEqual({
      result: 'lost',
      confidence: 0.96,
    });
  });

  it('does not map unrelated prompts to a coin result', () => {
    expect(parseCoinText(FALSE_POSITIVE_PROMPT)).toBeNull();
  });

  it('maps noisy opponent selection prompts to coin lost', () => {
    expect(parseCoinText(OPPONENT_NOISY_PROMPT_1)).toEqual({
      result: 'lost',
      confidence: 0.92,
    });
    expect(parseCoinText(OPPONENT_NOISY_PROMPT_2)).toEqual({
      result: 'lost',
      confidence: 0.92,
    });
  });
});

describe('parseTurnOrderText', () => {
  it('detects a first-player confirmation prompt', () => {
    expect(parseTurnOrderText(YOU_GO_FIRST_PROMPT)).toEqual({
      isFirst: true,
      confidence: 0.96,
    });
  });

  it('tolerates light OCR noise in first-player confirmation text', () => {
    expect(parseTurnOrderText('\u95a2\u3089\u306a\u305f\u304c\u5148\u653b\u3067\u3059')).toEqual({
      isFirst: true,
      confidence: 0.96,
    });
  });

  it('detects a second-player confirmation prompt', () => {
    expect(parseTurnOrderText(YOU_GO_SECOND_PROMPT)).toEqual({
      isFirst: false,
      confidence: 0.96,
    });
  });

  it('detects a short first-player confirmation prompt without self reference', () => {
    expect(parseTurnOrderText(GO_FIRST_SHORT_PROMPT)).toEqual({
      isFirst: true,
      confidence: 0.96,
    });
  });

  it('detects a short second-player confirmation prompt without self reference', () => {
    expect(parseTurnOrderText(GO_SECOND_SHORT_PROMPT)).toEqual({
      isFirst: false,
      confidence: 0.96,
    });
  });

  it('ignores selection prompts that do not settle turn order yet', () => {
    expect(parseTurnOrderText(SELF_SELECT_PROMPT)).toBeNull();
    expect(parseTurnOrderText(OPPONENT_SELECT_PROMPT)).toBeNull();
  });
});

describe('parseResultMessageText', () => {
  it('detects opponent surrender as a win', () => {
    expect(parseResultMessageText(RESULT_WIN_MESSAGE)).toEqual({
      result: 'win',
      confidence: 0.94,
    });
  });

  it('detects self surrender as a loss', () => {
    expect(parseResultMessageText(RESULT_LOSS_MESSAGE)).toEqual({
      result: 'loss',
      confidence: 0.94,
    });
  });
});
