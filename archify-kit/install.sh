#!/usr/bin/env bash
set -euo pipefail
KIT="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.cursor/rules"
cp "$KIT/cursor-rules/archify-wake-global.mdc" "$HOME/.cursor/rules/archify-wake-global.mdc"
chmod +x "$KIT/tools/"*.sh
echo "Installed Archify wake rule → ~/.cursor/rules/archify-wake-global.mdc"
echo "Kit: $KIT"
echo "Next: bash tools/init-project-archify.sh /path/to/your/app"
echo "Wake: Make the archify of this project"
