import { describe, it, expect } from 'vitest';
import { getErrorMessage, isApiError } from '../errorHandler';

describe('errorHandler utilities', () => {
  describe('isApiError', () => {
    it('should return true for API error with response object', () => {
      const apiError = {
        response: {
          data: {
            detail: 'API error message',
          },
        },
      };
      expect(isApiError(apiError)).toBe(true);
    });

    it('should return true for API error with empty response object', () => {
      const apiError = { response: {} };
      expect(isApiError(apiError)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isApiError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isApiError(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isApiError('error')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isApiError(123)).toBe(false);
    });

    it('should return false for Error instance', () => {
      expect(isApiError(new Error('test'))).toBe(false);
    });

    it('should return false for object without response', () => {
      expect(isApiError({ message: 'error' })).toBe(false);
    });

    it('should return false for object with non-object response', () => {
      expect(isApiError({ response: 'string' })).toBe(false);
      expect(isApiError({ response: 123 })).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    describe('with API errors', () => {
      it('should extract detail from API error response', () => {
        const apiError = {
          response: {
            data: {
              detail: 'Invalid credentials',
            },
          },
        };
        expect(getErrorMessage(apiError)).toBe('Invalid credentials');
      });

      it('should return default message if detail is missing', () => {
        const apiError = {
          response: {
            data: {},
          },
        };
        expect(getErrorMessage(apiError)).toBe('エラーが発生しました');
      });

      it('should return custom default message if detail is missing', () => {
        const apiError = {
          response: {
            data: {},
          },
        };
        expect(getErrorMessage(apiError, 'カスタムエラー')).toBe('カスタムエラー');
      });

      it('should return default message if data is missing', () => {
        const apiError = {
          response: {},
        };
        expect(getErrorMessage(apiError)).toBe('エラーが発生しました');
      });
    });

    describe('with Error instances', () => {
      it('should extract message from Error', () => {
        const error = new Error('Something went wrong');
        expect(getErrorMessage(error)).toBe('Something went wrong');
      });

      it('should return default message if Error message is empty', () => {
        const error = new Error('');
        expect(getErrorMessage(error)).toBe('エラーが発生しました');
      });

      it('should handle TypeError', () => {
        const error = new TypeError('Type mismatch');
        expect(getErrorMessage(error)).toBe('Type mismatch');
      });
    });

    describe('with string errors', () => {
      it('should return string directly', () => {
        expect(getErrorMessage('Network error')).toBe('Network error');
      });

      it('should return empty string if provided', () => {
        expect(getErrorMessage('')).toBe('');
      });
    });

    describe('with other types', () => {
      it('should return default message for null', () => {
        expect(getErrorMessage(null)).toBe('エラーが発生しました');
      });

      it('should return default message for undefined', () => {
        expect(getErrorMessage(undefined)).toBe('エラーが発生しました');
      });

      it('should return default message for numbers', () => {
        expect(getErrorMessage(404)).toBe('エラーが発生しました');
      });

      it('should return default message for plain objects', () => {
        expect(getErrorMessage({ foo: 'bar' })).toBe('エラーが発生しました');
      });

      it('should return custom default message for unknown types', () => {
        expect(getErrorMessage(null, 'カスタムエラー')).toBe('カスタムエラー');
      });
    });
  });
});
