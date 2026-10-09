# How to run QA

## Simple wakes

### Release (parallel when devices allow)

```
make a apk release build and wake up the QA agent
```

Optional:
```
profile: smoke | changed | full
devices: serial1,serial2,...
changed_modules: Clock Module, Attendance Module
employee: ... / ...
manager: ... / ...
```

### Debug (one screen)

```
wake up the agent and QA this screen and its widgets (login_pass.dart) (ui, functionality)
```

### Promote draft (human gate)

```
promote QA draft DRAFT-20261009-001
```

## Parallel model (5 agents / 5 devices)

| Agent | Shard | Account |
|-------|-------|---------|
| Orchestrator | smoke-lead + merge | employee_primary |
| Worker | clock | employee_a |
| Worker | attendance | employee_b |
| Worker | auth-more-quality | employee_primary |
| Worker | manager (+ cross after) | manager_primary |

Plan file: `results/<run_id>/plan.json` from `tools/plan-run.sh`.  
Workers: `agents/10-shard-worker.md`.  
Merge: `tools/merge-shards.mjs`.  
Learn drafts: `agents/09-learn.md` → human `tools/promote-draft.sh`.

## Credentials

Edit `credentials.local.yaml` (see `credentials.example.yaml` for multi-account parallel fields).  
Never commit `credentials.local.yaml`.

## After the run

1. `qa/results/<run_id>/` (shards + merged `cases.json`)
2. Excel: `node qa/tools/generate-excel-report.mjs <run_id>`
3. Live guide: `bash qa/tools/ensure-live-guide.sh <run_id>`

## Quality

- Same Pass/Fail rules whether 1 or 5 devices
- Drafts never count until you promote them
- 1 device → sequential shards (still full quality, slower)
