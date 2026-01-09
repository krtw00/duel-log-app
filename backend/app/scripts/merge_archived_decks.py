# backend/app/scripts/merge_archived_decks.py

import logging
import os
import sys
from collections import defaultdict

from sqlalchemy.orm import Session

# Ensure the app path is in the sys.path to allow for absolute imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.db.session import SessionLocal
from app.models.deck import Deck
from app.models.duel import Duel
from app.models.user import User

# Configure logging to ensure output is captured in Render
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def run_merge(db: Session):
    """
    Finds archived decks with duplicate names for each user, merges them into the oldest one,
    and deletes the duplicates.
    """
    logger.info("--- Starting archive merge process ---")

    users = db.query(User).all()
    logger.info(f"Found {len(users)} user(s) to process.")

    for user in users:
        logger.info(f"Processing user: {user.username} (ID: {user.id})")

        archived_decks = (
            db.query(Deck).filter(Deck.user_id == user.id, Deck.active.is_(False)).all()
        )

        decks_by_name = defaultdict(list)
        for deck in archived_decks:
            decks_by_name[deck.name].append(deck)

        total_merged_for_user = 0
        for name, decks in decks_by_name.items():
            if len(decks) < 2:
                continue

            logger.info(
                f"Found {len(decks)} archived decks with name '{name}'. Merging..."
            )

            # Sort by creation date to find the primary (oldest) deck
            decks.sort(key=lambda d: d.createdat)
            primary_deck = decks[0]
            duplicate_decks = decks[1:]

            logger.info(
                f"  Primary deck: ID {primary_deck.id} (Created: {primary_deck.createdat})"
            )

            for duplicate_deck in duplicate_decks:
                logger.info(
                    f"  Merging duplicate deck ID {duplicate_deck.id} into primary deck ID {primary_deck.id}"
                )

                # 1. Update duels where the user's deck was the duplicate
                duels_as_main_deck_count = (
                    db.query(Duel)
                    .filter(Duel.deck_id == duplicate_deck.id)
                    .update({"deck_id": primary_deck.id})
                )
                logger.info(
                    f"    - Updated {duels_as_main_deck_count} duel(s) (as main deck)."
                )

                # 2. Update duels where the opponent's deck was the duplicate
                # Note: 'opponentDeck_id' is the current column name from the schema.
                duels_as_opponent_deck_count = (
                    db.query(Duel)
                    .filter(Duel.opponentDeck_id == duplicate_deck.id)
                    .update({"opponentDeck_id": primary_deck.id})
                )
                logger.info(
                    f"    - Updated {duels_as_opponent_deck_count} duel(s) (as opponent deck)."
                )

                # 3. Delete the duplicate deck
                db.delete(duplicate_deck)
                logger.info(f"    - Deleted duplicate deck ID {duplicate_deck.id}.")
                total_merged_for_user += 1

        if total_merged_for_user > 0:
            logger.info(f"Committing changes for user {user.username}.")
            db.commit()
        else:
            logger.info(
                f"No duplicate archived decks to merge for user {user.username}."
            )

    logger.info("--- Archive merge process finished ---")


if __name__ == "__main__":
    logger.info("Running merge script as a standalone process.")
    db = SessionLocal()
    try:
        run_merge(db)
    except Exception:
        logger.error("An error occurred during the merge process.", exc_info=True)
        db.rollback()
    finally:
        db.close()
        logger.info("Database session closed.")
# Force re-evaluation by CI
