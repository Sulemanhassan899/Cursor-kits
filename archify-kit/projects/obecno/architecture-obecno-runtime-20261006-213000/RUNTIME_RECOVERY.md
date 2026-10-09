# runtime.html recovery

Original `obecno-runtime.html` was missing from `architecture-obecno-runtime-20261006-213000/` (JSON/finalize receipts only). No HTML was embeddable in those JSON fields. Agent transcript `60b90cb5-…` referenced the path but did not store the ~783KB artifact.

**Recovered by:** Archify `deliver` from frozen `candidate.json` (same components, connections, boundaries, cards, positions). Component `sources` + `meta.repository` were stripped for a temporary `candidate.norepo.json` because local `/usr/bin/git` fails with Xcode license (exit 69), so `--repo-root` finalize could not verify evidence. Diagram meaning/geometry were not reinvented.

| | Path | Bytes | Notes |
|--|--|--|--|
| Source | `architecture-obecno-runtime-20261006-213000/candidate.json` | 8293 | Frozen authoring |
| Regenerated | `…/obecno-runtime.html` | 780400 | Via `deliver` (no source chips) |
| Original receipt | finalize `artifact.bytes` | 783310 | Missing on disk; sha `3b8b6a2a…` |
| Guide copy | `enhanced/runtime.html` | 780400 | Same as regenerated |

Temporary: `candidate.norepo.json` (evidence stripped for deliver only).
