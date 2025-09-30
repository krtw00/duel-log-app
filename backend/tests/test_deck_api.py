"""
デッキAPIエンドポイントのテスト
"""
import pytest
from fastapi import status


class TestDeckEndpoints:
    """デッキAPIエンドポイントのテストクラス"""
    
    def test_create_deck(self, client, auth_headers):
        """デッキ作成エンドポイントのテスト"""
        response = client.post(
            "/decks/",
            json={"name": "Test Deck", "is_opponent": False},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Test Deck"
        assert data["is_opponent"] == False
        assert "id" in data
    
    def test_list_decks(self, client, auth_headers):
        """デッキ一覧取得エンドポイントのテスト"""
        # デッキを作成
        client.post(
            "/decks/",
            json={"name": "Deck 1", "is_opponent": False},
            headers=auth_headers
        )
        client.post(
            "/decks/",
            json={"name": "Deck 2", "is_opponent": True},
            headers=auth_headers
        )
        
        # 一覧取得
        response = client.get("/decks/", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
    
    def test_get_deck_by_id(self, client, auth_headers):
        """デッキ取得エンドポイントのテスト"""
        # デッキを作成
        create_response = client.post(
            "/decks/",
            json={"name": "Specific Deck", "is_opponent": False},
            headers=auth_headers
        )
        deck_id = create_response.json()["id"]
        
        # 取得
        response = client.get(f"/decks/{deck_id}", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == deck_id
        assert data["name"] == "Specific Deck"
    
    def test_update_deck(self, client, auth_headers):
        """デッキ更新エンドポイントのテスト"""
        # デッキを作成
        create_response = client.post(
            "/decks/",
            json={"name": "Original", "is_opponent": False},
            headers=auth_headers
        )
        deck_id = create_response.json()["id"]
        
        # 更新
        response = client.put(
            f"/decks/{deck_id}",
            json={"name": "Updated"},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Updated"
    
    def test_delete_deck(self, client, auth_headers):
        """デッキ削除エンドポイントのテスト"""
        # デッキを作成
        create_response = client.post(
            "/decks/",
            json={"name": "To Delete", "is_opponent": False},
            headers=auth_headers
        )
        deck_id = create_response.json()["id"]
        
        # 削除
        response = client.delete(f"/decks/{deck_id}", headers=auth_headers)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # 削除されたことを確認
        get_response = client.get(f"/decks/{deck_id}", headers=auth_headers)
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_list_decks_filter_by_opponent(self, client, auth_headers):
        """対戦相手フラグでフィルタリングのテスト"""
        # デッキを作成
        client.post(
            "/decks/",
            json={"name": "My Deck", "is_opponent": False},
            headers=auth_headers
        )
        client.post(
            "/decks/",
            json={"name": "Opponent Deck", "is_opponent": True},
            headers=auth_headers
        )
        
        # 対戦相手のデッキのみ取得
        response = client.get(
            "/decks/?is_opponent=true",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["is_opponent"] == True
    
    def test_create_deck_unauthorized(self, client):
        """認証なしでのデッキ作成のテスト"""
        response = client.post(
            "/decks/",
            json={"name": "Test Deck", "is_opponent": False}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_nonexistent_deck(self, client, auth_headers):
        """存在しないデッキの取得のテスト"""
        response = client.get("/decks/99999", headers=auth_headers)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
