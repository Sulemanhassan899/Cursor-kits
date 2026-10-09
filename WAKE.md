# Unified wake — QA + Archify (one command)

Kit home: `~/Documents/Cursor-kits/`  
Contains both **QA-kit** and **Archify-kit**.

---

## Release / full (recommended)

```text
make a apk release build and wake up the QA agent
```

**This one phrase does both. Do not ask the user for a separate Archify command.**

The agent must:

1. Resolve `QA_ROOT` and `ARCHIFY_ROOT` for this workspace (init either if missing).
2. Build release APK (as usual).
3. Run QA (profiles / parallel shards as configured).
4. **Automatically run Archify** for the same project (agent picks how many Archify workers — do not ask).
5. When QA and Archify work for this wake are done, **automatically open Live Guide**  
   (`ensure-live-guide.sh` → QA tab if a `run_id` exists, else system tab).

Optional overrides still work (`profile:`, `devices:`, credentials).  
Optional: `skip_archify: true` only if the user explicitly adds it.

---

## Debug / one screen

```text
wake up the agent and QA this screen and its widgets (FILE) (WHAT_TO_QA)
```

Runs screen QA. **Also** ensures Archify Live Guide exists for the project and opens the live link when finished (Archify refresh is light unless diagrams are missing).

---

## Do not require

```text
Make the archify of this project
```

That phrase remains available for Archify-only work, but **QA wake already includes Archify**. Never tell the user they must run Archify separately after a QA wake.
