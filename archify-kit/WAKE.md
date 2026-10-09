# Archify wake phrases

Kit home: `~/Documents/Archify-kit/`

## Main wake

```text
Make the archify of this project
```

That means:

1. Resolve `ARCHIFY_ROOT` for this workspace (`tools/resolve-archify-root.sh`).
2. Init project data if needed (`tools/init-project-archify.sh`).
3. **Agent decides** how many workers to use (`tools/plan-archify-agents.sh`) — you do not choose.
4. Generate / refresh architecture diagrams into `$ARCHIFY_ROOT`.
5. Update `manifest.json`.
6. **Automatically open** the Live Guide (`tools/ensure-live-guide.sh`).

### Optional hints (same message)

```text
Make the archify of this project

hint: quick
```

```text
Make the archify of this project

hint: deep
```

- `quick` → fewer agents / smaller scope  
- `deep` → more agents / fuller maps  
- omit → agent picks from repo size

## After QA runs (shared live guide)

If this Archify root also holds `qa/`, QA wake can open the QA tab the same way.

## Promote / share

See `docs/HOSTING.md` to publish a shareable GitHub Pages URL.
