/**
 * APIサービス層 バレルエクスポート
 *
 * 各種エンドポイント向けのAPIサービスを提供します。
 * コンポーネントやストアでの直接的なapi呼び出しを削減し、
 * 型安全性と再利用性を向上させます。
 */

// 共通APIクライアント
export { api, normalizeApiBaseUrl, normalizeApiRequestUrl } from './api';

// ドメイン別サービス
export * as duelService from './duelService';
export * as deckService from './deckService';
export * as statisticsService from './statisticsService';
export * as userService from './userService';
export * as adminService from './adminApi';

// 個別エクスポート（よく使う関数）
export {
  getDuels,
  createDuel,
  updateDuel,
  deleteDuel,
  getLatestValues,
  importDuelsFromCSV,
  exportDuelsToCSV,
} from './duelService';

export {
  getDecks,
  getMyDecks,
  getOpponentDecks,
  createDeck,
  updateDeck,
  deleteDeck,
  archiveAllUnusedDecks,
} from './deckService';

export {
  getStatistics,
  getAvailableDecks,
  deleteSharedStatistics,
  exportSharedStatisticsToCSV,
} from './statisticsService';

export {
  updateProfile,
  updateThemePreference,
  updateStreamerMode,
  deleteAccount,
  exportUserData,
  importUserData,
  generateOBSToken,
} from './userService';

// Admin API（既存）
export { getAdminUsers, updateUserAdminStatus } from './adminApi';

// 型エクスポート
export type {
  GetDuelsParams,
  CreateDuelData,
  UpdateDuelData,
  LatestValuesResponse,
  CSVImportResponse,
} from './duelService';
export type { GetDecksParams } from './deckService';
export type { AvailableDecksResponse } from './statisticsService';
export type { UpdateProfileData, DataImportResponse } from './userService';
