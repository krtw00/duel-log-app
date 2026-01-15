/**
 * ユーザー/プロフィールAPI サービス
 * /me エンドポイントへのAPI呼び出しを集約
 */

import { api } from './api';
import type { User } from '../types';

/** プロフィール更新データ */
export interface UpdateProfileData {
  username?: string;
  email?: string;
  theme_preference?: string;
  streamer_mode?: boolean;
  enable_screen_analysis?: boolean;
}

/** データインポートレスポンス */
export interface DataImportResponse {
  created_count: number;
  skipped_count: number;
  errors: string[];
}

/**
 * プロフィールを更新
 */
export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  const response = await api.put<User>('/me', data);
  return response.data;
};

/**
 * テーマ設定を更新
 */
export const updateThemePreference = async (theme: string): Promise<User> => {
  return updateProfile({ theme_preference: theme });
};

/**
 * 配信者モードを更新
 */
export const updateStreamerMode = async (enabled: boolean): Promise<User> => {
  return updateProfile({ streamer_mode: enabled });
};

/**
 * アカウントを削除
 */
export const deleteAccount = async (): Promise<void> => {
  await api.delete('/me');
};

/**
 * ユーザーデータをエクスポート（CSV形式）
 */
export const exportUserData = async (): Promise<Blob> => {
  const response = await api.get('/me/export', {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * ユーザーデータをインポート（CSV形式）
 */
export const importUserData = async (file: File): Promise<DataImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<DataImportResponse>('/me/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * OBSトークンを生成
 */
export const generateOBSToken = async (): Promise<{ token: string }> => {
  const response = await api.post<{ token: string }>('/auth/obs-token');
  return response.data;
};
