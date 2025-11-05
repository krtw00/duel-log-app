#!/bin/bash
echo "=== Docker Images ==="
docker images | grep -E "duel.*log|REPOSITORY"

echo ""
echo "=== Docker Containers ==="
docker ps -a | grep -E "duellog|CONTAINER"

echo ""
echo "=== Docker Volumes ==="
docker volume ls | grep -E "duel.*log|DRIVER"

echo ""
echo "=== Backend Directory Files (from host) ==="
echo "Migration files count: $(ls -1 /home/user/duel-log-app/backend/alembic/versions/*.py 2>/dev/null | wc -l)"
echo "start.py exists: $([ -f /home/user/duel-log-app/backend/start.py ] && echo "YES" || echo "NO")"

echo ""
echo "=== Check if a1b2c3d4e5f8 exists on host ==="
find /home/user/duel-log-app/backend -name "*a1b2c3d4e5f8*" 2>/dev/null || echo "Not found"
