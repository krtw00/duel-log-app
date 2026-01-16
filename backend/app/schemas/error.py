"""
共通エラーレスポンススキーマ

全APIエラーレスポンスで使用する統一フォーマット
"""

from typing import Any, List, Optional

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """
    統一エラーレスポンススキーマ

    全てのAPIエラーはこの形式で返却される。
    HTTPExceptionも含め、例外ハンドラによって
    このフォーマットに変換される。
    """

    message: str = Field(..., description="ユーザー向けエラーメッセージ")
    detail: Optional[Any] = Field(
        default=None,
        description="追加の詳細情報（バリデーションエラーの場合はエラーリスト）",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "リソースが見つかりません",
                    "detail": None,
                },
                {
                    "message": "入力値が不正です",
                    "detail": [
                        {
                            "loc": ["body", "email"],
                            "msg": "value is not a valid email address",
                            "type": "value_error.email",
                        }
                    ],
                },
            ]
        }
    }


class ValidationErrorDetail(BaseModel):
    """バリデーションエラーの詳細"""

    loc: List[str | int] = Field(..., description="エラー発生箇所")
    msg: str = Field(..., description="エラーメッセージ")
    type: str = Field(..., description="エラータイプ")


class ValidationErrorResponse(ErrorResponse):
    """バリデーションエラーレスポンス（422）"""

    detail: Optional[List[ValidationErrorDetail]] = Field(
        default=None, description="バリデーションエラーの詳細リスト"
    )


# 共通レスポンス定義（OpenAPIドキュメント用）
COMMON_ERROR_RESPONSES = {
    400: {
        "model": ErrorResponse,
        "description": "リクエストが不正",
    },
    401: {
        "model": ErrorResponse,
        "description": "認証が必要",
    },
    403: {
        "model": ErrorResponse,
        "description": "アクセス権限がありません",
    },
    404: {
        "model": ErrorResponse,
        "description": "リソースが見つかりません",
    },
    422: {
        "model": ValidationErrorResponse,
        "description": "入力値が不正です",
    },
    500: {
        "model": ErrorResponse,
        "description": "サーバー内部エラー",
    },
}
