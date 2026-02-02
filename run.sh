#!/usr/bin/env bash
set -euo pipefail

# Wrapper so you never have to manually "activate" the venv.
# Usage:
#   ./run.sh smoke
#   ./run.sh dashboard
#   ./run.sh transfer-today

cd "$(dirname "$0")"

if [ ! -f .venv/bin/activate ]; then
  echo ".venv not found. Create it first:" >&2
  echo "  python3 -m venv .venv" >&2
  echo "  source .venv/bin/activate && pip install -r requirements.txt && pip install -e ." >&2
  exit 2
fi

source .venv/bin/activate
exec python -m jobscraper "$@"
