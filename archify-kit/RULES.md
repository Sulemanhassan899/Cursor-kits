# Archify Hard Rules

## Write boundaries
Archify agents may write under:
- `$ARCHIFY_ROOT/**` (diagrams, live-guide, manifest, runs, qa if co-located)

## Forbidden
- Editing product app source to “make diagrams work”
- Skipping the Live Guide open after a successful Archify task
- Inventing fake repo evidence

## Agent count
- Orchestrator **must** decide agent count from task/repo signals
- Do not force the user to pick 1 vs 5 unless they explicitly override

## Live link
After every completed Archify (or QA) task for a project with Live Guide:
```bash
bash ~/Documents/Archify-kit/tools/ensure-live-guide.sh "$ARCHIFY_ROOT" system
```
