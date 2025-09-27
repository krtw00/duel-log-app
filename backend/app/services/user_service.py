from sqlalchemy import select, insert
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from passlib.context import CryptContext
import logging
from fastapi import HTTPException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MAX_BCRYPT_BYTES = 72

def get_password_hash(password: str) -> str:
    # ここでパスワードの切り詰めを行う
    password_bytes = password.encode("utf-8")[:MAX_BCRYPT_BYTES]
    trimmed_password = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.hash(trimmed_password)

logger = logging.getLogger(__name__)

def create_user(db: Session, user_in: UserCreate) -> User:
    hashed_password = get_password_hash(user_in.password)
    now = datetime.now(timezone.utc)

    stmt = (
        insert(User)
        .values(
            username=user_in.username,
            email=user_in.email,
            passwordhash=hashed_password,
            createdat=now,
            updatedat=now,
        )
        .returning(
            User.id,
            User.username,
            User.email,
            User.passwordhash,
            User.createdat,
            User.updatedat,
        )
    )

    logger.info(f"DEBUG: Executing SQL: {stmt}")

    try:
        result = db.execute(stmt)
        db.commit()
    except IntegrityError as e:
        db.rollback()
        logger.error(f"❌ IntegrityError: {e}")
        raise HTTPException(status_code=409, detail="Username or email already exists")

    row = result.mappings().first()

    if row is None:
        logger.error("❌ DBから返されたrowがNoneです。INSERTが失敗した可能性があります")
        raise HTTPException(status_code=500, detail="DB insert failed: no row returned")

    logger.info(f"DEBUG: raw row = {row}")
    logger.info(f"DEBUG: row['createdat'] = {row['createdat']}")
    logger.info(f"DEBUG: row['updatedat'] = {row['updatedat']}")

    new_user = User(**row)
    return new_user


def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    users = db.query(User).offset(skip).limit(limit).all()
    for user in users:
        logger.info(f"DEBUG: user object = {user}")
        logger.info(f"DEBUG: user.id = {user.id}, createdat = {user.createdat}, updatedat = {user.updatedat}")

        db.refresh(user)
    return users


def update_user(db: Session, user_id: int, user_in: UserUpdate) -> User | None:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    if user_in.username is not None:
        db_user.username = user_in.username
    if user_in.email is not None:
        db_user.email = user_in.email
    if user_in.password is not None:
        db_user.passwordhash = get_password_hash(user_in.password)

    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True