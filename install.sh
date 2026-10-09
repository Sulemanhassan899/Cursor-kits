#!/usr/bin/env bash
set -euo pipefail
KIT="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.cursor/rules"
cp "$KIT/cursor-rules/qa-archify-wake-global.mdc" "$HOME/.cursor/rules/qa-archify-wake-global.mdc"
# Keep older rule files pointing users to combined behavior
cp "$KIT/cursor-rules/qa-archify-wake-global.mdc" "$HOME/.cursor/rules/qa-wake-global.mdc"
cp "$KIT/cursor-rules/qa-archify-wake-global.mdc" "$HOME/.cursor/rules/archify-wake-global.mdc"
chmod +x "$KIT/tools/"*.sh
chmod +x "$KIT/qa-kit/tools/"*.sh 2>/dev/null || true
chmod +x "$KIT/archify-kit/tools/"*.sh 2>/dev/null || true
chmod +x "$KIT/install.sh"

# Compat links if missing
[ -e "$HOME/Documents/QA-kit" ] || ln -sfn "$KIT/qa-kit" "$HOME/Documents/QA-kit"
[ -e "$HOME/Documents/Archify-kit" ] || ln -sfn "$KIT/archify-kit" "$HOME/Documents/Archify-kit"
[ -e "$HOME/Documents/cursor-qa" ] || ln -sfn "$KIT/qa-kit" "$HOME/Documents/cursor-qa"

echo "Installed combined wake → ~/.cursor/rules/qa-archify-wake-global.mdc"
echo "Kit: $KIT"
echo "Wake QA (Archify auto): make a apk release build and wake up the QA agent"
