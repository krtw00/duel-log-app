import { vi } from 'vitest';

export const mockApiPost = vi.fn();
export const mockApiGet = vi.fn();
export const mockApiDelete = vi.fn();

export const api = {
  post: mockApiPost,
  get: mockApiGet,
  delete: mockApiDelete,
};
