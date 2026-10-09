#!/usr/bin/env bash
# Resolve ARCHIFY_ROOT for a workspace path.
set -euo pipefail
WS="${1:-$(pwd)}"
WS="$(cd "$WS" && pwd)"

if [ -d "$HOME/Documents/Archify-kit" ]; then
  KIT="$HOME/Documents/Archify-kit"
elif [ -d "$HOME/Documents/archify-kit" ]; then
  KIT="$HOME/Documents/archify-kit"
else
  KIT="$HOME/Documents/Archify-kit"
fi

BASE="$KIT/projects"
NAME="$(basename "$WS")"

resolve_from_registry() {
  local REGISTRY="$1"
  [ -f "$REGISTRY" ] || return 1
  local IN_MATCH=""
  while IFS= read -r line; do
    case "$line" in
      *"archify_root:"*|*"qa_root:"*)
        # prefer archify_root; ignore qa_root unless no archify_root matched later
        if [ -n "${IN_MATCH:-}" ] && [[ "$line" == *archify_root:* ]]; then
          ROOT=$(printf '%s' "$line" | sed 's/.*archify_root:[[:space:]]*//' | tr -d '"' | tr -d "'")
          ROOT="${ROOT/#\~/$HOME}"
          if [ -d "$ROOT" ]; then
            echo "$ROOT"
            return 0
          fi
        fi
        ;;
      *"- $WS"*|*"$WS"*)
        IN_MATCH=1
        ;;
      [a-zA-Z0-9_-]*:*)
        if printf '%s' "$line" | grep -qE '^[[:space:]]{2}[a-zA-Z0-9_-]+:[[:space:]]*$'; then
          IN_MATCH=""
        fi
        ;;
    esac
  done < "$REGISTRY"
  return 1
}

if ROOT=$(resolve_from_registry "$KIT/projects/registry.local.yaml"); then
  echo "$ROOT"
  exit 0
fi
if ROOT=$(resolve_from_registry "$KIT/projects/registry.yaml"); then
  echo "$ROOT"
  exit 0
fi

# Legacy Obecno path
if [ "$NAME" = "obecno" ] && [ -d "$HOME/Documents/obecno-archify" ]; then
  echo "$HOME/Documents/obecno-archify"
  exit 0
fi

if [ -d "$BASE/$NAME" ]; then
  echo "$BASE/$NAME"
  exit 0
fi

if [ -d "$WS/.archify-project" ]; then
  echo "$WS/.archify-project"
  exit 0
fi

bash "$KIT/tools/init-project-archify.sh" "$WS" >/dev/null
echo "$BASE/$NAME"
