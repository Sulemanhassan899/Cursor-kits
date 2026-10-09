#!/usr/bin/env bash
# Start Live Guide for ARCHIFY_ROOT and open the browser.
# Usage:
#   ensure-live-guide.sh <ARCHIFY_ROOT> [tab:system|qa] [run_id]
set -euo pipefail

ROOT="${1:-}"
TAB="${2:-system}"
RUN_ID="${3:-}"
PORT="${PORT:-8765}"

if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then
  echo "Usage: ensure-live-guide.sh <ARCHIFY_ROOT> [system|qa] [run_id]" >&2
  exit 1
fi
ROOT="$(cd "$ROOT" && pwd)"

if [ ! -f "$ROOT/live-guide/server.mjs" ]; then
  echo "ERROR: no live-guide/server.mjs under $ROOT" >&2
  exit 1
fi

LOG="${LIVE_GUIDE_LOG:-/tmp/archify-live-guide.log}"
PID_FILE="${LIVE_GUIDE_PID:-/tmp/archify-live-guide.pid}"
BASE="http://127.0.0.1:${PORT}/live-guide/"
NODE="$(command -v node)"

if [ -z "$NODE" ]; then
  echo "ERROR: node not found" >&2
  exit 1
fi

if [ "$TAB" = "qa" ] && [ -n "$RUN_ID" ]; then
  OPEN_URL="${BASE}?tab=qa&run=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$RUN_ID")#qa"
elif [ "$TAB" = "qa" ]; then
  OPEN_URL="${BASE}?tab=qa#qa"
else
  OPEN_URL="${BASE}?tab=system#system"
fi

is_up() {
  curl -sf -o /dev/null --connect-timeout 1 --max-time 2 "$BASE"
}

start_detached() {
  ARCHIFY_ROOT="$ROOT" PORT="$PORT" python3 - "$ROOT" "$NODE" "$LOG" "$PID_FILE" "$PORT" <<'PY'
import os, sys, time
root, node, log, pid_file, port = sys.argv[1:6]
if os.fork() != 0:
    time.sleep(0.15)
    sys.exit(0)
os.setsid()
if os.fork() != 0:
    sys.exit(0)
os.chdir(root)
os.environ["PORT"] = port
os.environ["ARCHIFY_ROOT"] = root
stdin = open("/dev/null", "rb")
stdout = open(log, "ab", buffering=0)
os.dup2(stdin.fileno(), 0)
os.dup2(stdout.fileno(), 1)
os.dup2(stdout.fileno(), 2)
os.execv(node, [node, "live-guide/server.mjs"])
PY
  sleep 0.4
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -1 >"$PID_FILE" || true
  fi
}

if ! is_up; then
  if command -v lsof >/dev/null 2>&1; then
    PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "${PIDS}" ]; then
      # shellcheck disable=SC2086
      kill $PIDS 2>/dev/null || true
      sleep 0.3
    fi
  fi
  start_detached
  for _ in $(seq 1 40); do
    is_up && break
    sleep 0.25
  done
fi

if ! is_up; then
  echo "ERROR: Live Guide failed to start on ${BASE}" >&2
  echo "See log: $LOG" >&2
  exit 1
fi

echo "Live Guide ready: $OPEN_URL"
echo "$OPEN_URL" > "$ROOT/.last-live-url"

if command -v open >/dev/null 2>&1; then
  open "$OPEN_URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$OPEN_URL" >/dev/null 2>&1 || true
else
  echo "Open manually: $OPEN_URL"
fi
