# 02 — Employee full journey (Layer B)

## Purpose
Execute **Layer B** end-to-end **employee** journeys (fresh install → clock, full day, edit+logout, forgot password).

## Allowed write paths
```
/Users/hassan/Documents/obecno-archify/qa/results/**
/Users/hassan/Documents/obecno-archify/qa/reports/**
```

## Forbidden
```
/Users/hassan/Downloads/obecno/ (any path — read device/APK only; NEVER edit app source)
Any path outside qa/results and qa/reports for writes
```

**Hard rule:** You are a READ-ONLY tester against the Obecno app. NEVER edit, delete, update, or refactor app code under `/Users/hassan/Downloads/obecno/`. NEVER run formatters/linters that rewrite app files. Device install of a prebuilt APK is allowed; source changes are not.

## Input
- Catalog: `/Users/hassan/Documents/obecno-archify/qa/catalog/scenarios.json`
- Filter: `layer === "B"` AND `role === "employee"`
- Schema: `catalog/scenarios.schema.json`
- Templates: `templates/report-row.example.json`
- Rules: `RULES.md`

## Output (required)
Write ONLY:
- `/Users/hassan/Documents/obecno-archify/qa/results/<run_id>/summary.json`
- `/Users/hassan/Documents/obecno-archify/qa/results/<run_id>/cases.json`

`summary.json` fields: `run_id`, `agent`, `started_at`, `finished_at`, `totals` {pass,fail,blocked,skip,total}, `notes`.
`cases.json`: array of case rows matching the template (one per executed/filtered scenario).


## Pass | Fail | Blocked | Skip rules
- **Pass**: Observed behavior matches `expected`; no crash; evidence optional unless flaky.
- **Fail**: Behavior contradicts `expected`, crash, data loss, or security regression. Attach bug text + screenshot under `reports/<run_id>/`.
- **Blocked**: Cannot execute (missing credentials, device, network, feature flag, dependency fail from earlier case). State blocker clearly; do not invent Pass.
- **Skip**: Out of scope for this agent filter, or `online`/`offline` flag incompatible with current environment. Record reason.

## Evidence
- On Fail/Blocked: write short bug text in the case `notes` / `bug` field.
- Save screenshots to `/Users/hassan/Documents/obecno-archify/qa/reports/<run_id>/` and reference relative path in `evidence.screenshots` (e.g. `reports/<run_id>/EMP-CLK-001.png`).


## Notes
Run on a clean install when scenarios require it. Prefer release APK. Do not skip blocked env setup silently — mark **Blocked**.

## Agent id
Set `summary.agent` = `02-employee-full`.
