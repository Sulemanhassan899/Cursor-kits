#!/usr/bin/env node
/**
 * Tiny static + watch server for Obecno Live Guide.
 *
 * Serves /Users/hassan/Documents/obecno-archify/ as document root so relative
 * paths to architecture-* folders and qa/ resolve.
 *
 * Run:  node live-guide/server.mjs
 * Open: http://127.0.0.1:8765/live-guide/
 */

import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { watch } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.ARCHIFY_ROOT
  ? path.resolve(process.env.ARCHIFY_ROOT)
  : path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8765);
const DEFAULT_PATH = '/live-guide/';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.csv': 'text/csv; charset=utf-8',
};

const sseClients = new Set();

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function json(res, status, obj) {
  send(res, status, JSON.stringify(obj, null, 2), {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
}

function safeResolve(urlPath) {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const abs = path.resolve(ROOT, '.' + (cleaned.startsWith('/') ? cleaned : `/${cleaned}`));
  if (!abs.startsWith(ROOT)) return null;
  return abs;
}

async function fileExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function serveStatic(req, res, urlPath) {
  let abs = safeResolve(urlPath);
  if (!abs) return send(res, 403, 'Forbidden');

  let stat;
  try {
    stat = await fsp.stat(abs);
  } catch {
    return send(res, 404, 'Not found');
  }

  if (stat.isDirectory()) {
    const index = path.join(abs, 'index.html');
    if (await fileExists(index)) {
      abs = index;
    } else {
      return send(res, 404, 'Not found');
    }
  }

  const ext = path.extname(abs).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const data = await fsp.readFile(abs);
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  const forceDownload = url.searchParams.get('download') === '1' || url.searchParams.get('dl') === '1';
  const headers = {
    'Content-Type': type,
    'Cache-Control': 'no-store',
  };
  if (forceDownload || ext === '.xlsx' || ext === '.csv') {
    const name = path.basename(abs);
    headers['Content-Disposition'] = `attachment; filename="${name.replace(/"/g, '')}"`;
  }
  send(res, 200, data, headers);
}

async function loadExcelPreview(runId) {
  const reportsDir = path.join(ROOT, 'qa', 'reports', runId);
  if (!(await fileExists(reportsDir))) return null;

  const entries = await fsp.readdir(reportsDir);
  const xlsxName =
    entries.find((n) => n.toLowerCase().endsWith('.xlsx') && !n.startsWith('~$')) ||
    null;
  if (!xlsxName) return null;

  const abs = path.join(reportsDir, xlsxName);
  let ExcelJS;
  try {
    const exceljsEntry = path.join(
      ROOT,
      'qa',
      'tools',
      'node_modules',
      'exceljs',
      'excel.js'
    );
    ExcelJS = (await import(pathToFileURL(exceljsEntry).href)).default;
  } catch (err) {
    console.warn('[excel] exceljs unavailable', err.message);
    return null;
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(abs);
  const st = await fsp.stat(abs);
  const sheets = wb.worksheets.map((ws) => {
    const rows = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const cells = [];
      const max = Math.max(ws.columnCount || 0, row.cellCount || 0);
      for (let i = 1; i <= max; i++) {
        const cell = row.getCell(i);
        let value = cell.value;
        if (value && typeof value === 'object') {
          if (value.text != null) value = value.text;
          else if (value.result != null) value = value.result;
          else if (value.richText) value = value.richText.map((t) => t.text).join('');
          else value = String(value);
        }
        if (value == null) value = '';
        const fill = cell.fill?.fgColor?.argb || '';
        cells.push({ v: String(value), fill });
      }
      // trim trailing empties
      while (cells.length && cells[cells.length - 1].v === '' && !cells[cells.length - 1].fill) {
        cells.pop();
      }
      if (cells.length) rows.push(cells);
    });
    return { name: ws.name, rows };
  });

  let title = titleFromRunId(runId);
  let excelTitle = excelTitleFromRunTitle(title, runId);
  const summaryPath = path.join(ROOT, 'qa', 'results', runId, 'summary.json');
  if (await fileExists(summaryPath)) {
    try {
      const summary = JSON.parse(await fsp.readFile(summaryPath, 'utf8'));
      if (summary.title) title = String(summary.title);
      if (summary.excel_title) excelTitle = String(summary.excel_title);
      else excelTitle = excelTitleFromRunTitle(title, runId);
    } catch { /* ignore */ }
  }

  const downloadName = `${excelTitle.replace(/[^\w\s-]+/g, '').replace(/\s+/g, '_')}.xlsx`;

  return {
    runId,
    title,
    excelTitle,
    name: excelTitle,
    fileName: xlsxName,
    downloadName,
    rel: `${runId}/${xlsxName}`,
    href: `/qa/reports/${encodeURIComponent(runId)}/${encodeURIComponent(xlsxName)}`,
    downloadHref: `/qa/reports/${encodeURIComponent(runId)}/${encodeURIComponent(xlsxName)}?download=1`,
    mtime: st.mtimeMs,
    size: st.size,
    sheets,
  };
}

function titleFromRunId(runId) {
  const raw = String(runId || '').trim();
  if (!raw || raw === 'sample_run') return raw;
  const stripped = raw.replace(/^\d{8}-\d{4}-/, '');
  const parts = stripped.split(/[-_]+/).filter(Boolean);
  if (!parts.length) return raw.toUpperCase();
  // e.g. debug-clock_screen → DEBUG-CLOCK SCREEN
  const head = parts[0].toUpperCase();
  const rest = parts.slice(1).map((p) => p.toUpperCase()).join(' ');
  return rest ? `${head}-${rest}` : head;
}

function excelTitleFromRunTitle(title, runId) {
  const base = String(title || titleFromRunId(runId) || runId)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  if (!base) return 'EXCEL REPORT';
  if (/EXCEL REPORT$/i.test(base)) return base;
  return `${base} EXCEL REPORT`;
}

async function listRuns() {
  const resultsDir = path.join(ROOT, 'qa', 'results');
  const runs = [];
  if (!(await fileExists(resultsDir))) return runs;

  const entries = await fsp.readdir(resultsDir, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    if (ent.name.startsWith('.')) continue;
    // Hide demo/sample scaffolding runs from the UI
    if (ent.name === 'sample_run' || ent.name.startsWith('sample_')) continue;
    const dir = path.join(resultsDir, ent.name);
    const summaryPath = path.join(dir, 'summary.json');
    let mtime = 0;
    let hasSummary = false;
    let title = titleFromRunId(ent.name);
    let excelTitle = excelTitleFromRunTitle(title, ent.name);
    try {
      const st = await fsp.stat(dir);
      mtime = st.mtimeMs;
    } catch { /* ignore */ }
    if (await fileExists(summaryPath)) {
      hasSummary = true;
      try {
        const st = await fsp.stat(summaryPath);
        mtime = Math.max(mtime, st.mtimeMs);
      } catch { /* ignore */ }
      try {
        const summary = JSON.parse(await fsp.readFile(summaryPath, 'utf8'));
        if (summary.title) title = String(summary.title);
        if (summary.excel_title) excelTitle = String(summary.excel_title);
        else excelTitle = excelTitleFromRunTitle(title, ent.name);
      } catch { /* ignore */ }
    }
    runs.push({ id: ent.name, title, excelTitle, hasSummary, mtime });
  }
  runs.sort((a, b) => b.mtime - a.mtime);
  return runs;
}

async function walkFiles(dir, base = dir, acc = []) {
  if (!(await fileExists(dir))) return acc;
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name.startsWith('.')) continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walkFiles(abs, base, acc);
    } else {
      const st = await fsp.stat(abs);
      acc.push({
        rel: path.relative(base, abs).split(path.sep).join('/'),
        mtime: st.mtimeMs,
        size: st.size,
      });
    }
  }
  return acc;
}

