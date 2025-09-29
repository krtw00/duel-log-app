from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import decks, users, duels


# Alembic を使う場合はここで create_all は不要
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Duel Log API")

app.add_middleware(
    CORSMiddleware,
    # ★★★ ここにフロントエンドのアクセス元URLをリストに含める ★★★
    allow_origins=[
        "http://localhost:5173",  # これがブラウザから見たViteの開発サーバーURL
        "http://127.0.0.1:5173",
        # 必要に応じて、全てのオリジンを一時的に許可してテストする
        # "*", 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(decks.router)
app.include_router(duels.router)


@app.get("/")
def root():
    return {"message": "Hello Duel Log"}

@app.get("/test")
def read_test():
    return {"message": "Hello from FastAPI!"}