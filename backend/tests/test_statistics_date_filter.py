"""統計APIの期間フィルタのテスト"""

from datetime import datetime, timedelta, timezone

from app.schemas.statistics import StatisticsFilters


def test_statistics_filters_start_date_only(
    authenticated_client, test_user, db_session
):
    """start_dateのみ指定した場合のフィルタ動作を確認"""
    start_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    filters = StatisticsFilters(start_date=start_date)
    assert filters.get_start_date() is not None
    assert filters.get_end_date() is None

    # サービスkwargsを確認
    kwargs = filters.to_service_kwargs()
    assert kwargs["start_date"] is not None
    assert kwargs["end_date"] is None
    assert kwargs["year"] is None  # タイムスタンプモード
    assert kwargs["month"] is None


def test_statistics_filters_end_date_only(authenticated_client, test_user, db_session):
    """end_dateのみ指定した場合のフィルタ動作を確認"""
    end_date = datetime.now(timezone.utc).isoformat()

    filters = StatisticsFilters(end_date=end_date)
    assert filters.get_start_date() is not None  # デフォルト90日前
    assert filters.get_end_date() is not None

    kwargs = filters.to_service_kwargs()
    assert kwargs["end_date"] is not None


def test_statistics_filters_start_and_end_date(
    authenticated_client, test_user, db_session
):
    """start_dateとend_dateの両方を指定した場合のフィルタ動作を確認"""
    start_date = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    end_date = datetime.now(timezone.utc).isoformat()

    filters = StatisticsFilters(start_date=start_date, end_date=end_date)
    assert filters.get_start_date() is not None
    assert filters.get_end_date() is not None

    kwargs = filters.to_service_kwargs()
    assert kwargs["start_date"] is not None
    assert kwargs["end_date"] is not None
    assert kwargs["year"] is None  # タイムスタンプモード
    assert kwargs["month"] is None


def test_statistics_filters_default_90_days(
    authenticated_client, test_user, db_session
):
    """フィルタ未指定時にデフォルトで90日前からの集計となることを確認"""
    filters = StatisticsFilters()
    start_date = filters.get_start_date()

    # デフォルトで90日前から取得される（year/monthが指定されていないため）
    assert start_date is not None
    # 90日前の日付であることを確認
    expected_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    ) - timedelta(days=90)
    # 数秒の誤差を許容
    assert abs((start_date - expected_start).total_seconds()) < 5


def test_statistics_filters_year_month_priority(
    authenticated_client, test_user, db_session
):
    """year/monthが指定されている場合はstart_dateのデフォルトが無効になることを確認"""
    filters = StatisticsFilters(year=2024, month=1)
    start_date = filters.get_start_date()

    # year/monthが指定されているため、start_dateはNone
    assert start_date is None

    kwargs = filters.to_service_kwargs()
    assert kwargs["year"] == 2024
    assert kwargs["month"] == 1


def test_statistics_filters_from_timestamp_backward_compatibility(
    authenticated_client, test_user, db_session
):
    """from_timestampが後方互換性のためにstart_dateとして機能することを確認"""
    from_timestamp = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()

    filters = StatisticsFilters(from_timestamp=from_timestamp)
    start_date = filters.get_start_date()

    assert start_date is not None

    kwargs = filters.to_service_kwargs()
    assert kwargs["start_date"] is not None
    assert kwargs["year"] is None  # from_timestamp指定時はyear/monthを無効化
    assert kwargs["month"] is None


def test_statistics_filters_start_date_priority_over_from_timestamp(
    authenticated_client, test_user, db_session
):
    """start_dateがfrom_timestampより優先されることを確認"""
    start_date = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    from_timestamp = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()

    filters = StatisticsFilters(start_date=start_date, from_timestamp=from_timestamp)
    result_start_date = filters.get_start_date()

    # start_dateが優先される
    assert result_start_date == datetime.fromisoformat(
        start_date.replace("Z", "+00:00")
    )


