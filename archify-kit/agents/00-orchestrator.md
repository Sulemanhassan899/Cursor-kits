# Archify Master Orchestrator

## Wake phrase
When the user says:

```text
Make the archify of this project
```

(or close variants like “archify this project”, “generate architecture for this project”) — follow this prompt.

## Purpose
Build or refresh architecture diagrams + Live Guide for the **current workspace**.  
Decide how many agents are needed. When finished, **always open the live link**.

## Steps (mandatory)

### 1) Resolve roots
```bash
KIT=~/Documents/Archify-kit
WS="$(pwd)"   # or the app workspace path
ARCHIFY_ROOT=$(bash "$KIT/tools/resolve-archify-root.sh" "$WS")
echo "$ARCHIFY_ROOT"
```
If missing, run `init-project-archify.sh` first.

### 2) Decide agent count (do this yourself — do not ask the user)
```bash
bash "$KIT/tools/plan-archify-agents.sh" "$ARCHIFY_ROOT" "$WS" standard
```
Read `agents_recommended` and `roles` from the printed JSON.

Policy (already encoded in the script; you may bump ±1 if the task is clearly wider/narrower):

| Signal | Agents |
|--------|--------|
| Tiny app / single diagram request | 1 |
| Normal app | 2–3 |
| Large multi-module (e.g. employee+manager+API) | 4–5 |
| Hard cap | 6 |

You **choose** the count from evidence (file count, modules, user wording). Do not make the user pick.

### 3) Assign work
- **1 agent:** you author + finalize everything.
- **2+ agents:** spawn parallel specialists (Cursor Task/subagents) for roles in the plan, e.g.:
  - runtime architecture
  - screen flows
  - API / detailed maps
  - publisher (assemble guide HTML + manifest)

Use the Archify skill (`~/.cursor/skills/archify`) / `finalize` for diagrams. Write outputs under `$ARCHIFY_ROOT/diagrams/` (and dated folders as needed).

Update `$ARCHIFY_ROOT/manifest.json` → `architecture_entry` to the main guide HTML.

### 4) Never edit product source for diagrams
Read the app repo for evidence. Write only under `$ARCHIFY_ROOT/**`.

### 5) After every successful Archify task — open Live Guide
**Always** run (no skipping):
```bash
bash ~/Documents/Archify-kit/tools/ensure-live-guide.sh "$ARCHIFY_ROOT" system
```
Tell the user the URL (usually `http://127.0.0.1:8765/live-guide/?tab=system#system`).

If QA was also updated in the same Archify root, you may open `qa` tab instead:
```bash
bash ~/Documents/Archify-kit/tools/ensure-live-guide.sh "$ARCHIFY_ROOT" qa <run_id>
```

### 6) Optional share URL
If the user wants a public link, follow `docs/HOSTING.md` (GitHub Pages). Local live guide is for this machine; Pages is for sharing.

## Output checklist
- [ ] `agent-plan.json` written
- [ ] Diagrams under `$ARCHIFY_ROOT`
- [ ] `manifest.json` points at the guide
- [ ] Live Guide started and browser opened
