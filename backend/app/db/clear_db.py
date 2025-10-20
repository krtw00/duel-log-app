import logging
import os
import sys

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.db.session import SessionLocal
from app.models.duel import Duel
from app.models.deck import Deck

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clear_data(db: SessionLocal):
    try:
        num_duels = db.query(Duel).delete()
        num_decks = db.query(Deck).delete()
        db.commit()
        logger.info(f"Deleted {num_duels} duels.")
        logger.info(f"Deleted {num_decks} decks.")
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Clearing database...")
    db_session = SessionLocal()
    clear_data(db_session)
    logger.info("Database cleared.")
