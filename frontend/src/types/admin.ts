export interface UserAdminResponse {
  id: number;
  username: string;
  email: string | null;
  is_admin: boolean;
  status: string;
  last_login_at: string | null;
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

// ========================================
// ユーザー詳細
// ========================================

export interface UserStatsDetail {
  total_duels: number;
  this_month_duels: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  player_decks_count: number;
  opponent_decks_count: number;
  shared_statistics_count: number;
}

export interface UserFeatureUsage {
  has_obs_overlay: boolean;
  has_shared_statistics: boolean;
  has_streamer_mode: boolean;
  has_screen_analysis: boolean;
}

export interface UserDetailResponse {
  id: number;
  username: string;
  email: string | null;
  is_admin: boolean;
  status: string;
  status_reason: string | null;
  createdat: string;
  updatedat: string;
  last_login_at: string | null;
  theme_preference: string;
  streamer_mode: boolean;
  enable_screen_analysis: boolean;
  stats: UserStatsDetail;
  feature_usage: UserFeatureUsage;
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'suspended' | 'deleted';
  reason?: string;
}

export interface UpdateUserStatusResponse {
  success: boolean;
  message: string;
  user: UserDetailResponse;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

// ========================================
// メタ分析
// ========================================

export interface DeckRanking {
  rank: number;
  deck_name: string;
  usage_count: number;
  win_count: number;
  loss_count: number;
  win_rate: number;
}

export interface PopularDecksResponse {
  decks: DeckRanking[];
  total_duels: number;
  period_start: string | null;
  period_end: string | null;
}

export interface DeckTrendEntry {
  date: string;
  deck_name: string;
  usage_count: number;
  usage_rate: number;
}

export interface DeckTrendsResponse {
  trends: DeckTrendEntry[];
  top_decks: string[];
}

export interface GameModeStatDetail {
  game_mode: string;
  duel_count: number;
  user_count: number;
  percentage: number;
}

export interface GameModeStatsDetailResponse {
  stats: GameModeStatDetail[];
  total_duels: number;
}
