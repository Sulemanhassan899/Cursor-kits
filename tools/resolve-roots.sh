#!/usr/bin/env bash
# Print QA_ROOT and ARCHIFY_ROOT for a workspace (init-friendly).
set -euo pipefail
WS="${1:-$(pwd)}"
WS="$(cd "$WS" && pwd)"
KIT="${CURSOR_KITS_HOME:-$HOME/Documents/Cursor-kits}"

QA_RESOLVE="$KIT/qa-kit/tools/resolve-qa-root.sh"
# Fallbacks to legacy installs
if [ ! -f "$QA_RESOLVE" ]; then
  QA_RESOLVE="$HOME/Documents/QA-kit/tools/resolve-qa-root.sh"
fi
if [ ! -f "$QA_RESOLVE" ]; then
  QA_RESOLVE="$HOME/Documents/cursor-qa/tools/resolve-qa-root.sh"
fi

ARCH_RESOLVE="$KIT/archify-kit/tools/resolve-archify-root.sh"
if [ ! -f "$ARCH_RESOLVE" ]; then
  ARCH_RESOLVE="$HOME/Documents/Archify-kit/tools/resolve-archify-root.sh"
fi

QA_ROOT=$(bash "$QA_RESOLVE" "$WS")
ARCHIFY_ROOT=$(bash "$ARCH_RESOLVE" "$WS")

echo "QA_ROOT=$QA_ROOT"
echo "ARCHIFY_ROOT=$ARCHIFY_ROOT"
