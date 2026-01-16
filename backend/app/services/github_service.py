"""
GitHub Issue連携サービス
フィードバック機能でGitHub Issueを作成する
"""

from typing import Literal

import httpx

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

IssueType = Literal["bug", "enhancement", "question"]


class GitHubService:
    """GitHub API連携サービス"""

    BASE_URL = "https://api.github.com"

    def __init__(self):
        self.token = settings.GITHUB_TOKEN
        self.owner = settings.GITHUB_REPO_OWNER
        self.repo = settings.GITHUB_REPO_NAME

    @property
    def is_configured(self) -> bool:
        """GitHub連携が設定されているかどうか"""
        return bool(self.token)

    def _get_headers(self) -> dict:
        """API リクエスト用ヘッダーを取得"""
        return {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    def _get_labels(self, issue_type: IssueType) -> list[str]:
        """Issue種別に応じたラベルを取得"""
        label_map = {
            "bug": ["bug", "user-report"],
            "enhancement": ["enhancement", "user-report"],
            "question": ["question", "user-report"],
        }
        return label_map.get(issue_type, ["user-report"])

    async def create_issue(
        self,
        title: str,
        body: str,
        issue_type: IssueType,
        user_email: str | None = None,
    ) -> dict | None:
        """
        GitHub Issueを作成

        Args:
            title: Issueタイトル
            body: Issue本文
            issue_type: Issue種別 (bug/enhancement/question)
            user_email: 報告者のメールアドレス（オプション）

        Returns:
            作成されたIssueの情報、または失敗時はNone
        """
        if not self.is_configured:
            logger.warning("GitHub token is not configured")
            return None

        # 本文にメタ情報を追加
        full_body = body
        if user_email:
            full_body += f"\n\n---\n**Reporter:** {user_email}"

        url = f"{self.BASE_URL}/repos/{self.owner}/{self.repo}/issues"
        payload = {
            "title": title,
            "body": full_body,
            "labels": self._get_labels(issue_type),
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers(),
                    timeout=30.0,
                )

                if response.status_code == 201:
                    data = response.json()
                    logger.info(
                        f"GitHub Issue created: #{data['number']} - {data['html_url']}"
                    )
                    return {
                        "number": data["number"],
                        "url": data["html_url"],
                        "title": data["title"],
                    }
                else:
                    logger.error(
                        f"Failed to create GitHub Issue: {response.status_code} - {response.text}"
                    )
                    return None

        except httpx.RequestError as e:
            logger.error(f"GitHub API request failed: {e}")
            return None


# シングルトンインスタンス
github_service = GitHubService()
