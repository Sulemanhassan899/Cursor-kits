#!/usr/bin/env bash
# Create Archify project data for an app workspace.
set -euo pipefail
WS="${1:-}"
if [ -z "$WS" ] || [ ! -d "$WS" ]; then
  echo "Usage: init-project-archify.sh /path/to/workspace" >&2
  exit 1
fi
WS="$(cd "$WS" && pwd)"
NAME="$(basename "$WS")"

KIT="$HOME/Documents/Archify-kit"
DEST="$KIT/projects/$NAME"
REG="$KIT/projects/registry.yaml"

mkdir -p "$DEST"/{diagrams/guide,qa/{catalog,results,reports,agents,tools},live-guide}

# Live guide template
rsync -a "$KIT/templates/live-guide/" "$DEST/live-guide/"

# Manifest
if [ ! -f "$DEST/manifest.json" ]; then
  cat > "$DEST/manifest.json" <<JSON
{
  "project_name": "${NAME}",
  "title": "${NAME} Live Guide",
  "architecture_entry": "diagrams/guide/index.html",
  "qa_root_relative": "qa",
  "default_tab": "system",
  "workspace_paths": ["${WS}"]
}
JSON
fi

# Placeholder guide page until diagrams are generated
if [ ! -f "$DEST/diagrams/guide/index.html" ]; then
  mkdir -p "$DEST/diagrams/guide"
  cat > "$DEST/diagrams/guide/index.html" <<HTML
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>${NAME} architecture</title>
<style>body{font-family:system-ui;background:#0f1419;color:#e7ecf3;padding:2rem}code{color:#9fdbff}</style>
</head><body>
<h1>${NAME} — architecture</h1>
<p>Run wake phrase <code>Make the archify of this project</code> to generate diagrams here.</p>
</body></html>
HTML
fi

if [ ! -f "$DEST/qa/catalog/scenarios.json" ]; then
  echo '[]' > "$DEST/qa/catalog/scenarios.json"
fi

# Registry append
if [ -f "$REG" ] && ! grep -q "$WS" "$REG" 2>/dev/null; then
  if grep -q 'projects: {}' "$REG"; then
    cat > "$REG" <<YAML
# Maps workspace folders → Archify roots.
projects:
  ${NAME}:
    workspace_paths:
      - ${WS}
    archify_root: ${DEST}
YAML
  else
    cat >> "$REG" <<YAML

  ${NAME}:
    workspace_paths:
      - ${WS}
    archify_root: ${DEST}
YAML
  fi
fi

# Always refresh local override
LOCAL="$KIT/projects/registry.local.yaml"
mkdir -p "$(dirname "$LOCAL")"
if [ ! -f "$LOCAL" ]; then
  cat > "$LOCAL" <<YAML
projects:
  ${NAME}:
    workspace_paths:
      - ${WS}
    archify_root: ${DEST}
YAML
elif ! grep -q "${NAME}:" "$LOCAL" 2>/dev/null; then
  cat >> "$LOCAL" <<YAML

  ${NAME}:
    workspace_paths:
      - ${WS}
    archify_root: ${DEST}
YAML
fi

echo "ARCHIFY_ROOT=$DEST"
