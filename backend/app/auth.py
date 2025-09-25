from fastapi import Depends, HTTPException, status

def get_current_user():
    # 仮のユーザーを返す（本番はJWTなどで認証）
    class User:
        id = 1
        username = "test_user"
    return User()
