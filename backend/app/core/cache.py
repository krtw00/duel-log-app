"""シンプルなインメモリキャッシュモジュール。

TTL（Time To Live）付きのキャッシュを提供。
統計APIのレスポンスをキャッシュしてパフォーマンスを向上させる。
"""

import hashlib
import json
import threading
import time
from typing import Any, Dict, Optional


class CacheEntry:
    """キャッシュエントリ。"""

    def __init__(self, value: Any, ttl: int):
        """キャッシュエントリを初期化。

        Args:
            value: キャッシュする値
            ttl: 有効期限（秒）
        """
        self.value = value
        self.expires_at = time.time() + ttl

    def is_expired(self) -> bool:
        """エントリが有効期限切れかどうかを判定。

        Returns:
            有効期限切れの場合True
        """
        return time.time() > self.expires_at


class InMemoryCache:
    """TTL付きインメモリキャッシュ。

    スレッドセーフなキャッシュ実装。
    主に統計APIのレスポンスをキャッシュする用途で使用。
    """

    def __init__(self):
        """キャッシュを初期化。"""
        self._cache: Dict[str, CacheEntry] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        """キャッシュから値を取得。

        Args:
            key: キャッシュキー

        Returns:
            キャッシュされた値。存在しないか有効期限切れの場合None
        """
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None

            if entry.is_expired():
                # 有効期限切れのエントリを削除
                del self._cache[key]
                return None

            return entry.value

    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        """キャッシュに値を設定。

        Args:
            key: キャッシュキー
            value: キャッシュする値
            ttl: 有効期限（秒）、デフォルトは300秒（5分）
        """
        with self._lock:
            self._cache[key] = CacheEntry(value, ttl)

    def delete(self, key: str) -> None:
        """キャッシュから値を削除。

        Args:
            key: キャッシュキー
        """
        with self._lock:
            self._cache.pop(key, None)

    def clear(self) -> None:
        """キャッシュを全てクリア。"""
        with self._lock:
            self._cache.clear()

    def cleanup_expired(self) -> int:
        """有効期限切れのエントリをクリーンアップ。

        Returns:
            削除されたエントリの数
        """
        with self._lock:
            expired_keys = [
                key for key, entry in self._cache.items() if entry.is_expired()
            ]
            for key in expired_keys:
                del self._cache[key]
            return len(expired_keys)


# グローバルキャッシュインスタンス
cache = InMemoryCache()


def generate_cache_key(prefix: str, user_id: int, **params: Any) -> str:
    """キャッシュキーを生成。

    Args:
        prefix: キープレフィックス（例: "statistics", "matchup"）
        user_id: ユーザーID
        **params: その他のパラメータ（フィルタ条件など）

    Returns:
        生成されたキャッシュキー
    """
    # パラメータを安定したJSON文字列に変換
    params_str = json.dumps(params, sort_keys=True, ensure_ascii=False)
    # ハッシュ化して短くする
    params_hash = hashlib.md5(params_str.encode("utf-8")).hexdigest()
    return f"{prefix}:user_{user_id}:{params_hash}"