async function listReports() {
  const reportsDir = path.join(ROOT, 'qa', 'reports');
  const files = await walkFiles(reportsDir);
  files.sort((a, b) => b.mtime - a.mtime);
  return files;
}

function broadcastChange(payload) {
  const data = `event: change\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(data);
    } catch {
      sseClients.delete(res);
    }
  }
}

function watchDir(label, dir) {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      console.warn(`[watch] cannot create ${dir}`);
      return;
    }
  }
  try {
    const w = watch(dir, { recursive: true }, (eventType, filename) => {
      broadcastChange({
        at: new Date().toISOString(),
        scope: label,
        eventType,
        filename: filename || null,
      });
    });
    w.on('error', (err) => console.warn(`[watch] ${label}`, err.message));
    console.log(`[watch] ${label} → ${dir}`);
  } catch (err) {
    console.warn(`[watch] failed ${label}:`, err.message);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    let pathname = url.pathname;

    if (pathname === '/') {
      res.writeHead(302, { Location: DEFAULT_PATH });
      return res.end();
    }

    if (pathname === '/api/watch') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(`event: hello\ndata: ${JSON.stringify({ ok: true, root: ROOT })}\n\n`);
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      const ping = setInterval(() => {
        try {
          res.write(`: ping ${Date.now()}\n\n`);
        } catch {
          clearInterval(ping);
        }
      }, 15000);
      req.on('close', () => clearInterval(ping));
      return;
    }

    if (pathname === '/api/qa/runs') {
      const runs = await listRuns();
      return json(res, 200, { runs, root: 'qa/results' });
    }

    if (pathname === '/api/qa/reports') {
      const reports = await listReports();
      return json(res, 200, { reports, root: 'qa/reports' });
    }

    if (pathname === '/api/qa/excel') {
      const runId = String(url.searchParams.get('run') || '').trim();
      if (!runId || runId.includes('..') || runId.includes('/') || runId.includes('\\')) {
        return json(res, 400, { error: 'Invalid run id' });
      }
      const payload = await loadExcelPreview(runId);
      if (!payload) {
        return json(res, 404, { error: 'No Excel workbook for this run' });
      }
      return json(res, 200, payload);
    }

    return await serveStatic(req, res, pathname);
  } catch (err) {
    console.error(err);
    send(res, 500, 'Internal Server Error');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('Obecno Live Guide');
  console.log(`  root   ${ROOT}`);
  console.log(`  open   http://127.0.0.1:${PORT}${DEFAULT_PATH}`);
  console.log(`  watch  /api/watch (SSE)`);
  console.log(`  run    node live-guide/server.mjs`);
  console.log('');

  watchDir('qa/catalog', path.join(ROOT, 'qa', 'catalog'));
  watchDir('qa/results', path.join(ROOT, 'qa', 'results'));
  watchDir('qa/reports', path.join(ROOT, 'qa', 'reports'));
  watchDir(
    'architecture/enhanced',
    path.join(ROOT, 'architecture-obecno-api-guide-20261006-222000', 'enhanced')
  );
});
