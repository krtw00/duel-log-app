import logging

from fastapi import APIRouter, Depends, File, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import user_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/me", tags=["current user"])


@router.get("", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    現在のユーザー情報を取得
    """
    return current_user


@router.put("", response_model=UserResponse)
def update_my_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    現在のユーザー情報を更新
    """
    updated_user = user_service.update_profile(
        db=db, db_obj=current_user, obj_in=user_in
    )
    return updated_user


@router.delete("", status_code=status.HTTP_200_OK)
def delete_my_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    現在のアカウントを削除

    ユーザーに関連するすべてのデータ（デッキ、デュエル）も削除される
    """
    user_service.delete(db=db, id=current_user.id)
    response.delete_cookie("access_token")
    return {"message": "アカウントが正常に削除されました"}


@router.get("/export", response_class=Response)
def export_my_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    現在のユーザーの全データをCSVとしてエクスポート
    """
    from datetime import datetime

    from fastapi.responses import StreamingResponse

    csv_data = user_service.export_all_data_to_csv(db=db, user_id=current_user.id)
    filename = f"duellog_backup_{datetime.now().strftime('%Y%m%d')}.csv"
    response = StreamingResponse(
        iter([csv_data]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
    return response


@router.post("/import", status_code=status.HTTP_201_CREATED)
def import_my_data(
    file: bytes = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    CSVファイルからデータをインポートして復元
    （既存のデータはすべて削除されます）
    """
    try:
        csv_content = file.decode("utf-8")
    except UnicodeDecodeError:
        logger.warning("CSV import encoding error")
        # スタックトレース露出を防ぐため、from None を使用
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSVファイルのエンコーディングが無効です。UTF-8形式のファイルをアップロードしてください",
        ) from None

    try:
        return user_service.import_all_data_from_csv(
            db=db, user_id=current_user.id, csv_content=csv_content
        )
    except Exception:
        logger.exception("CSV import failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="CSVインポート中にエラーが発生しました",
        ) from None
