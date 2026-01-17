"""管理者API用のスキーマ"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr

# ========================================
# ユーザー管理
# ========================================


class UserAdminResponse(BaseModel):
    """管理者向けユーザー情報レスポンス"""

    id: int
    username: str
    email: Optional[EmailStr]
    is_admin: bool
    status: str = "active"
    last_login_at: Optional[datetime] = None
    createdat: datetime

    class Config:
        from_attributes = True


class UsersListResponse(BaseModel):
    """ユーザー一覧レスポンス"""

    users: List[UserAdminResponse]
    total: int
    page: int
    per_page: int


class UpdateAdminStatusRequest(BaseModel):
    """管理者権限更新リクエスト"""

    is_admin: bool


class UpdateAdminStatusResponse(BaseModel):
    """管理者権限更新レスポンス"""

    success: bool
    user: UserAdminResponse


# ========================================
# ユーザー詳細
# ========================================


class UserStatsDetail(BaseModel):
    """ユーザー利用統計"""

    total_duels: int
    this_month_duels: int
    total_wins: int
    total_losses: int
    win_rate: float
    player_decks_count: int
    opponent_decks_count: int
    shared_statistics_count: int


class UserFeatureUsage(BaseModel):
    """ユーザー機能利用状況"""

    has_shared_statistics: bool
    has_streamer_mode: bool
    has_screen_analysis: bool


class UserDetailResponse(BaseModel):
    """ユーザー詳細レスポンス"""

    id: int
    username: str
    email: Optional[str]
    is_admin: bool
    status: str
    status_reason: Optional[str]
    createdat: datetime
    updatedat: datetime
    last_login_at: Optional[datetime]
    theme_preference: str
    streamer_mode: bool
    enable_screen_analysis: bool
    stats: UserStatsDetail
    feature_usage: UserFeatureUsage

    class Config:
        from_attributes = True


class UpdateUserStatusRequest(BaseModel):
    """ユーザー状態更新リクエスト"""

    status: str  # active, suspended, deleted
    reason: Optional[str] = None


class UpdateUserStatusResponse(BaseModel):
    """ユーザー状態更新レスポンス"""

    success: bool
    message: str
    user: UserDetailResponse


class PasswordResetResponse(BaseModel):
    """パスワードリセットレスポンス"""

    success: bool
    message: str


# ========================================
# システム統計
# ========================================


class UserStats(BaseModel):
    """ユーザー統計"""

    total: int
    new_this_month: int
    active_this_month: int


class DeckStats(BaseModel):
    """デッキ統計"""

    active: int
    archived: int
    player_decks: int
    opponent_decks: int


class GameModeStats(BaseModel):
    """ゲームモード別統計"""

    RANK: int = 0
    RATE: int = 0
    EVENT: int = 0
    DC: int = 0


class DuelStats(BaseModel):
    """対戦統計"""

    total: int
    this_month: int
    by_game_mode: GameModeStats


class StatisticsOverviewResponse(BaseModel):
    """統計概要レスポンス"""

    users: UserStats
    decks: DeckStats
    duels: DuelStats


class TimelineEntry(BaseModel):
    """タイムラインエントリ"""

    date: str
    count: int


class DuelsTimelineResponse(BaseModel):
    """対戦数推移レスポンス"""

    timeline: List[TimelineEntry]


class RegistrationEntry(BaseModel):
    """ユーザー登録エントリ"""

    month: str
    count: int


class UserRegistrationsResponse(BaseModel):
    """ユーザー登録数推移レスポンス"""

    registrations: List[RegistrationEntry]


# ========================================
# メンテナンス
# ========================================


class OrphanedDataScanResponse(BaseModel):
    """孤立データスキャン結果"""

    orphaned_opponent_decks: int


class OrphanedDataCleanupResponse(BaseModel):
    """孤立データクリーンアップ結果"""

    success: bool
    deleted_decks: int
    message: str


class OrphanedSharedStatisticsScanResponse(BaseModel):
    """孤立共有統計スキャン結果"""

    orphaned_count: int


class OrphanedSharedStatisticsCleanupResponse(BaseModel):
    """孤立共有統計クリーンアップ結果"""

    success: bool
    deleted_count: int
    message: str


class ExpiredSharedStatisticsScanResponse(BaseModel):
    """期限切れ共有統計スキャン結果"""

    expired_count: int
    oldest_expired: Optional[datetime] = None


class ExpiredSharedStatisticsCleanupResponse(BaseModel):
    """期限切れ共有統計クリーンアップ結果"""

    success: bool
    deleted_count: int
    message: str


# 後方互換エイリアス（非推奨）
OrphanedSharedUrlsScanResponse = OrphanedSharedStatisticsScanResponse
OrphanedSharedUrlsCleanupResponse = OrphanedSharedStatisticsCleanupResponse
ExpiredSharedUrlsScanResponse = ExpiredSharedStatisticsScanResponse
ExpiredSharedUrlsCleanupResponse = ExpiredSharedStatisticsCleanupResponse


# ========================================
# メタ分析
# ========================================


class DeckRanking(BaseModel):
    """デッキランキングエントリ"""

    rank: int
    deck_name: str
    usage_count: int
    win_count: int
    loss_count: int
    win_rate: float


class PopularDecksResponse(BaseModel):
    """人気デッキランキングレスポンス"""

    decks: List[DeckRanking]
    total_duels: int
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


class DeckTrendEntry(BaseModel):
    """デッキ使用率推移エントリ"""

    date: str
    deck_name: str
    usage_count: int
    usage_rate: float  # 全対戦に対する使用率（%）


class DeckTrendsResponse(BaseModel):
    """デッキ使用率推移レスポンス"""

    trends: List[DeckTrendEntry]
    top_decks: List[str]  # 上位デッキ名リスト


class GameModeStatDetail(BaseModel):
    """ゲームモード別詳細統計"""

    game_mode: str
    duel_count: int
    user_count: int
    percentage: float  # 全対戦に対する割合（%）


class GameModeStatsDetailResponse(BaseModel):
    """ゲームモード別統計レスポンス"""

    stats: List[GameModeStatDetail]
    total_duels: int
