# 07 — Reporter (JSON → report only)

## Purpose
Convert completed `results/<run_id>/summary.json` + `cases.json` into a human-readable report under `reports/<run_id>/`. **No app testing required. No app edits. Ever.**

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

Especially forbidden: any change under `/Users/hassan/Downloads/obecno/`.

## Input
- `/Users/hassan/Documents/obecno-archify/qa/results/<run_id>/summary.json`
- `/Users/hassan/Documents/obecno-archify/qa/results/<run_id>/cases.json`
- Optional: existing screenshot files already under `reports/<run_id>/`

## Output
Write:
- `/Users/hassan/Documents/obecno-archify/qa/reports/<run_id>/SUMMARY.md`

Suggested SUMMARY.md sections:
1. Run metadata (run_id, APK, device, agents)
2. Totals table (Pass/Fail/Blocked/Skip)
3. Failures (id, module, bug text, screenshot links)
4. Blocked / Skip with reasons
5. Layer rollup (A/B/C/D)
6. Sign-off line (tester / date)

## Rules
- Do not change case verdicts.
- Do not invent failures or passes not present in JSON.
- Relative links to screenshots under `reports/<run_id>/`.
- If JSON missing/invalid: write a short SUMMARY stating **Blocked** aggregation and stop.
