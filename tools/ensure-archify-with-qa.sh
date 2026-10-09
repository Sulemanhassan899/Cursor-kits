#!/usr/bin/env bash
# Called during QA wake: make sure Archify project exists, plan agents, optionally
# mark that diagrams should be produced. Does not ask the user.
# Usage: ensure-archify-with-qa.sh <workspace> [hint]
set -euo pipefail
WS="${1:-$(pwd)}"
HINT="${2:-standard}"
WS="$(cd "$WS" && pwd)"
KIT="${CURSOR_KITS_HOME:-$HOME/Documents/Cursor-kits}"

INIT="$KIT/archify-kit/tools/init-project-archify.sh"
RESOLVE="$KIT/archify-kit/tools/resolve-archify-root.sh"
PLAN="$KIT/archify-kit/tools/plan-archify-agents.sh"
for f in INIT RESOLVE PLAN; do
  eval "p=\$$f"
  if [ ! -f "$p" ]; then
    eval "$f=\"\$HOME/Documents/Archify-kit/tools/$(basename "$p")\""
  fi
done

ARCHIFY_ROOT=$(bash "$RESOLVE" "$WS")
# Ensure live-guide present
if [ ! -f "$ARCHIFY_ROOT/live-guide/server.mjs" ]; then
  bash "$INIT" "$WS" >/dev/null
  ARCHIFY_ROOT=$(bash "$RESOLVE" "$WS")
fi

bash "$PLAN" "$ARCHIFY_ROOT" "$WS" "$HINT" >/dev/null
echo "$ARCHIFY_ROOT"
