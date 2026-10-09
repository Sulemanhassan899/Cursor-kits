# Make Archify Live Guide shareable (GitHub)

Local Live Guide (`http://127.0.0.1:8765`) works only on **your** machine.  
To share a URL with others, use **GitHub Pages**.

---

## Fast path (already set up for this repo)

1. Open: https://github.com/Sulemanhassan899/Archify-kit/settings/pages  
2. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** / **/ (root)**
3. Save.

After a minute or two, open:

```text
https://sulemanhassan899.github.io/Archify-kit/
https://sulemanhassan899.github.io/Archify-kit/projects/obecno/live-guide/
```

The `gh-pages` branch is a static copy of diagrams + Live Guide UI (safe to share).

---

## Update the public site after new diagrams

From your Mac:

```bash
cd ~/Documents/Archify-kit
# (optional) regenerate _site then force-push gh-pages — or ask the agent:
# "publish archify live guide to github pages"
git push origin main
```

Then refresh the `gh-pages` branch contents (agent/tools can rebuild it) and push `gh-pages` again.

---

## What others can see vs what stays local

| On GitHub Pages (shareable) | On your Mac only (localhost:8765) |
|-----------------------------|-----------------------------------|
| Architecture HTML / diagrams | Live file-watching (SSE) |
| Static Live Guide UI | Live QA Excel APIs against disk |
| Manifest + iframes | Writing new QA results while testing |

---

## Option: GitHub Actions

There is also `.github/workflows/pages.yml`.  
If your GitHub token has the `workflow` scope, Actions can deploy automatically on every `main` push.  
Otherwise use the **gh-pages branch** method above (no special token needed).

To add workflow scope (optional):

```bash
gh auth refresh -h github.com -s repo,workflow
```

---

## Custom domain (optional)

Settings → Pages → Custom domain → e.g. `archify.yourdomain.com`  
DNS CNAME → `sulemanhassan899.github.io`

---

## Always-on live server (advanced)

For real live QA APIs for remote teammates, run `node live-guide/server.mjs` on a VPS with HTTPS.  
GitHub Pages cannot run that Node watch server.

---

## Security

- Never commit `credentials.local.yaml`
- `registry.local.yaml` is gitignored
- Review QA results before publishing if they contain sensitive notes
