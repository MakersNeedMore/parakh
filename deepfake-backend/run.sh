#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

if [ -f "$DIR/.venv/bin/python" ]; then
    PYTHON="$DIR/.venv/bin/python"
elif [ -f "$DIR/../.venv/bin/python" ]; then
    PYTHON="$DIR/../.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON="python3"
else
    PYTHON="python"
fi

echo "Starting Parakh FastAPI Backend on http://127.0.0.1:8000 ..."
exec "$PYTHON" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
