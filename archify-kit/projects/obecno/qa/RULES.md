# QA Hard Rules

## Write boundaries
QA **test-run** agents may **only** create/update files under:
- `/Users/hassan/Documents/obecno-archify/qa/results/**`
- `/Users/hassan/Documents/obecno-archify/qa/reports/**`

**Learn agent (`09-learn`)** may also write:
- `/Users/hassan/Documents/obecno-archify/qa/catalog/drafts/**`

**Humans / explicit promote** may update official catalog via:
- `tools/promote-draft.sh` → `catalog/scenarios.json`

## Forbidden
- **Any** edit under `/Users/hassan/Downloads/obecno/`
- Committing/PR against the app repo as part of QA
- "Fixing" bugs by changing product code
- Fake Pass; Fail → Pass without re-execution
- Counting `catalog/drafts` in release totals before promote
- Parallel workers sharing one account for punch/leave state

## Allowed non-write actions
- Install/sideload a **prebuilt** release APK
- Read catalog, profiles, shards, agents, RULES, WAKE, credentials.local.yaml
- `pick-device.sh` / `pick-devices.sh` / `plan-run.sh` / `filter-catalog.mjs` / `merge-shards.mjs`
- Screenshots under `qa/reports/<run_id>/`

## Parallelism
- Up to 5 devices / 5 agents — **same** quality bar as sequential
- Each worker writes only `results/<run_id>/shards/<shard_id>/`
- Orchestrator merges without changing verdicts

## Verdict integrity
- Never convert Fail → Pass without re-execution evidence
- Blocked ≠ Pass
- Skip only with explicit filter/environment reason

## Reporter
`07-reporter` only transforms JSON → markdown/Excel inputs. No app edits.
