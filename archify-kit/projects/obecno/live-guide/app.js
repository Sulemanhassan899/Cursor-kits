/**
 * Obecno Live Guide — dual-tab host.
 * Polls / EventSource for QA + catalog changes; cache-busts all fetches.
 */

const SCENARIOS_URL = '../qa/catalog/scenarios.json';
const RESULTS_API = '/api/qa/runs';
const REPORTS_API = '/api/qa/reports';
const EXCEL_API = '/api/qa/excel';
const WATCH_SSE = '/api/watch';
const POLL_MS = 2000;

const state = {
  tab: 'qa',
  scenariosFingerprint: '',
  resultsFingerprint: '',
  scenarios: [],
  runs: [],
  selectedRunId: null,
  summary: null,
  cases: [],
  reports: [],
  roleFilter: 'all',
  liveMode: 'idle',
  statusFilter: null,
  excel: null,
  excelSheetIndex: 0,
  excelFingerprint: '',
};

const els = {
  liveStatus: document.getElementById('live-status'),
  lastRefresh: document.getElementById('last-refresh'),
  qaSummary: document.getElementById('qa-summary'),
  qaRuns: document.getElementById('qa-runs'),
  qaExcel: document.getElementById('qa-excel'),
  excelMeta: document.getElementById('excel-meta'),
  excelViewerCard: document.getElementById('excel-viewer-card'),
  excelBannerSub: document.getElementById('excel-banner-sub'),
  excelBannerActions: document.getElementById('excel-banner-actions'),
  excelSheetTabs: document.getElementById('excel-sheet-tabs'),
  excelTableWrap: document.getElementById('excel-table-wrap'),
  excelActionToast: document.getElementById('excel-action-toast'),
  scenarioStats: document.getElementById('scenario-stats'),
  scenarioFilters: document.getElementById('scenario-filters'),
  scenarioList: document.getElementById('scenario-list'),
  qaBugs: document.getElementById('qa-bugs'),
  drawer: document.getElementById('status-drawer'),
  drawerTitle: document.getElementById('drawer-title'),
  drawerSub: document.getElementById('drawer-sub'),
  drawerBody: document.getElementById('drawer-body'),
};

