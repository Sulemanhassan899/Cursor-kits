# QA Agents — how to run in Cursor

Each file is a **system prompt** for a Cursor agent chat.

## Prerequisites
1. Release APK **or** debug session (`../WAKE.md`).
2. Read `../RULES.md` — never edit the Obecno app.
3. Catalog: `../catalog/scenarios.json` (official only).

## Parallel release (recommended)
1. Wake: `make a apk release build and wake up the QA agent` (+ optional `profile:` / `devices:`).
2. Orchestrator (`00-orchestrator.md`) runs `tools/plan-run.sh`.
3. Open **up to 4 worker** chats with `10-shard-worker.md`, each given `run_id`, `shard_id`, `device`, `account` from `results/<run_id>/plan.json`.
4. Orchestrator merges (`merge-shards.mjs`) → `07-reporter` → Excel → live guide.
5. Optional: `09-learn.md` drafts → you promote with `promote-draft.sh`.

## Profiles
- `smoke` — fast gate
- `changed` — modules in `changed_modules.txt`
- `full` — whole official catalog

## Debug / one-screen
`08-screen-debug.md` with the debug wake phrase.

## Legacy sequential specialists
`01`–`06` still work on one device if you are not using shards.

## Sample data
See `../results/sample_run/` and `../reports/sample_run/SUMMARY.md` if present.
