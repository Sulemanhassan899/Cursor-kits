#!/usr/bin/env bash
set -euo pipefail
RUN_ID="${1:-}"
KIT_ROOT="$HOME/Documents/Archify-kit/projects/obecno"
LEGACY_ROOT="$HOME/Documents/obecno-archify"
if [ -d "$KIT_ROOT/live-guide" ]; then
  ROOT="$KIT_ROOT"
elif [ -d "$LEGACY_ROOT/live-guide" ]; then
  ROOT="$LEGACY_ROOT"
else
  echo "ERROR: no Archify live-guide found" >&2
  exit 1
fi
if [ -n "$RUN_ID" ]; then
  exec bash "$HOME/Documents/Archify-kit/tools/ensure-live-guide.sh" "$ROOT" qa "$RUN_ID"
else
  exec bash "$HOME/Documents/Archify-kit/tools/ensure-live-guide.sh" "$ROOT" qa
fi
