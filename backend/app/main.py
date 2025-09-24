from fastapi import FastAPI
from db.session import engine, Base
from models.models import User, Deck, Duel, SharedURL

# テーブル作成（開発用、初回のみ）
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Duel Log API")

@app.get("/")
def root():
    return {"message": "Hello Duel Log"}
