import logging
import os
import sys

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.db.session import SessionLocal
from app.models.deck import Deck
from app.models.duel import Duel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def clear_data(db: SessionLocal):  # type: ignore[valid-type]
    try:
        num_duels = db.query(Duel).delete()  # type: ignore[attr-defined]
        num_decks = db.query(Deck).delete()  # type: ignore[attr-defined]
        db.commit()  # type: ignore[attr-defined]
        logger.info(f"Deleted {num_duels} duels.")
        logger.info(f"Deleted {num_decks} decks.")
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        db.rollback()  # type: ignore[attr-defined]
    finally:
        db.close()  # type: ignore[attr-defined]


if __name__ == "__main__":
    logger.info("Clearing database...")
    db_session = SessionLocal()
    clear_data(db_session)
    logger.info("Database cleared.")
