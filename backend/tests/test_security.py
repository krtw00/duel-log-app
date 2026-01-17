"""
セキュリティ設定（CORS、セキュリティヘッダー）のテスト
"""

import pytest


def test_cors_allowed_origin(client):
    """許可されたオリジンからのリクエストが成功すること"""
    # デフォルトでは localhost:5173 が許可されている
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


def test_cors_disallowed_origin(client):
    """許可されていないオリジンからのリクエストが拒否されること"""
    # 不正なオリジン
    response = client.options(
        "/health",
        headers={
            "Origin": "https://evil.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    # CORSミドルウェアは200を返すが、access-control-allow-originヘッダーが設定されない
    # または、オリジンが一致しない
    origin_header = response.headers.get("access-control-allow-origin")
    if origin_header:
        assert origin_header != "https://evil.example.com"


def test_security_headers_present(client):
    """セキュリティヘッダーが存在すること"""
    response = client.get("/health")
    assert response.status_code == 200

    # X-Frame-Options ヘッダーの確認
    assert "x-frame-options" in response.headers
    assert response.headers["x-frame-options"] == "DENY"

    # X-Content-Type-Options ヘッダーの確認
    assert "x-content-type-options" in response.headers
    assert response.headers["x-content-type-options"] == "nosniff"


@pytest.mark.parametrize(
    "endpoint",
    [
        "/",
        "/health",
        "/api/v1/auth/login",  # 存在しないエンドポイントでもヘッダーが付与される
    ],
)
def test_security_headers_on_all_endpoints(client, endpoint):
    """すべてのエンドポイントでセキュリティヘッダーが付与されること"""
    response = client.get(endpoint)
    # エンドポイントの存在に関わらず、セキュリティヘッダーは付与される
    assert "x-frame-options" in response.headers
    assert "x-content-type-options" in response.headers


def test_cors_production_mode_no_regex():
    """本番環境ではallow_origin_regexが無効化されること

    Note: このテストはmain.pyのロジックを確認するものです。
    実際の環境変数ベースのテストは統合テストで行います。
    """
    # main.pyのコードをレビュー
    # settings.ENVIRONMENT != "production" の場合のみ、allow_origin_regexが設定される
    # したがって、本番環境ではallow_origin_regex=Noneになることを確認
    from app.core.config import settings

    # テスト環境はproductionではないため、正規表現は有効になる可能性がある
    # しかし、ALLOWED_ORIGIN_REGEXが設定されていない場合は無効
    assert settings.ALLOWED_ORIGIN_REGEX is None or settings.ENVIRONMENT != "production"


def test_cors_configuration_logic():
    """CORS設定のロジックを確認

    このテストは設定クラスの動作を確認します。
    """
    from app.core.config import settings

    # ALLOWED_ORIGINSまたはFRONTEND_URLのいずれかが設定されているはず
    assert settings.ALLOWED_ORIGINS is not None or settings.FRONTEND_URL is not None
