import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateProfile,
  updateThemePreference,
  updateStreamerMode,
  deleteAccount,
  exportUserData,
  importUserData,
  generateOBSToken,
} from '../userService';
import { api } from '../api';
import type { User } from '../../types';

vi.mock('../api', () => ({
  api: {
    put: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('userService', () => {
  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    username: 'testuser',
    theme_preference: 'dark',
    streamer_mode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should call api.put with correct parameters', async () => {
      const updateData = { username: 'newname', email: 'new@example.com' };
      vi.mocked(api.put).mockResolvedValue({ data: { ...mockUser, ...updateData } });

      const result = await updateProfile(updateData);

      expect(api.put).toHaveBeenCalledWith('/me', updateData);
      expect(result.username).toBe('newname');
      expect(result.email).toBe('new@example.com');
    });

    it('should handle partial updates', async () => {
      const updateData = { theme_preference: 'light' };
      vi.mocked(api.put).mockResolvedValue({ data: { ...mockUser, ...updateData } });

      const result = await updateProfile(updateData);

      expect(api.put).toHaveBeenCalledWith('/me', updateData);
      expect(result.theme_preference).toBe('light');
    });
  });

  describe('updateThemePreference', () => {
    it('should call updateProfile with theme_preference', async () => {
      vi.mocked(api.put).mockResolvedValue({ data: { ...mockUser, theme_preference: 'light' } });

      const result = await updateThemePreference('light');

      expect(api.put).toHaveBeenCalledWith('/me', { theme_preference: 'light' });
      expect(result.theme_preference).toBe('light');
    });
  });

  describe('updateStreamerMode', () => {
    it('should call updateProfile with streamer_mode true', async () => {
      vi.mocked(api.put).mockResolvedValue({ data: { ...mockUser, streamer_mode: true } });

      const result = await updateStreamerMode(true);

      expect(api.put).toHaveBeenCalledWith('/me', { streamer_mode: true });
      expect(result.streamer_mode).toBe(true);
    });

    it('should call updateProfile with streamer_mode false', async () => {
      vi.mocked(api.put).mockResolvedValue({ data: { ...mockUser, streamer_mode: false } });

      const result = await updateStreamerMode(false);

      expect(api.put).toHaveBeenCalledWith('/me', { streamer_mode: false });
      expect(result.streamer_mode).toBe(false);
    });
  });

  describe('deleteAccount', () => {
    it('should call api.delete for /me', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: {} });

      await deleteAccount();

      expect(api.delete).toHaveBeenCalledWith('/me');
    });
  });

  describe('exportUserData', () => {
    it('should call api.get with blob responseType', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' });
      vi.mocked(api.get).mockResolvedValue({ data: mockBlob });

      const result = await exportUserData();

      expect(api.get).toHaveBeenCalledWith('/me/export', { responseType: 'blob' });
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('importUserData', () => {
    it('should call api.post with FormData', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const mockResponse = { created_count: 10, skipped_count: 2, errors: [] };
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

      const result = await importUserData(mockFile);

      expect(api.post).toHaveBeenCalledWith('/me/import', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result.created_count).toBe(10);
      expect(result.skipped_count).toBe(2);
      expect(result.errors).toEqual([]);
    });

    it('should include errors in response', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const mockResponse = { created_count: 5, skipped_count: 0, errors: ['row 3: invalid data'] };
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

      const result = await importUserData(mockFile);

      expect(result.errors).toContain('row 3: invalid data');
    });
  });

  describe('generateOBSToken', () => {
    it('should call api.post and return token', async () => {
      const mockToken = { token: 'obs-token-123' };
      vi.mocked(api.post).mockResolvedValue({ data: mockToken });

      const result = await generateOBSToken();

      expect(api.post).toHaveBeenCalledWith('/auth/obs-token');
      expect(result.token).toBe('obs-token-123');
    });
  });
});
