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
    email: EmailStr
    is_admin: bool
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


class OrphanedSharedUrlsScanResponse(BaseModel):
    """孤立共有URLスキャン結果"""

    orphaned_count: int


class OrphanedSharedUrlsCleanupResponse(BaseModel):
    """孤立共有URLクリーンアップ結果"""

    success: bool
    deleted_count: int
    message: str


class ExpiredSharedUrlsScanResponse(BaseModel):
    """期限切れ共有URLスキャン結果"""

    expired_count: int
    oldest_expired: Optional[datetime] = None


class ExpiredSharedUrlsCleanupResponse(BaseModel):
    """期限切れ共有URLクリーンアップ結果"""

    success: bool
    deleted_count: int
    message: str
