# Cursor-kits — QA + Archify (one repo)

One kit for **QA agents** and **Archify / Live Guide**.

Wake **QA once** → Archify runs automatically → Live Guide opens.  
No separate Archify command. Do not ask the user.

**Repo:** https://github.com/Sulemanhassan899/Cursor-kits  

Also still mirrored as:
- https://github.com/Sulemanhassan899/QA-kit  
- https://github.com/Sulemanhassan899/Archify-kit  

Prefer **this** combined repo for new machines.

---

## Wake (only command you need)

```text
make a apk release build and wake up the QA agent
```

That automatically:

1. Builds release + runs QA  
2. Attaches / runs **Archify** for the same project (agent picks worker count)  
3. Opens the **Live Guide** URL when done  

Debug screen wake also opens Live Guide when finished:

```text
wake up the agent and QA this screen and its widgets (login_pass.dart) (ui, functionality)
```

Optional only if you truly want to skip Archify:

```text
skip_archify: true
```

---

## Install

```bash
git clone https://github.com/Sulemanhassan899/Cursor-kits.git ~/Documents/Cursor-kits
cd ~/Documents/Cursor-kits
bash install.sh
```

This installs the combined Cursor wake rule and links legacy paths (`QA-kit`, `Archify-kit`, `cursor-qa`) when missing.

---

## Layout

```text
Cursor-kits/
  WAKE.md                 # unified wake (QA includes Archify)
  install.sh
  cursor-rules/           # one global rule
  tools/                  # resolve both roots, ensure archify, open live
  qa-kit/                 # full QA agent kit
  archify-kit/            # full Archify + Live Guide kit
  docs/HOSTING.md         # share Live Guide on GitHub Pages
```

---

## Public Live Guide (Obecno example)

```text
https://sulemanhassan899.github.io/Archify-kit/projects/obecno/live-guide/
```

(Hosted from Archify content; same files live under `archify-kit/projects/obecno/` here.)

---

## Safety

- QA / Archify never edit product app source  
- Credentials stay in local `credentials.local.yaml` (gitignored)  
- Draft QA cases still need human promote  
