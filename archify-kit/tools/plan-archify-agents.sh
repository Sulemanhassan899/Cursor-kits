#!/usr/bin/env bash
# Decide how many Archify agents to spawn from task scope.
# Usage: plan-archify-agents.sh <ARCHIFY_ROOT> <workspace> [hint: quick|standard|deep]
# Writes results plan to ARCHIFY_ROOT/runs/<run_id>/agent-plan.json and prints JSON.
set -euo pipefail

ROOT="${1:?ARCHIFY_ROOT}"
WS="${2:-}"
HINT="${3:-standard}"
RUN_ID="${4:-$(date +%Y%m%d-%H%M)-archify}"

mkdir -p "$ROOT/runs/$RUN_ID"

# Rough sizing from repo files (best-effort)
FILE_COUNT=0
if [ -n "$WS" ] && [ -d "$WS" ]; then
  FILE_COUNT=$(find "$WS" \( -name '*.dart' -o -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.py' -o -name '*.go' -o -name '*.java' -o -name '*.kt' \) \
    ! -path '*/node_modules/*' ! -path '*/.git/*' ! -path '*/build/*' ! -path '*/.dart_tool/*' 2>/dev/null | wc -l | tr -d ' ')
fi

# Agent count policy (orchestrator may still adjust)
# 1 = tiny / single diagram
# 2–3 = standard (runtime + screens or api)
# 4–6 = deep multi-module
AGENTS=2
SCOPE="standard"
if [ "$HINT" = "quick" ] || [ "$FILE_COUNT" -lt 40 ]; then
  AGENTS=1
  SCOPE="quick"
elif [ "$HINT" = "deep" ] || [ "$FILE_COUNT" -gt 400 ]; then
  AGENTS=5
  SCOPE="deep"
elif [ "$FILE_COUNT" -gt 150 ]; then
  AGENTS=4
  SCOPE="standard-plus"
else
  AGENTS=3
  SCOPE="standard"
fi

# Cap
if [ "$AGENTS" -gt 6 ]; then AGENTS=6; fi

ROLES='[]'
case "$AGENTS" in
  1) ROLES='["orchestrator+author"]' ;;
  2) ROLES='["orchestrator","architecture-author"]' ;;
  3) ROLES='["orchestrator","runtime-architecture","screen-flows"]' ;;
  4) ROLES='["orchestrator","runtime-architecture","screen-flows","api-detail"]' ;;
  5|6) ROLES='["orchestrator","runtime-architecture","auth-screens","employee-manager-screens","api-detail","publisher"]' ;;
esac

OUT="$ROOT/runs/$RUN_ID/agent-plan.json"
ARCHIFY_ROOT="$ROOT" RUN_ID="$RUN_ID" WS="$WS" HINT="$HINT" SCOPE="$SCOPE" AGENTS="$AGENTS" FILE_COUNT="$FILE_COUNT" ROLES="$ROLES" node <<'NODE'
const fs = require('fs');
const path = require('path');
const plan = {
  run_id: process.env.RUN_ID,
  archify_root: process.env.ARCHIFY_ROOT,
  workspace: process.env.WS || null,
  hint: process.env.HINT,
  scope: process.env.SCOPE,
  file_count_estimate: Number(process.env.FILE_COUNT || 0),
  agents_recommended: Number(process.env.AGENTS),
  roles: JSON.parse(process.env.ROLES || '[]'),
  after_done: {
    open_live_guide: true,
    tab: 'system',
    command: `bash "${process.env.ARCHIFY_ROOT}/../tools/ensure-live-guide.sh" "${process.env.ARCHIFY_ROOT}" system`
  },
  created_at: new Date().toISOString(),
};
const out = path.join(process.env.ARCHIFY_ROOT, 'runs', process.env.RUN_ID, 'agent-plan.json');
fs.writeFileSync(out, JSON.stringify(plan, null, 2));
console.log(JSON.stringify(plan, null, 2));
NODE

# Fix ensure path in plan (tools live in kit, not under project)
KIT_TOOLS="$(cd "$(dirname "$0")" && pwd)"
node -e "
const fs=require('fs');
const p='$OUT';
const j=JSON.parse(fs.readFileSync(p,'utf8'));
j.after_done.command='bash \"'+'$KIT_TOOLS'+'/ensure-live-guide.sh\" \"'+'$ROOT'+'\" system';
fs.writeFileSync(p, JSON.stringify(j,null,2));
console.log(p);
"