def test_statistics_api_with_start_date(
    authenticated_client, test_user, test_deck, test_opponent_deck, db_session
):
    """統計APIでstart_dateパラメータが正しく動作することを確認"""
    # テストデータ作成: 過去7日間のデュエル
    from app.models.duel import Duel

    now = datetime.now(timezone.utc)
    for i in range(7):
        duel = Duel(
            user_id=test_user.id,
            deck_id=test_deck.id,
            opponent_deck_id=test_opponent_deck.id,
            game_mode="RANK",
            rank=1,  # LEGEND = 1
            is_win=(i % 2 == 0),
            won_coin_toss=True,
            is_going_first=True,
            played_date=now - timedelta(days=i),
        )
        db_session.add(duel)
    db_session.commit()

    # start_dateを3日前に設定
    start_date = (now - timedelta(days=3)).isoformat()
    response = authenticated_client.get(
        "/statistics", params={"start_date": start_date, "include_duels": True}
    )

    assert response.status_code == 200
    data = response.json()

    # RANKモードのデュエルを確認（過去3日分のみ）
    rank_duels = data["RANK"]["duels"]
    assert len(rank_duels) == 4  # 0, 1, 2, 3日前の4件


def test_statistics_api_with_end_date(
    authenticated_client, test_user, test_deck, test_opponent_deck, db_session
):
    """統計APIでend_dateパラメータが正しく動作することを確認"""
    from app.models.duel import Duel

    now = datetime.now(timezone.utc)
    for i in range(7):
        duel = Duel(
            user_id=test_user.id,
            deck_id=test_deck.id,
            opponent_deck_id=test_opponent_deck.id,
            game_mode="RANK",
            rank=1,  # LEGEND = 1
            is_win=(i % 2 == 0),
            won_coin_toss=True,
            is_going_first=True,
            played_date=now - timedelta(days=i),
        )
        db_session.add(duel)
    db_session.commit()

    # end_dateを3日前に設定
    end_date = (now - timedelta(days=3)).isoformat()
    response = authenticated_client.get(
        "/statistics",
        params={
            "start_date": (now - timedelta(days=10)).isoformat(),
            "end_date": end_date,
            "include_duels": True,
        },
    )

    assert response.status_code == 200
    data = response.json()

    # RANKモードのデュエルを確認（3日前以前のみ）
    rank_duels = data["RANK"]["duels"]
    assert len(rank_duels) == 4  # 3, 4, 5, 6日前の4件


def test_statistics_api_cache(
    authenticated_client, test_user, test_deck, test_opponent_deck, db_session
):
    """統計APIのキャッシュが正しく動作することを確認"""
    from app.core.cache import cache
    from app.models.duel import Duel

    # キャッシュをクリア
    cache.clear()

    now = datetime.now(timezone.utc)
    duel = Duel(
        user_id=test_user.id,
        deck_id=test_deck.id,
        opponent_deck_id=test_opponent_deck.id,
        game_mode="RANK",
        is_win=True,
        won_coin_toss=True,
        is_going_first=True,
        played_date=now,
    )
    db_session.add(duel)
    db_session.commit()

    # 1回目のリクエスト（キャッシュなし）
    start_date = (now - timedelta(days=7)).isoformat()
    response1 = authenticated_client.get(
        "/statistics",
        params={"start_date": start_date, "include_duels": False},
    )
    assert response1.status_code == 200
    data1 = response1.json()

    # 2回目のリクエスト（キャッシュあり）
    response2 = authenticated_client.get(
        "/statistics",
        params={"start_date": start_date, "include_duels": False},
    )
    assert response2.status_code == 200
    data2 = response2.json()

    # 結果が同じであることを確認（キャッシュから取得）
    assert data1 == data2

    # 異なるパラメータでは異なるキャッシュが使用される
    response3 = authenticated_client.get(
        "/statistics",
        params={
            "start_date": (now - timedelta(days=14)).isoformat(),
            "include_duels": False,
        },
    )
    assert response3.status_code == 200

    # キャッシュクリーンアップ
    cache.clear()