function bust(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}t=${Date.now()}`;
}

async function fetchJson(url) {
  const res = await fetch(bust(url), { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function setLiveStatus(mode, label) {
  state.liveMode = mode;
  els.liveStatus.className = `pill pill-${mode === 'sse' ? 'live' : mode === 'poll' ? 'poll' : mode === 'err' ? 'err' : 'idle'}`;
  els.liveStatus.textContent = label;
}

function stampRefresh() {
  els.lastRefresh.textContent = `updated ${new Date().toLocaleTimeString()}`;
}

function normalizeScenarios(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.scenarios)) return payload.scenarios;
  if (Array.isArray(payload.cases)) return payload.cases;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function countsFromSummary(summary) {
  if (!summary) return { pass: 0, fail: 0, blocked: 0, skip: 0, total: 0 };
  const c = summary.counts || summary.totals || summary.summary || {};
  const pass = Number(c.pass ?? c.passed ?? summary.pass ?? 0) || 0;
  const fail = Number(c.fail ?? c.failed ?? summary.fail ?? 0) || 0;
  const blocked = Number(c.blocked ?? summary.blocked ?? 0) || 0;
  const skip = Number(c.skip ?? c.skipped ?? summary.skip ?? 0) || 0;
  const total = Number(c.total ?? pass + fail + blocked + skip) || 0;
  return { pass, fail, blocked, skip, total };
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Tabs ---------- */

function activateTab(id, { syncHash = true } = {}) {
  const next = id === 'qa' ? 'qa' : 'system';
  state.tab = next;
  document.querySelectorAll('.tab').forEach((t) => {
    const on = t.dataset.tab === next;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('.panel').forEach((panel) => {
    const on = panel.id === `panel-${next}`;
    panel.classList.toggle('is-active', on);
    panel.hidden = !on;
  });
  if (syncHash) {
    const url = new URL(window.location.href);
    url.hash = next === 'qa' ? 'qa' : '';
    if (next === 'qa') url.searchParams.set('tab', 'qa');
    else url.searchParams.delete('tab');
    history.replaceState(null, '', url);
  }
}

function tabFromLocation() {
  const url = new URL(window.location.href);
  const q = (url.searchParams.get('tab') || '').toLowerCase();
  const hash = (url.hash || '').replace(/^#/, '').toLowerCase();
  if (q === 'system' || hash === 'system') return 'system';
  // Default: QA Agent tab (Excel sheet visible first)
  return 'qa';
}

function runIdFromLocation() {
  const url = new URL(window.location.href);
  return url.searchParams.get('run') || url.searchParams.get('run_id') || null;
}

function initTabs() {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
  window.addEventListener('hashchange', () => activateTab(tabFromLocation(), { syncHash: false }));
  activateTab(tabFromLocation(), { syncHash: false });
}

/* ---------- Scenarios ---------- */

function renderScenarioStats(list) {
  const roles = {};
  const modules = new Set();
  for (const s of list) {
    const r = (s.role || 'unknown').toLowerCase();
    roles[r] = (roles[r] || 0) + 1;
    if (s.module) modules.add(s.module);
  }
  els.scenarioStats.innerHTML = `
    <span class="stat"><strong>${list.length}</strong> scenarios</span>
    <span class="stat"><strong>${modules.size}</strong> modules</span>
    ${Object.entries(roles)
      .map(([k, v]) => `<span class="stat">${escapeHtml(k)} <strong>${v}</strong></span>`)
      .join('')}
  `;
}

function renderFilters(list) {
  const roles = ['all', ...new Set(list.map((s) => (s.role || 'unknown').toLowerCase())).values()];
  if (list.length === 0) {
    els.scenarioFilters.hidden = true;
    return;
  }
  els.scenarioFilters.hidden = false;
  els.scenarioFilters.innerHTML = roles
    .map(
      (r) =>
        `<button type="button" class="filter-btn${state.roleFilter === r ? ' is-active' : ''}" data-role="${escapeHtml(r)}">${escapeHtml(r)}</button>`
    )
    .join('');
  els.scenarioFilters.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.roleFilter = btn.dataset.role;
      renderScenarios();
    });
  });
}

function renderScenarios() {
  const all = state.scenarios;
  if (!all.length) {
    els.scenarioList.innerHTML =
      '<p class="empty">No scenarios yet. Add <code>qa/catalog/scenarios.json</code> — this tab updates live.</p>';
    els.scenarioStats.innerHTML = '';
    els.scenarioFilters.hidden = true;
    return;
  }

  renderScenarioStats(all);
  renderFilters(all);

  const filtered =
    state.roleFilter === 'all'
      ? all
      : all.filter((s) => (s.role || 'unknown').toLowerCase() === state.roleFilter);

  const groups = new Map();
  for (const s of filtered) {
    const mod = s.module || 'Other';
    if (!groups.has(mod)) groups.set(mod, []);
    groups.get(mod).push(s);
  }

  const html = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mod, items]) => {
      const rows = items
        .map((s) => {
          const role = (s.role || '').toLowerCase();
          const title = s.functionality || s.title || s.name || s.screen || s.id;
          const meta = [s.screen, s.layer ? `layer ${s.layer}` : null, Array.isArray(s.tags) ? s.tags.join(', ') : null]
            .filter(Boolean)
            .join(' · ');
          return `<div class="scenario-row">
            <div class="scenario-id">${escapeHtml(s.id || '—')}</div>
            <div>
              <div class="scenario-title">${escapeHtml(title)}</div>
              ${meta ? `<span class="scenario-meta">${escapeHtml(meta)}</span>` : ''}
            </div>
            <span class="badge role-${escapeHtml(role)}">${escapeHtml(role || 'n/a')}</span>
          </div>`;
        })
        .join('');
      return `<div class="module-group">
        <div class="module-head">${escapeHtml(mod)} <span>${items.length}</span></div>
        ${rows}
      </div>`;
    })
    .join('');

  els.scenarioList.innerHTML = html || '<p class="empty">No scenarios match this filter.</p>';
}

async function loadScenarios() {
  try {
    const data = await fetchJson(SCENARIOS_URL);
    const list = normalizeScenarios(data);
    const fp = JSON.stringify({ n: list.length, ids: list.slice(0, 5).map((x) => x.id), tail: list.at(-1)?.id });
    if (fp === state.scenariosFingerprint) return false;
    state.scenariosFingerprint = fp;
    state.scenarios = list;
    renderScenarios();
    return true;
  } catch (err) {
    console.warn('scenarios fetch failed', err);
    if (!state.scenarios.length) {
      els.scenarioList.innerHTML =
        '<p class="empty">Could not load <code>qa/catalog/scenarios.json</code> yet. Empty catalog or path missing — UI will retry.</p>';
    }
    return false;
  }
}

/* ---------- Results / reports ---------- */

function normalizeStatus(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'passed' || v === 'pass' || v === 'success') return 'pass';
  if (v === 'failed' || v === 'fail' || v === 'error') return 'fail';
  if (v === 'blocked') return 'blocked';
  if (v === 'skipped' || v === 'skip') return 'skip';
  return v || 'unknown';
}

function catalogById() {
  const map = new Map();
  for (const s of state.scenarios) {
    if (s.id) map.set(s.id, s);
  }
  return map;
}

function casesForStatus(statusKey) {
  return state.cases.filter((c) => normalizeStatus(c.status) === statusKey);
}

function openStatusDrawer(statusKey) {
  if (!els.drawer) return;
  state.statusFilter = statusKey;
  const labels = { pass: 'Passed', fail: 'Failed', blocked: 'Blocked', skip: 'Skipped' };
  const title = labels[statusKey] || statusKey;
  const items = casesForStatus(statusKey);
  const catalog = catalogById();

  els.drawerTitle.textContent = `${title} scenarios`;
  els.drawerSub.textContent = `${items.length} case(s) in run ${state.selectedRunId || '—'} · click a card above to filter`;

  if (!items.length) {
    els.drawerBody.innerHTML = `<p class="empty">No ${escapeHtml(statusKey)} cases in this run’s <code>cases.json</code> yet.</p>`;
  } else {
    els.drawerBody.innerHTML = items
      .map((c) => {
        const id = c.scenario_id || c.id || '—';
        const cat = catalog.get(id) || {};
        const functionality =
          c.functionality || cat.functionality || cat.title || c.screen || id;
        const module = c.module || cat.module || '—';
        const screen = c.screen || cat.screen || '';
        const why = c.why || c.reason || c.notes || '';
        const bug = c.bug || c.bug_details || c.error || '';
        const fix = c.fix || c.action || c.recommendation || c.needs || '';
        const expected = c.expected || cat.expected || '';
        const actual = c.actual || '';
        const evidence = (c.evidence && c.evidence.screenshots) || c.screenshots || [];
        const st = normalizeStatus(c.status);

        return `<article class="case-card status-${escapeHtml(st)}">
          <header class="case-card-head">
            <span class="case-id">${escapeHtml(id)}</span>
            <span class="badge role-${escapeHtml((c.role || cat.role || '').toLowerCase())}">${escapeHtml(c.role || cat.role || 'n/a')}</span>
            <span class="case-status">${escapeHtml(st)}</span>
          </header>
          <h3 class="case-title">${escapeHtml(functionality)}</h3>
          <p class="case-meta">${escapeHtml([module, screen, c.layer ? `layer ${c.layer}` : ''].filter(Boolean).join(' · '))}</p>
          ${why ? `<div class="case-block"><div class="case-label">Why</div><p>${escapeHtml(why)}</p></div>` : ''}
          ${expected ? `<div class="case-block"><div class="case-label">Expected</div><p>${escapeHtml(expected)}</p></div>` : ''}
          ${actual ? `<div class="case-block"><div class="case-label">Actual</div><p>${escapeHtml(actual)}</p></div>` : ''}
          ${bug ? `<div class="case-block bug"><div class="case-label">Bug</div><p>${escapeHtml(bug)}</p></div>` : ''}
          ${fix ? `<div class="case-block fix"><div class="case-label">What needs to be done</div><p>${escapeHtml(fix)}</p></div>` : ''}
          ${
            evidence.length
              ? `<div class="case-block"><div class="case-label">Evidence</div><ul class="evidence-list">${evidence
                  .map((e) => {
                    const rel = String(e).replace(/^reports\//, '');
                    const href = `../qa/reports/${rel.replace(/^\/+/, '')}`;
                    return `<li><a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(e)}</a></li>`;
                  })
                  .join('')}</ul></div>`
              : ''
          }
        </article>`;
      })
      .join('');
  }

  els.drawer.hidden = false;
  document.body.classList.add('drawer-open');
}

function closeStatusDrawer() {
  if (!els.drawer) return;
  els.drawer.hidden = true;
  document.body.classList.remove('drawer-open');
  state.statusFilter = null;
  // clear active chip styles
  els.qaSummary.querySelectorAll('.count-chip.is-active').forEach((el) => el.classList.remove('is-active'));
}

function initDrawer() {
  if (!els.drawer) return;
  els.drawer.querySelectorAll('[data-close-drawer]').forEach((el) => {
    el.addEventListener('click', closeStatusDrawer);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.drawer.hidden) closeStatusDrawer();
  });
}

function renderSummary(summary, runId) {
  if (!summary) {
    els.qaSummary.innerHTML =
      '<p class="empty">No results yet. When a QA run writes under <code>qa/results/</code>, counts appear here.</p>';
    renderBugs([]);
    return;
  }
  const counts = countsFromSummary(summary);
  const started = summary.startedAt || summary.started_at || summary.started || '';
  const finished = summary.finishedAt || summary.finished_at || summary.finished || '';
  const status = summary.status || summary.state || '';
  els.qaSummary.innerHTML = `
    <div class="counts">
      <button type="button" class="count-chip pass" data-status="pass" title="Show passed scenarios"><span class="label">Pass</span><span class="value">${counts.pass}</span></button>
      <button type="button" class="count-chip fail" data-status="fail" title="Show failed scenarios"><span class="label">Fail</span><span class="value">${counts.fail}</span></button>
      <button type="button" class="count-chip blocked" data-status="blocked" title="Show blocked scenarios"><span class="label">Blocked</span><span class="value">${counts.blocked}</span></button>
      <button type="button" class="count-chip skip" data-status="skip" title="Show skipped scenarios"><span class="label">Skip</span><span class="value">${counts.skip}</span></button>
    </div>
    <p class="counts-hint">Click Pass / Fail / Blocked / Skip to open the report for that status.</p>
    <div class="run-meta">
      <div><strong>Run</strong> <code>${escapeHtml(runId || summary.runId || summary.id || '—')}</code></div>
      ${status ? `<div><strong>Status</strong> ${escapeHtml(status)}</div>` : ''}
      ${started ? `<div><strong>Started</strong> ${escapeHtml(started)}</div>` : ''}
      ${finished ? `<div><strong>Finished</strong> ${escapeHtml(finished)}</div>` : ''}
      ${counts.total ? `<div><strong>Total</strong> ${counts.total}</div>` : ''}
    </div>
  `;

  els.qaSummary.querySelectorAll('.count-chip[data-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      els.qaSummary.querySelectorAll('.count-chip').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      openStatusDrawer(btn.dataset.status);
    });
  });

  // Prefer bug notes from failed cases if summary has none
  let bugs =
    summary.bugNotes ||
    summary.bug_notes ||
    summary.bugs ||
    [];
  if (!Array.isArray(bugs) || !bugs.length) {
    bugs = state.cases
      .filter((c) => normalizeStatus(c.status) === 'fail' && (c.bug || c.notes))
      .map((c) => ({
        id: c.scenario_id,
        severity: 'fail',
        note: c.bug || c.notes,
      }));
  }
  renderBugs(Array.isArray(bugs) ? bugs : []);
}

function renderBugs(bugs) {
  if (!bugs.length) {
    els.qaBugs.innerHTML = '<p class="empty">No bug notes in the latest summary.</p>';
    return;
  }
  els.qaBugs.innerHTML = bugs
    .map((b) => {
      if (typeof b === 'string') {
        return `<div class="bug-item">${escapeHtml(b)}</div>`;
      }
      const sev = b.severity || b.sev || b.level || '';
      const text = b.note || b.text || b.message || b.title || JSON.stringify(b);
      const caseId = b.caseId || b.case_id || b.id || '';
      return `<div class="bug-item">
        ${sev ? `<div class="bug-sev">${escapeHtml(sev)}</div>` : ''}
        <div>${escapeHtml(text)}</div>
        ${caseId ? `<div class="scenario-meta">case <code>${escapeHtml(caseId)}</code></div>` : ''}
      </div>`;
    })
    .join('');
}

function displayRunTitle(r) {
  if (r?.title) return String(r.title);
  const id = r?.id || r?.runId || '';
  const stripped = String(id).replace(/^\d{8}-\d{4}-/, '');
  const parts = stripped.split(/[-_]+/).filter(Boolean);
  if (!parts.length) return id;
  const head = parts[0].toUpperCase();
  const rest = parts.slice(1).map((p) => p.toUpperCase()).join(' ');
  return rest ? `${head}-${rest}` : head;
}

function renderRuns() {
  if (!state.runs.length) {
    els.qaRuns.innerHTML = '<li class="empty">Waiting for runs…</li>';
    return;
  }
  els.qaRuns.innerHTML = state.runs
    .map((r) => {
      const id = r.id || r.runId;
      const title = displayRunTitle(r);
      const selected = id === state.selectedRunId ? ' is-selected' : '';
      const sub = r.mtime ? new Date(r.mtime).toLocaleString() : '';
      return `<li>
        <button type="button" class="${selected.trim()}" data-run="${escapeHtml(id)}" title="${escapeHtml(id)}">
          <span class="run-id">${escapeHtml(title)}</span>
          ${sub ? `<span class="run-sub">${escapeHtml(sub)}</span>` : ''}
        </button>
      </li>`;
    })
    .join('');

  els.qaRuns.querySelectorAll('button[data-run]').forEach((btn) => {
    btn.addEventListener('click', () => selectRun(btn.dataset.run));
  });
}

function formatBytes(n) {
  const b = Number(n) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function isExcelReport(rel) {
  const lower = String(rel || '').toLowerCase();
  return lower.endsWith('.xlsx') || lower.endsWith('.csv');
}

function renderReports() {
  renderExcelReports();
}

function showExcelToast(msg) {
  if (!els.excelActionToast) return;
  els.excelActionToast.hidden = false;
  els.excelActionToast.textContent = msg;
  clearTimeout(showExcelToast._t);
  showExcelToast._t = setTimeout(() => {
    els.excelActionToast.hidden = true;
  }, 2200);
}

function statusClassFromCell(text, fill) {
  const t = String(text || '').toLowerCase();
  if (t === 'success' || t === 'pass') return 'cell-success';
  if (t === 'failed' || t === 'fail') return 'cell-failed';
  if (t === 'blocked') return 'cell-blocked';
  if (t === 'skip' || t === 'skipped') return 'cell-skip';
  const f = String(fill || '').toUpperCase();
  if (f === 'FF93C47D' || f === '0093C47D') return 'cell-success';
  if (f === 'FFFF0000' || f === '00FF0000') return 'cell-failed';
  if (f === 'FFFFD966' || f === '00FFD966') return 'cell-blocked';
  if (f === 'FFA4C2F4' || f === '00A4C2F4') return 'cell-header';
  return '';
}

function activeExcelSheet() {
  const sheets = state.excel?.sheets || [];
  if (!sheets.length) return null;
  const idx = Math.min(Math.max(0, state.excelSheetIndex), sheets.length - 1);
  return sheets[idx];
}

function excelSheetTsv(sheet) {
  if (!sheet) return '';
  return (sheet.rows || [])
    .map((row) =>
      row
        .map((c) => {
          const v = String(c?.v ?? '');
          if (/[\t\n"]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
          return v;
        })
        .join('\t')
    )
    .join('\n');
}

function renderExcelTable() {
  if (!els.excelTableWrap) return;
  const sheet = activeExcelSheet();
  if (!sheet || !sheet.rows?.length) {
    els.excelTableWrap.innerHTML =
      '<p class="empty">No rows in this sheet.</p>';
    return;
  }
  const [header, ...body] = sheet.rows;
  const thead = `<thead><tr>${header
    .map((c) => `<th class="${statusClassFromCell(c.v, c.fill)}">${escapeHtml(c.v)}</th>`)
    .join('')}</tr></thead>`;
  const tbody = `<tbody>${body
    .map(
      (row) =>
        `<tr>${row
          .map((c) => {
            const cls = statusClassFromCell(c.v, c.fill);
            return `<td class="${cls}">${escapeHtml(c.v)}</td>`;
          })
          .join('')}</tr>`
    )
    .join('')}</tbody>`;
  els.excelTableWrap.innerHTML = `<div class="excel-table-scroll"><table class="excel-table">${thead}${tbody}</table></div>`;
}

function renderExcelSheetTabs() {
  if (!els.excelSheetTabs) return;
  const sheets = state.excel?.sheets || [];
  if (sheets.length <= 1) {
    els.excelSheetTabs.hidden = true;
    els.excelSheetTabs.innerHTML = '';
    return;
  }
  els.excelSheetTabs.hidden = false;
  els.excelSheetTabs.innerHTML = sheets
    .map(
      (s, i) =>
        `<button type="button" class="excel-sheet-tab${i === state.excelSheetIndex ? ' is-active' : ''}" data-sheet-index="${i}">${escapeHtml(s.name)}</button>`
    )
    .join('');
  els.excelSheetTabs.querySelectorAll('[data-sheet-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.excelSheetIndex = Number(btn.dataset.sheetIndex) || 0;
      renderExcelSheetTabs();
      renderExcelTable();
    });
  });
}

function wireExcelActions(downloadHref, name) {
  if (!els.excelBannerActions) return;
  const pageUrl = new URL(window.location.href);
  pageUrl.searchParams.set('tab', 'qa');
  if (state.selectedRunId) pageUrl.searchParams.set('run', state.selectedRunId);
  pageUrl.hash = 'qa';

  els.excelBannerActions.innerHTML = `
    <button type="button" class="excel-action" data-excel-act="copy">Copy</button>
    <button type="button" class="excel-action" data-excel-act="share">Share</button>
    <a class="excel-action excel-action-primary" href="${escapeHtml(downloadHref)}" download="${escapeHtml(name)}">Download</a>
  `;

  els.excelBannerActions.querySelector('[data-excel-act="copy"]')?.addEventListener('click', async () => {
    const tsv = excelSheetTsv(activeExcelSheet());
    try {
      await navigator.clipboard.writeText(tsv || pageUrl.toString());
      showExcelToast(tsv ? 'Sheet copied as table' : 'Link copied');
    } catch {
      showExcelToast('Copy failed');
    }
  });

  els.excelBannerActions.querySelector('[data-excel-act="share"]')?.addEventListener('click', async () => {
    const shareUrl = pageUrl.toString();
    try {
      if (navigator.share) {
        await navigator.share({
          title: name || 'Obecno QA Excel',
          text: `QA Excel report · ${state.selectedRunId || ''}`.trim(),
          url: shareUrl,
        });
        showExcelToast('Shared');
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      showExcelToast('Share link copied');
    } catch (err) {
      if (err?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(shareUrl);
        showExcelToast('Share link copied');
      } catch {
        showExcelToast('Share failed');
      }
    }
  });
}

function renderExcelViewerEmpty(msg) {
  state.excel = null;
  if (els.excelBannerSub) els.excelBannerSub.textContent = msg;
  if (els.excelBannerActions) els.excelBannerActions.innerHTML = '';
  if (els.excelSheetTabs) {
    els.excelSheetTabs.hidden = true;
    els.excelSheetTabs.innerHTML = '';
  }
  if (els.excelTableWrap) {
    els.excelTableWrap.innerHTML = `<p class="empty">${escapeHtml(msg)}</p>`;
  }
}

async function loadExcelPreview(runId) {
  if (!runId) {
    renderExcelViewerEmpty('Select a run to preview its Excel report here.');
    return;
  }
  try {
    const data = await fetchJson(`${EXCEL_API}?run=${encodeURIComponent(runId)}`);
    if (!data || !data.sheets) {
      renderExcelViewerEmpty(
        'No Excel report for this run yet. Generate with node qa/tools/generate-excel-report.mjs <run_id>.'
      );
      return;
    }
    const fp = `${data.rel}|${data.mtime}|${data.size}`;
    if (fp === state.excelFingerprint && state.excel) {
      // still refresh actions in case URL params changed
      wireExcelActions(
        data.downloadHref || `${data.href}?download=1`,
        data.downloadName || data.name || data.fileName || 'report.xlsx'
      );
      return;
    }
    state.excelFingerprint = fp;
    state.excel = data;
    state.excelSheetIndex = Math.max(
      0,
      data.sheets.findIndex((s) => String(s.name).toLowerCase() === 'sheet6')
    );
    if (state.excelSheetIndex < 0) state.excelSheetIndex = 0;

    if (els.excelBannerSub) {
      const when = data.mtime ? new Date(data.mtime).toLocaleString() : '';
      const label = data.excelTitle || data.name || data.fileName || 'Excel report';
      const runLabel = data.title || runId;
      els.excelBannerSub.textContent = `${label} · ${runLabel}${when ? ` · ${when}` : ''}${
        data.size ? ` · ${formatBytes(data.size)}` : ''
      }`;
    }
    const downloadLabel = data.downloadName || data.name || data.fileName || 'report.xlsx';
    wireExcelActions(data.downloadHref || `${data.href}?download=1`, downloadLabel);
    renderExcelSheetTabs();
    renderExcelTable();
  } catch (err) {
    console.warn('excel preview failed', err);
    renderExcelViewerEmpty('Could not load Excel preview for this run.');
  }
}

function renderExcelReports() {
  if (!els.qaExcel) return;
  const runId = state.selectedRunId;
  const excel = state.reports.filter((r) => {
    if (!isExcelReport(r.rel)) return false;
    if (!runId) return true;
    return r.rel === `${runId}/${pathBasename(r.rel)}` || r.rel.startsWith(`${runId}/`);
  });

  if (els.excelMeta) {
    els.excelMeta.innerHTML = runId
      ? `<span class="stat">run <strong>${escapeHtml(runId)}</strong></span>`
      : '';
  }

  if (!excel.length) {
    els.qaExcel.innerHTML =
      '<p class="empty">No Excel file in sidebar yet — preview above updates when generated.</p>';
  } else {
    const runMeta = state.runs.find((r) => r.id === runId);
    const excelTitle =
      runMeta?.excelTitle ||
      (runMeta?.title
        ? `${String(runMeta.title).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()} EXCEL REPORT`
        : null);
    const rowsHtml = excel
      .map((r) => {
        const fileName = pathBasename(r.rel);
        const label = excelTitle || fileName;
        const downloadName = excelTitle
          ? `${excelTitle.replace(/[^\w\s-]+/g, '').replace(/\s+/g, '_')}.xlsx`
          : fileName;
        const href = `../qa/reports/${r.rel.replace(/^\/+/, '')}?download=1`;
        const when = r.mtime ? new Date(r.mtime).toLocaleString() : '';
        return `<div class="excel-row">
          <div class="excel-info">
            <div class="excel-name">${escapeHtml(label)}</div>
            <div class="excel-meta-line">${when ? escapeHtml(when) : ''}${r.size ? `${when ? ' · ' : ''}${escapeHtml(formatBytes(r.size))}` : ''}</div>
          </div>
          <a class="excel-download" href="${escapeHtml(href)}" download="${escapeHtml(downloadName)}">Download</a>
        </div>`;
      })
      .join('');
    els.qaExcel.innerHTML = rowsHtml;
  }

  loadExcelPreview(runId);
}

function pathBasename(rel) {
  const parts = String(rel || '').split('/');
  return parts[parts.length - 1] || rel;
}

async function selectRun(runId) {
  state.selectedRunId = runId;
  renderRuns();
  try {
    const [summary, casesPayload] = await Promise.all([
      fetchJson(`../qa/results/${encodeURIComponent(runId)}/summary.json`),
      fetchJson(`../qa/results/${encodeURIComponent(runId)}/cases.json`),
    ]);
    state.summary = summary;
    state.cases = Array.isArray(casesPayload)
      ? casesPayload
      : Array.isArray(casesPayload?.cases)
        ? casesPayload.cases
        : [];
    renderSummary(summary, runId);
    renderExcelReports();
    // If drawer already open for a status, refresh its contents
    if (state.statusFilter && els.drawer && !els.drawer.hidden) {
      openStatusDrawer(state.statusFilter);
    }
  } catch (err) {
    console.warn('summary/cases fetch failed', err);
    state.summary = null;
    state.cases = [];
    renderSummary(null, runId);
    renderExcelReports();
  }
}

async function loadResults() {
  try {
    const [runsPayload, reportsPayload] = await Promise.all([
      fetchJson(RESULTS_API),
      fetchJson(REPORTS_API),
    ]);
    const runs = (runsPayload && runsPayload.runs) || [];
    const reports = (reportsPayload && reportsPayload.reports) || [];
    const fp = JSON.stringify({
      runs: runs.map((r) => [r.id, r.mtime, r.hasSummary]),
      reports: reports.map((r) => [r.rel, r.mtime]),
    });
    if (fp === state.resultsFingerprint) return false;
    state.resultsFingerprint = fp;
    state.runs = runs;
    state.reports = reports;
    renderRuns();
    renderReports();

    const fromUrl = runIdFromLocation();
    const preferred =
      fromUrl && runs.some((r) => r.id === fromUrl)
        ? fromUrl
        : state.selectedRunId && runs.some((r) => r.id === state.selectedRunId)
          ? state.selectedRunId
          : runs[0]?.id || null;

    if (preferred) await selectRun(preferred);
    else {
      state.selectedRunId = null;
      state.summary = null;
      renderSummary(null);
    }
    return true;
  } catch (err) {
    console.warn('results API failed', err);
    // Fallback: try sample_run / latest via static path only
    if (!state.runs.length) {
      els.qaRuns.innerHTML =
        '<li class="empty">Results API unavailable — server may not be running. Start with <code>node live-guide/server.mjs</code>.</li>';
    }
    return false;
  }
}

async function refreshAll() {
  const a = await loadScenarios();
  const b = await loadResults();
  if (a || b) stampRefresh();
  else if (!els.lastRefresh.textContent || els.lastRefresh.textContent === '—') stampRefresh();
}

/* ---------- Live: SSE preferred, poll fallback ---------- */

function startLive() {
  let es;
  try {
    es = new EventSource(WATCH_SSE);
  } catch (_) {
    es = null;
  }

  if (!es) {
    setLiveStatus('poll', 'polling 2s');
    setInterval(refreshAll, POLL_MS);
    return;
  }

  let opened = false;
  const fallbackTimer = setTimeout(() => {
    if (!opened) {
      try { es.close(); } catch (_) {}
      setLiveStatus('poll', 'polling 2s');
      setInterval(refreshAll, POLL_MS);
    }
  }, 2500);

  es.addEventListener('open', () => {
    opened = true;
    clearTimeout(fallbackTimer);
    setLiveStatus('sse', 'live SSE');
  });

  es.addEventListener('error', () => {
    // Browser will retry EventSource; also poll as safety net
    if (state.liveMode !== 'poll') setLiveStatus('poll', 'SSE retry · poll');
  });

  es.addEventListener('change', () => {
    refreshAll();
  });

  // Always poll lightly so UI stays fresh even if SSE misses a write
  setInterval(refreshAll, POLL_MS);
}

/* ---------- Boot ---------- */

initTabs();
initDrawer();
setLiveStatus('idle', 'connecting…');
refreshAll().then(() => {
  startLive();
});
