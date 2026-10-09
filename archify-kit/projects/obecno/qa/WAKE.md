# Wake phrases (Obecno QA_ROOT)

Global kit: `~/Documents/cursor-qa/` (or `~/Documents/QA-kit`)  
This folder is Obecno’s project QA data (`QA_ROOT`).

---

## 1) Release (full / parallel)

```
make a apk release build and wake up the QA agent
```

That means:

1. Build the Android **release APK** for Obecno.
2. Load logins from `credentials.local.yaml`.
3. Pick devices: `tools/pick-devices.sh` (up to 5) or user `device:` / `devices:` overrides.
4. Default **profile: full**. Orchestrator uses `agents/00-orchestrator.md` with **parallel shards** when 2+ devices are online.
5. Write only under `qa/results` + `qa/reports`.
6. **Do not edit** app source under `/Users/hassan/Downloads/obecno/`.

### Profile overrides (same message)

```
make a apk release build and wake up the QA agent

profile: smoke
```

```
make a apk release build and wake up the QA agent

profile: changed
changed_modules: Clock Module, Attendance Module
```

```
make a apk release build and wake up the QA agent

profile: full
devices: emulator-5554,emulator-5556,emulator-5558,emulator-5560,emulator-5562
```

| Profile | Meaning | Target (5 devices) |
|---------|---------|--------------------|
| smoke | Login, nav, 1 punch, key tabs | 10–30 min |
| changed | Modules you list (or diff file) | 30–60 min |
| full | Entire official catalog | 1–1.5 h |

### Credential / device overrides

```
employee: other.employee@thedemo.com / newpassword
manager: other.owner@thedemo.com / newpassword
device: emulator-5554
```

- Omit employee/manager → `credentials.local.yaml` (supports `employee_a` / `employee_b` for parallel).
- Omit devices → auto-pick up to 5 ready `adb` devices.
- Default APK:  
  `/Users/hassan/Downloads/obecno/build/app/outputs/flutter-apk/app-release.apk`

---

## 2) Debug / this screen

```
wake up the agent and QA this screen and its widgets (FILE_NAME) (WHAT_TO_QA)
```

1. **Debug** mode — no release build required.
2. Same credentials rules.
3. Auto-select device with `tools/pick-device.sh`.
4. Run `agents/08-screen-debug.md` only.
5. `run_id` like `YYYYMMDD-HHMM-debug-<screen>`.
6. **Do not edit** app source.

---

## 3) Promote a draft (human only)

After learn agent proposes drafts under `catalog/drafts/`:

```
promote QA draft DRAFT-YYYYMMDD-001
```

Agent runs:
```bash
bash tools/promote-draft.sh "$QA_ROOT" DRAFT-YYYYMMDD-001
```

Drafts are **not** official until promoted.

---

## After any release run

1. Orchestrator merges shards: `node tools/merge-shards.mjs "$QA_ROOT" <run_id>`
2. Excel: `node tools/generate-excel-report.mjs <run_id>`
3. Live guide: `bash tools/ensure-live-guide.sh <run_id>`
