"""
フィードバックAPI
バグ報告、機能要望、お問い合わせをGitHub Issueとして作成
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user_optional
from app.core.logging_config import get_logger
from app.models.user import User
from app.services.github_service import github_service

router = APIRouter(prefix="/feedback", tags=["feedback"])
logger = get_logger(__name__)


class BugReportRequest(BaseModel):
    """バグ報告リクエスト"""

    title: str = Field(..., min_length=1, max_length=255, description="タイトル")
    description: str = Field(..., min_length=1, max_length=5000, description="説明")
    steps: str | None = Field(None, max_length=3000, description="再現手順")
    expected: str | None = Field(None, max_length=1000, description="期待する動作")
    actual: str | None = Field(None, max_length=1000, description="実際の動作")


class EnhancementRequest(BaseModel):
    """機能要望リクエスト"""

    title: str = Field(..., min_length=1, max_length=255, description="タイトル")
    description: str = Field(..., min_length=1, max_length=5000, description="説明")
    use_case: str | None = Field(None, max_length=2000, description="ユースケース")


class ContactRequest(BaseModel):
    """お問い合わせリクエスト"""

    subject: str = Field(..., min_length=1, max_length=255, description="件名")
    message: str = Field(..., min_length=1, max_length=5000, description="メッセージ")


class FeedbackResponse(BaseModel):
    """フィードバックレスポンス"""

    success: bool
    message: str
    issue_url: str | None = None
    issue_number: int | None = None


class FeedbackStatusResponse(BaseModel):
    """フィードバック機能の状態"""

    github_enabled: bool
    contact_x_handle: str = "@krtw00"
    contact_github_url: str = "https://github.com/krtw00/duel-log-app"


def _format_bug_report_body(req: BugReportRequest) -> str:
    """バグ報告の本文をフォーマット"""
    body = f"## 説明\n{req.description}\n"

    if req.steps:
        body += f"\n## 再現手順\n{req.steps}\n"

    if req.expected:
        body += f"\n## 期待する動作\n{req.expected}\n"

    if req.actual:
        body += f"\n## 実際の動作\n{req.actual}\n"

    return body


def _format_enhancement_body(req: EnhancementRequest) -> str:
    """機能要望の本文をフォーマット"""
    body = f"## 説明\n{req.description}\n"

    if req.use_case:
        body += f"\n## ユースケース\n{req.use_case}\n"

    return body


def _format_contact_body(req: ContactRequest) -> str:
    """お問い合わせの本文をフォーマット"""
    return f"## メッセージ\n{req.message}\n"


@router.get("/status", response_model=FeedbackStatusResponse)
async def get_feedback_status():
    """フィードバック機能の状態を取得"""
    return FeedbackStatusResponse(
        github_enabled=github_service.is_configured,
    )


@router.post("/bug", response_model=FeedbackResponse)
async def submit_bug_report(
    request: BugReportRequest,
    current_user: User | None = Depends(get_current_user_optional),
):
    """バグ報告を送信"""
    if not github_service.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub連携が設定されていません",
        )

    user_email = current_user.email if current_user else None
    body = _format_bug_report_body(request)

    result = await github_service.create_issue(
        title=f"[Bug] {request.title}",
        body=body,
        issue_type="bug",
        user_email=user_email,
    )

    if result:
        return FeedbackResponse(
            success=True,
            message="バグ報告を送信しました。ご報告ありがとうございます。",
            issue_url=result["url"],
            issue_number=result["number"],
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="バグ報告の送信に失敗しました",
        )


@router.post("/enhancement", response_model=FeedbackResponse)
async def submit_enhancement_request(
    request: EnhancementRequest,
    current_user: User | None = Depends(get_current_user_optional),
):
    """機能要望を送信"""
    if not github_service.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub連携が設定されていません",
        )

    user_email = current_user.email if current_user else None
    body = _format_enhancement_body(request)

    result = await github_service.create_issue(
        title=f"[Enhancement] {request.title}",
        body=body,
        issue_type="enhancement",
        user_email=user_email,
    )

    if result:
        return FeedbackResponse(
            success=True,
            message="機能要望を送信しました。ご提案ありがとうございます。",
            issue_url=result["url"],
            issue_number=result["number"],
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="機能要望の送信に失敗しました",
        )


@router.post("/contact", response_model=FeedbackResponse)
async def submit_contact(
    request: ContactRequest,
    current_user: User | None = Depends(get_current_user_optional),
):
    """お問い合わせを送信"""
    if not github_service.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub連携が設定されていません",
        )

    user_email = current_user.email if current_user else None
    body = _format_contact_body(request)

    result = await github_service.create_issue(
        title=f"[Contact] {request.subject}",
        body=body,
        issue_type="question",
        user_email=user_email,
    )

    if result:
        return FeedbackResponse(
            success=True,
            message="お問い合わせを送信しました。",
            issue_url=result["url"],
            issue_number=result["number"],
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="お問い合わせの送信に失敗しました",
        )
