#!/usr/bin/env bash
# After QA (and optional Archify), open Live Guide. Never prompt the user.
# Usage: after-qa-open-live.sh <ARCHIFY_ROOT> [run_id]
set -euo pipefail
ARCHIFY_ROOT="${1:?ARCHIFY_ROOT}"
RUN_ID="${2:-}"
KIT="${CURSOR_KITS_HOME:-$HOME/Documents/Cursor-kits}"
ENSURE="$KIT/archify-kit/tools/ensure-live-guide.sh"
if [ ! -f "$ENSURE" ]; then
  ENSURE="$HOME/Documents/Archify-kit/tools/ensure-live-guide.sh"
fi
if [ -n "$RUN_ID" ]; then
  exec bash "$ENSURE" "$ARCHIFY_ROOT" qa "$RUN_ID"
fi
exec bash "$ENSURE" "$ARCHIFY_ROOT" system
