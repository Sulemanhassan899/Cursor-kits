# QA Screen / Debug agent

## Purpose
While the developer is working, QA **one screen (and its widgets)** on a **debug** build/session. Focused, fast, not a full release suite.

## Wake phrase (examples)
```
wake up the agent and QA this screen and its widgets (login_pass.dart) (ui, functionality)
```
```
wake up the agent and QA this screen and its widgets (clock_screen.dart) (ui)
```
```
wake up the agent and QA this screen and its widgets (add_attendance_bottom_sheet.dart) (functionality, validation, offline)
```

## Mode
- **Build mode:** debug (prefer running/debug app already on device, or `flutter run` / debug install — do **not** require a release APK).
- **Scope:** only the named file/screen + its widgets/sheets it opens.
- **Focus tags** from the user message (examples): `ui`, `functionality`, `validation`, `responsiveness`, `interactions`, `offline`, `security`, `spelling` — test only what they asked; if they say “anything” / omit focus, cover ui + functionality + interactions.

## Credentials / device
- Load `/Users/hassan/Documents/obecno-archify/qa/credentials.local.yaml` (overrides in message still win).
- Auto-pick device: `bash /Users/hassan/Documents/obecno-archify/qa/tools/pick-device.sh`

## Allowed write paths
```
/Users/hassan/Documents/obecno-archify/qa/results/**
/Users/hassan/Documents/obecno-archify/qa/reports/**
```

## Forbidden
- Edit / delete / “fix” anything under `/Users/hassan/Downloads/obecno/`
- Expanding into a full release suite unless the user asked for the release wake phrase

## Inputs
1. **File / screen** named in the wake message (resolve under `lib/` by filename if needed — **read only**).
2. **What to QA** (ui / functionality / …).
3. Catalog: filter `scenarios.json` to matching module/screen when possible; also invent short focused cases for widgets in that file if catalog is thin.
4. `RULES.md`, `WAKE.md`

## run_id
Use `YYYYMMDD-HHMM-debug-<short-screen>` e.g. `20261008-2210-debug-login_pass`.

## Output
Write:
- `results/<run_id>/summary.json` — include human labels:
  - `title`: e.g. `DEBUG-CLOCK SCREEN`
  - `excel_title`: e.g. `DEBUG CLOCK SCREEN EXCEL REPORT`
- `results/<run_id>/cases.json` (Pass|Fail|Blocked|Skip + why / bug / fix when Fail)
- Screenshots under `reports/<run_id>/`
- Then run: `node /Users/hassan/Documents/obecno-archify/qa/tools/generate-excel-report.mjs <run_id>`
- Then **auto-open** QA Excel UI (starts server if needed):
  `bash /Users/hassan/Documents/obecno-archify/qa/tools/ensure-live-guide.sh <run_id>`

## How to test
1. Confirm debug app is on device (or start debug run without changing product code).
2. Navigate to the target screen like a real user.
3. Exercise widgets in that file (buttons, fields, sheets, lists, errors).
4. Record evidence for Fail/Blocked.

## Pass | Fail | Blocked | Skip
Same rules as other QA agents. Never edit code to make a Fail become Pass.
