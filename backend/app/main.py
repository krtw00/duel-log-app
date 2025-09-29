from fastapi import FastAPI
from .db.session import engine, Base
from .models import User, Deck, Duel, sharedUrl
from app.api.routers import decks, users, duels


# Alembic を使う場合はここで create_all は不要
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Duel Log API")

app.include_router(users.router)
app.include_router(decks.router)
app.include_router(duels.router)


@app.get("/")
def root():
    return {"message": "Hello Duel Log"}