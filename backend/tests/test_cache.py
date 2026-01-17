"""キャッシュモジュールのテスト"""

import time

from app.core.cache import InMemoryCache, cache, generate_cache_key


def test_cache_set_and_get():
    """キャッシュの設定と取得が正しく動作することを確認"""
    test_cache = InMemoryCache()
    test_cache.set("test_key", "test_value", ttl=10)

    result = test_cache.get("test_key")
    assert result == "test_value"


def test_cache_get_nonexistent_key():
    """存在しないキーの取得がNoneを返すことを確認"""
    test_cache = InMemoryCache()
    result = test_cache.get("nonexistent_key")
    assert result is None


def test_cache_expiration():
    """TTLによるキャッシュの有効期限切れが正しく動作することを確認"""
    test_cache = InMemoryCache()
    test_cache.set("expiring_key", "expiring_value", ttl=1)

    # 直後は取得できる
    assert test_cache.get("expiring_key") == "expiring_value"

    # TTL経過後は取得できない
    time.sleep(1.1)
    assert test_cache.get("expiring_key") is None


def test_cache_delete():
    """キャッシュの削除が正しく動作することを確認"""
    test_cache = InMemoryCache()
    test_cache.set("delete_key", "delete_value")

    # 削除前は取得できる
    assert test_cache.get("delete_key") == "delete_value"

    # 削除後は取得できない
    test_cache.delete("delete_key")
    assert test_cache.get("delete_key") is None


def test_cache_clear():
    """キャッシュの全クリアが正しく動作することを確認"""
    test_cache = InMemoryCache()
    test_cache.set("key1", "value1")
    test_cache.set("key2", "value2")
    test_cache.set("key3", "value3")

    # クリア前は全て取得できる
    assert test_cache.get("key1") == "value1"
    assert test_cache.get("key2") == "value2"
    assert test_cache.get("key3") == "value3"

    # クリア後は全て取得できない
    test_cache.clear()
    assert test_cache.get("key1") is None
    assert test_cache.get("key2") is None
    assert test_cache.get("key3") is None


def test_cache_cleanup_expired():
    """有効期限切れエントリのクリーンアップが正しく動作することを確認"""
    test_cache = InMemoryCache()
    test_cache.set("key1", "value1", ttl=10)  # 有効
    test_cache.set("key2", "value2", ttl=1)  # すぐに期限切れ
    test_cache.set("key3", "value3", ttl=1)  # すぐに期限切れ

    time.sleep(1.1)

    # クリーンアップ実行
    removed_count = test_cache.cleanup_expired()
    assert removed_count == 2

    # 有効なエントリのみ残る
    assert test_cache.get("key1") == "value1"
    assert test_cache.get("key2") is None
    assert test_cache.get("key3") is None


def test_generate_cache_key():
    """キャッシュキー生成が正しく動作することを確認"""
    key1 = generate_cache_key("statistics", user_id=123, year=2024, month=1)
    key2 = generate_cache_key("statistics", user_id=123, year=2024, month=1)
    key3 = generate_cache_key("statistics", user_id=123, year=2024, month=2)

    # 同じパラメータなら同じキー
    assert key1 == key2

    # パラメータが異なれば異なるキー
    assert key1 != key3


def test_generate_cache_key_with_different_order():
    """パラメータの順序が異なってもキャッシュキーが同じになることを確認"""
    key1 = generate_cache_key(
        "statistics", user_id=123, year=2024, month=1, my_deck_id=10
    )
    key2 = generate_cache_key(
        "statistics", my_deck_id=10, month=1, year=2024, user_id=123
    )

    # パラメータの順序が異なっても同じキー
    assert key1 == key2


def test_cache_with_complex_values():
    """複雑な値（辞書、リスト）をキャッシュできることを確認"""
    test_cache = InMemoryCache()
    complex_value = {
        "list": [1, 2, 3],
        "dict": {"a": "b"},
        "nested": {"list": [{"key": "value"}]},
    }
    test_cache.set("complex_key", complex_value)

    result = test_cache.get("complex_key")
    assert result == complex_value


def test_global_cache_instance():
    """グローバルキャッシュインスタンスが正しく動作することを確認"""
    # グローバルキャッシュをクリア
    cache.clear()

    # グローバルキャッシュに設定
    cache.set("global_key", "global_value")

    # グローバルキャッシュから取得
    assert cache.get("global_key") == "global_value"

    # クリーンアップ
    cache.clear()
