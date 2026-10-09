# Archify Kit — architecture + Live Guide for every project

Reusable **Archify kit** for Cursor (same idea as [QA-kit](https://github.com/Sulemanhassan899/QA-kit)).

Say one phrase. The agent maps your project, picks how many workers it needs, writes diagrams, and **opens the Live Guide link** when done.

GitHub: https://github.com/Sulemanhassan899/Archify-kit  
Author: [Sulemanhassan899](https://github.com/Sulemanhassan899)

---

## Wake phrase

```text
Make the archify of this project
```

Optional:

```text
Make the archify of this project

hint: quick
```

```text
Make the archify of this project

hint: deep
```

---

## What happens

1. Finds or creates **ARCHIFY_ROOT** for this app (`projects/<app-name>/`).
2. **Decides agent count alone** (1–6) from repo size / hint — you do not pick.
3. Builds architecture diagrams into that folder.
4. Updates `manifest.json`.
5. Starts Live Guide and **opens the browser**  
   → usually `http://127.0.0.1:8765/live-guide/?tab=system#system`

Agents **do not edit** your app source. They only read it for evidence.

---

## Install (new Mac)

```bash
git clone https://github.com/Sulemanhassan899/Archify-kit.git ~/Documents/Archify-kit
cd ~/Documents/Archify-kit

mkdir -p ~/.cursor/rules
cp cursor-rules/archify-wake-global.mdc ~/.cursor/rules/

bash tools/init-project-archify.sh /path/to/your/app
```

Restart Cursor (or open a new Agent chat).

You can keep [QA-kit](https://github.com/Sulemanhassan899/QA-kit) installed too — both wake rules can live in `~/.cursor/rules/`.

---

## Obecno (already included)

This repo ships the Obecno architecture + Live Guide under:

```text
projects/obecno/
```

On your machine, wake Archify from the Obecno app workspace; resolve should point at that folder (see `projects/registry.local.yaml` on your Mac — gitignored).

---

## Share a URL with others (GitHub Pages)

Local `127.0.0.1` is only for you.

**Public site (GitHub Pages):**

```text
https://sulemanhassan899.github.io/Archify-kit/
https://sulemanhassan899.github.io/Archify-kit/projects/obecno/live-guide/
```

Pages is deployed from the `gh-pages` branch. Full steps: [docs/HOSTING.md](./docs/HOSTING.md)

---

## Folder layout

```text
Archify-kit/
  WAKE.md RULES.md README.md
  agents/                 # orchestrator + diagram worker
  tools/                  # init, resolve, plan agents, open live guide
  templates/live-guide/   # portable dual-tab UI + server
  templates/project/      # empty project skeleton
  projects/<app>/         # per-app diagrams + live-guide (+ optional qa/)
  docs/HOSTING.md         # how to go public on GitHub
  cursor-rules/           # copy into ~/.cursor/rules/
```

---

## Agent count (automatic)

| Situation | Typical agents |
|-----------|----------------|
| Small / `hint: quick` | 1 |
| Normal app | 2–3 |
| Large / `hint: deep` | 4–5 |
| Hard max | 6 |

Script: `tools/plan-archify-agents.sh`

---

## Related

- QA wake kit: https://github.com/Sulemanhassan899/QA-kit  
- Archify diagram engine skill (Cursor skill): installed under `~/.cursor/skills/archify` on machines that use finalize/deliver

---

## Safety

- No `credentials.local.yaml` in git  
- `registry.local.yaml` is gitignored (machine paths)  
- Product app repos stay read-only during Archify

---

## Prefer the combined repo

**Cursor-kits** (QA + Archify together, one wake):

https://github.com/Sulemanhassan899/Cursor-kits

QA wake automatically runs Archify and opens Live Guide. No separate Archify command.

