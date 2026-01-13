#!/bin/bash

# Supabase認証情報取得スクリプト
#
# 使用方法:
# 1. Supabase CLIをインストール: npm install -g supabase
# 2. ログイン: supabase login
# 3. このスクリプトを実行: bash get-supabase-credentials.sh

PROJECT_REF="vdzyixwbikouwkhvvwkn"

echo "========================================="
echo "Supabase認証情報取得"
echo "========================================="
echo ""

# プロジェクトにリンク（既にリンク済みの場合はスキップされます）
echo "📌 プロジェクトにリンク中..."
supabase link --project-ref $PROJECT_REF 2>/dev/null || echo "既にリンク済み"
echo ""

# JWT Secretを取得
echo "🔑 JWT Secret取得中..."
echo "以下のコマンドを実行してJWT Secretを取得してください："
echo ""
echo "  supabase secrets list"
echo ""
echo "または、Supabaseダッシュボードの Settings > API > JWT Settings から確認できます"
echo ""

# データベース接続情報を取得
echo "🗄️ データベース接続情報取得中..."
echo "以下のコマンドを実行してデータベース接続文字列を取得してください："
echo ""
echo "  supabase db show-connection-string"
echo ""
echo "パスワードは手動で置き換える必要があります"
echo ""

echo "========================================="
echo "取得した情報をDEPLOYMENT_SETUP.mdに従って設定してください"
echo "========================================="
