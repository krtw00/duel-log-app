#!/usr/bin/env bash
#
# staging デプロイ後の認証スモークテスト。
#
# 「login → CSRF cookie 読取 → mutation → logout」をブラウザと同じ前提で実機に対して叩く。
# 過去に dlog_csrf を path=/api で発行して SPA(path=/)が document.cookie で読めず、
# 全 mutation が 403 になる障害があった。/health の GET 確認だけでは検知できなかったため、
# 実際に CSRF 保護 mutation が通ることをデプロイ後に検証する最終防衛線。
#
# 有効化には staging 専用テストアカウントと secret 設定が必要:
#   - STAGING_SMOKE_EMAIL / STAGING_SMOKE_PASSWORD (GitHub Actions secrets)
# 未設定なら警告を出して skip (デプロイは止めない)。設定すると hard gate になる。
set -euo pipefail

BASE="${SMOKE_BASE:-https://duel-log-staging.codenica.dev}"
EMAIL="${SMOKE_EMAIL:-}"
PASSWORD="${SMOKE_PASSWORD:-}"

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "⚠️  スモークテストを skip: STAGING_SMOKE_EMAIL / STAGING_SMOKE_PASSWORD secret が未設定"
  echo "    staging に専用テストアカウントを作り secret を設定すると認証フロー検証が有効化されます。"
  exit 0
fi

JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT
fail() { echo "❌ SMOKE FAILED: $*" >&2; exit 1; }

# 0. 公開 URL の readiness を軽く待つ (Caddy 経由でイメージ切替直後の取りこぼし防止)
for i in $(seq 1 10); do
  curl -fsS "$BASE/api/health" >/dev/null 2>&1 && break
  [[ "$i" == "10" ]] && fail "$BASE/api/health が 30s 以内に応答しない"
  sleep 3
done

# 1. login (CSRF 免除) → Set-Cookie を jar に保存
code=$(curl -sS -o /dev/null -w '%{http_code}' -c "$JAR" \
  -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
[[ "$code" == "200" ]] || fail "login が $code (期待 200). テストアカウントの認証情報を確認"

# 2. ブラウザの document.cookie (page path=/) を再現:
#    Netscape jar 形式 = domain \t flag \t path \t secure \t expiry \t name \t value
#    dlog_csrf の path 列が "/" でなければ SPA ルートから読めず X-CSRF-Token を付けられない。
#    path=/api 回帰はここで落ちる。
csrf_path=$(awk -F'\t' '$6=="dlog_csrf"{print $3}' "$JAR" | head -1)
[[ -n "$csrf_path" ]] || fail "dlog_csrf cookie が発行されていない (login レスポンスの Set-Cookie を確認)"
[[ "$csrf_path" == "/" ]] || fail "dlog_csrf の Path が '$csrf_path' (期待 '/'). SPA が document.cookie で読めず全 mutation が 403 になる回帰"
CSRF=$(awk -F'\t' '$6=="dlog_csrf"{print $7}' "$JAR" | head -1)
[[ -n "$CSRF" ]] || fail "dlog_csrf の値が空"

# 3. データ登録 (CSRF 保護 mutation): POST /api/decks → 201
create=$(curl -sS -w $'\n%{http_code}' -b "$JAR" \
  -X POST "$BASE/api/decks" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF" \
  -d '{"name":"__smoke_test__","isOpponentDeck":false}')
create_code=$(printf '%s' "$create" | tail -1)
create_body=$(printf '%s' "$create" | sed '$d')
[[ "$create_code" == "201" ]] || fail "deck 作成が $create_code (期待 201): $create_body"
DECK_ID=$(printf '%s' "$create_body" | grep -oE '"id":"[^"]+"' | head -1 | sed 's/"id":"//;s/"$//')
[[ -n "$DECK_ID" ]] || fail "作成した deck の id が取れない: $create_body"

# 4. cleanup: 作成した deck を削除 (CSRF 保護)。失敗しても警告のみでテストは継続
del_code=$(curl -sS -o /dev/null -w '%{http_code}' -b "$JAR" \
  -X DELETE "$BASE/api/decks/$DECK_ID" -H "X-CSRF-Token: $CSRF")
[[ "$del_code" == "200" ]] || echo "⚠️  cleanup の deck 削除が $del_code (テストは継続。__smoke_test__ が残る可能性)"

# 5. logout (CSRF 保護 mutation): POST /api/auth/signout → 200
out_code=$(curl -sS -o /dev/null -w '%{http_code}' -b "$JAR" \
  -X POST "$BASE/api/auth/signout" -H "X-CSRF-Token: $CSRF")
[[ "$out_code" == "200" ]] || fail "signout が $out_code (期待 200)"

echo "✅ SMOKE OK: login → csrf(path=/) → deck 作成/削除 → logout すべて成功"
