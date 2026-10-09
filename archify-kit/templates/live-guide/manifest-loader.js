/**
 * Load project manifest.json (one level above live-guide/) and apply title + architecture iframe.
 */
export async function applyManifest() {
  const candidates = ['../manifest.json', './manifest.json'];
  let manifest = null;
  for (const url of candidates) {
    try {
      const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        manifest = await res.json();
        break;
      }
    } catch {
      /* try next */
    }
  }
  if (!manifest) return null;

  const title = manifest.title || `${manifest.project_name || 'Project'} Live Guide`;
  document.title = title;
  const h1 = document.querySelector('.brand h1');
  if (h1) h1.textContent = title;
  const sub = document.querySelector('.brand .subtitle');
  if (sub) {
    sub.textContent = manifest.subtitle || 'Architecture · QA — live from disk';
  }

  const frame = document.getElementById('system-frame');
  if (frame && manifest.architecture_entry) {
    const entry = String(manifest.architecture_entry).replace(/^\.\//, '');
    frame.src = entry.startsWith('../') ? entry : `../${entry}`;
  }

  const defaultTab = manifest.default_tab === 'qa' ? 'qa' : 'system';
  return { manifest, defaultTab };
}
