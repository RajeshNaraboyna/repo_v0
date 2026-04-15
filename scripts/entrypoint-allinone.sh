#!/bin/bash
set -e

echo "==> Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
    if python -c "
import sys, asyncio, asyncpg, os
url = os.environ.get('DATABASE_URL', '')
url = url.replace('postgresql+asyncpg://', 'postgresql://')
async def check():
    conn = await asyncpg.connect(url)
    await conn.close()
try:
    asyncio.run(check())
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; then
        echo "==> PostgreSQL is ready!"
        break
    fi
    echo "    Waiting for PostgreSQL... ($i/30)"
    sleep 1
done

echo "==> Running Alembic migrations..."
cd /app/scl-api
alembic upgrade head
echo "==> Migrations complete."

echo "==> Starting supervisord..."
exec supervisord -c /etc/supervisor/supervisord.conf
