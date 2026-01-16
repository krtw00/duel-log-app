export interface UserAdminResponse {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  createdat: string; // ISO 8601 date string
}

export interface UsersListResponse {
  users: UserAdminResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface UpdateAdminStatusRequest {
  is_admin: boolean;
}

export interface UpdateAdminStatusResponse {
  success: boolean;
  user: UserAdminResponse;
}

// ========================================
// システム統計
// ========================================

export interface UserStats {
  total: number;
  new_this_month: number;
  active_this_month: number;
}

export interface DeckStats {
  active: number;
  archived: number;
  player_decks: number;
  opponent_decks: number;
}

export interface GameModeStats {
  RANK: number;
  RATE: number;
  EVENT: number;
  DC: number;
}

export interface DuelStats {
  total: number;
  this_month: number;
  by_game_mode: GameModeStats;
}

export interface StatisticsOverviewResponse {
  users: UserStats;
  decks: DeckStats;
  duels: DuelStats;
}

export interface TimelineEntry {
  date: string;
  count: number;
}

export interface DuelsTimelineResponse {
  timeline: TimelineEntry[];
}

export interface RegistrationEntry {
  month: string;
  count: number;
}

export interface UserRegistrationsResponse {
  registrations: RegistrationEntry[];
}

// ========================================
// メンテナンス
// ========================================

export interface OrphanedDataScanResponse {
  orphaned_opponent_decks: number;
}

export interface OrphanedDataCleanupResponse {
  success: boolean;
  deleted_decks: number;
  message: string;
}

export interface OrphanedSharedUrlsScanResponse {
  orphaned_count: number;
}

export interface OrphanedSharedUrlsCleanupResponse {
  success: boolean;
  deleted_count: number;
  message: string;
}

export interface ExpiredSharedUrlsScanResponse {
  expired_count: number;
  oldest_expired: string | null;
}

export interface ExpiredSharedUrlsCleanupResponse {
  success: boolean;
  deleted_count: number;
  message: string;
}
