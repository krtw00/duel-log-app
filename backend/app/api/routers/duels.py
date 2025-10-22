"""
デュエルエンドポイント
デュエルのCRUD操作を提供
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.duel import DuelCreate, DuelRead, DuelUpdate
from app.services.duel_service import duel_service

router = APIRouter(prefix="/duels", tags=["duels"])


@router.get("/export/csv")
def export_duels_csv(
    year: Optional[int] = Query(None, description="年でフィルタリング"),
    month: Optional[int] = Query(None, description="月でフィルタリング"),
    game_mode: Optional[str] = Query(None, description="ゲームモードでフィルタリング"),
    columns: Optional[str] = Query(
        None, description="エクスポートするカラム（カンマ区切り）"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    ログインユーザーの戦績データをCSV形式でエクスポート
    """
    import logging

    logger = logging.getLogger(__name__)
    logger.info(f"Exporting CSV with columns: {columns}")

    try:
        column_list = columns.split(",") if columns else None
        csv_data = duel_service.export_duels_to_csv(
            db=db,
            user_id=current_user.id,
            year=year,
            month=month,
            game_mode=game_mode,
            columns=column_list,
        )

        # ファイル名に日付を追加
        filename = f"duels_{datetime.now().strftime('%Y%m%d')}.csv"

        response = StreamingResponse(
            iter([csv_data]),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

        return response
    except Exception as e:
        logger.error(f"CSV export failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CSV export failed: {str(e)}",
        ) from e


@router.get("/", response_model=List[DuelRead])
def list_duels(
    deck_id: Optional[int] = Query(None, description="デッキIDでフィルタリング"),
    start_date: Optional[datetime] = Query(None, description="開始日（この日以降）"),
    end_date: Optional[datetime] = Query(None, description="終了日（この日以前）"),
    year: Optional[int] = Query(None, description="年"),
    month: Optional[int] = Query(None, description="月"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    ログインユーザーのデュエル一覧を取得

    Args:
        deck_id: デッキID（省略時は全デッキのデュエルを取得）
        start_date: 開始日
        end_date: 終了日
        db: データベースセッション
        current_user: 現在のユーザー

    Returns:
        デュエルのリスト（プレイ日時の降順）
    """
    return duel_service.get_user_duels(
        db=db,
        user_id=current_user.id,
        deck_id=deck_id,
        start_date=start_date,
        end_date=end_date,
        year=year,
        month=month,
    )


@router.post("/", response_model=DuelRead, status_code=status.HTTP_201_CREATED)
def create_duel(
    duel: DuelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    新しいデュエルを記録

    Args:
        duel: デュエル作成スキーマ
        db: データベースセッション
        current_user: 現在のユーザー

    Returns:
        作成されたデュエル
    """
    return duel_service.create_user_duel(db=db, user_id=current_user.id, duel_in=duel)


@router.get("/{duel_id}", response_model=DuelRead)
def get_duel(
    duel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    IDでデュエルを取得

    Args:
        duel_id: デュエルID
        db: データベースセッション
        current_user: 現在のユーザー

    Returns:
        デュエル

    Raises:
        HTTPException: デュエルが見つからない場合
    """
    duel = duel_service.get_by_id(db=db, id=duel_id, user_id=current_user.id)

    if not duel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="デュエルが見つかりません"
        )

    return duel


@router.put("/{duel_id}", response_model=DuelRead)
def update_duel(
    duel_id: int,
    duel: DuelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    デュエルを更新

    Args:
        duel_id: デュエルID
        duel: デュエル更新スキーマ
        db: データベースセッション
        current_user: 現在のユーザー

    Returns:
        更新されたデュエル

    Raises:
        HTTPException: デュエルが見つからない場合
    """
    updated_duel = duel_service.update(
        db=db, id=duel_id, obj_in=duel, user_id=current_user.id
    )

    if not updated_duel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="デュエルが見つかりません"
        )

    return updated_duel


@router.delete("/{duel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_duel(
    duel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    デュエルを削除

    Args:
        duel_id: デュエルID
        db: データベースセッション
        current_user: 現在のユーザー

    Raises:
        HTTPException: デュエルが見つからない場合
    """
    success = duel_service.delete(db=db, id=duel_id, user_id=current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="デュエルが見つかりません"
        )


@router.get("/stats/win-rate")
def get_win_rate(
    deck_id: Optional[int] = Query(None, description="デッキID（省略時は全体の勝率）"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    勝率を取得

    Args:
        deck_id: デッキID（省略時は全デッキの勝率）
        db: データベースセッション
        current_user: 現在のユーザー

    Returns:
        勝率情報
    """
    win_rate = duel_service.get_win_rate(
        db=db, user_id=current_user.id, deck_id=deck_id
    )

    return {"win_rate": win_rate, "percentage": round(win_rate * 100, 2)}


@router.get("/latest-values/", response_model=dict)
def get_latest_values(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    各ゲームモードの最新の値（ランク、レート、DC）を取得
    """
    return duel_service.get_latest_duel_values(db=db, user_id=current_user.id)


@router.post("/import/csv", status_code=status.HTTP_201_CREATED)
def import_duels_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    CSVファイルからデュエルデータをインポート
    """
    # ファイル名の拡張子をチェック（Content-Typeは不確実なため）
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400, detail="Invalid file type. Please upload a CSV file (.csv)"
        )

    try:
        csv_content = file.file.read().decode("utf-8")
        result = duel_service.import_duels_from_csv(
            db=db, user_id=current_user.id, csv_content=csv_content
        )

        # インポート結果を返す
        response = {
            "message": "CSV file imported successfully",
            "created": result["created"],
            "errors": result["errors"],
        }

        # エラーがある場合は警告を追加
        if result["errors"]:
            response["warning"] = f"{len(result['errors'])} rows had errors"

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import CSV file: {str(e)}",
        ) from e
