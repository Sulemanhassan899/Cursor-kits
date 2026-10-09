#!/usr/bin/env node
/**
 * Build Excel QA reports matching Google Sheet "Sheet6".
 * Writes under qa/reports/<run_id>/
 *
 * Usage:
 *   node qa/tools/generate-excel-report.mjs [run_id]
 *
 * Columns (Sheet6 wording):
 *   Module name | Screen | Functionality | Online | Offline | Status | Bug Details
 *
 * Status one-word + fill (Employee sheet palette):
 *   success (green) | Failed (red) | Blocked (yellow) | Skip (gray)
 */
import path from 'node:path';
import fsp from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QA_ROOT = path.resolve(__dirname, '..');
const runId = process.argv[2] || 'sample_run';

const casesPath = path.join(QA_ROOT, 'results', runId, 'cases.json');
const summaryPath = path.join(QA_ROOT, 'results', runId, 'summary.json');
const catalogPath = path.join(QA_ROOT, 'catalog', 'scenarios.json');
const outDir = path.join(QA_ROOT, 'reports', runId);

/** Sheet6 header blue */
const HEADER_FILL = 'FFA4C2F4';

/** Status fills from Employee Tests sheet */
const STATUS_STYLE = {
  success: { fill: 'FF93C47D', font: 'FF000000' },
  Failed: { fill: 'FFFF0000', font: 'FFFFFFFF' },
  Blocked: { fill: 'FFFFD966', font: 'FF000000' },
  Skip: { fill: 'FFD9D9D9', font: 'FF000000' },
};

const SHEET6_COLUMNS = [
  { header: 'Module name', key: 'module', width: 18 },
  { header: 'Screen', key: 'screen', width: 16 },
  { header: 'Functionality', key: 'functionality', width: 44 },
  { header: 'Online', key: 'online', width: 10 },
  { header: 'Offline', key: 'offline', width: 10 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Bug Details', key: 'bug', width: 48 },
];

function normStatusWord(s) {
  const v = String(s || '').toLowerCase();
  if (['pass', 'passed', 'success', 'ok'].includes(v)) return 'success';
  if (['fail', 'failed', 'error', 'unsuccessful'].includes(v)) return 'Failed';
  if (v === 'blocked') return 'Blocked';
  if (['skip', 'skipped'].includes(v)) return 'Skip';
  return s || '';
}

function tick(v) {
  return v === true ? '✓' : '';
}

async function loadJson(p, fallback) {
  try {
    return JSON.parse(await fsp.readFile(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function solidFill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function styleSheet6Header(row) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF000000' }, name: 'Arial', size: 11 };
    cell.fill = solidFill(HEADER_FILL);
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
      left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
      bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
      right: { style: 'thin', color: { argb: 'FFB0B0B0' } },
    };
  });
}

function applyStatusColor(cell, status) {
  const style = STATUS_STYLE[status];
  if (!style) return;
  cell.fill = solidFill(style.fill);
  cell.font = { bold: true, color: { argb: style.font }, name: 'Arial', size: 11 };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

function addSheet6(wb, name, rows) {
  const ws = wb.addWorksheet(name, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  // keys/widths only — do not set `header` here or ExcelJS emits a duplicate header row
  ws.columns = SHEET6_COLUMNS.map(({ key, width }) => ({ key, width }));

  const header = ws.addRow(SHEET6_COLUMNS.map((c) => c.header));
  styleSheet6Header(header);

  for (const r of rows) {
    const row = ws.addRow({
      module: r.module ?? '',
      screen: r.screen ?? '',
      functionality: r.functionality ?? '',
      online: r.online ?? '',
      offline: r.offline ?? '',
      status: r.status ?? '',
      bug: r.bug ?? '',
    });
    row.alignment = { vertical: 'top', wrapText: true };
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, color: { argb: 'FF000000' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
    });
    row.getCell('online').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('offline').alignment = { vertical: 'middle', horizontal: 'center' };
    applyStatusColor(row.getCell('status'), r.status);
  }
  return ws;
}

const cases = await loadJson(casesPath, []);
const summary = await loadJson(summaryPath, {});
let catalog = await loadJson(catalogPath, []);
if (!Array.isArray(catalog) && Array.isArray(catalog.scenarios)) {
  catalog = catalog.scenarios;
}
const byId = new Map((Array.isArray(catalog) ? catalog : []).map((s) => [s.id, s]));

const caseRows = (Array.isArray(cases) ? cases : []).map((c) => {
  const cat = byId.get(c.scenario_id) || {};
  return {
    id: c.scenario_id || '',
    role: c.role || cat.role || '',
    module: c.module || cat.module || '',
    screen: c.screen || cat.screen || '',
    functionality: c.functionality || cat.functionality || cat.title || '',
    status: normStatusWord(c.status),
    online: tick(c.online ?? cat.online),
    offline: tick(c.offline ?? cat.offline),
    bug: c.bug || '',
  };
});

const resultById = new Map(caseRows.map((r) => [r.id, r]));
const masterRows = (Array.isArray(catalog) ? catalog : []).map((s) => {
  const r = resultById.get(s.id);
  return {
    module: s.module || '',
    screen: s.screen || '',
    functionality: s.functionality || s.title || '',
    online: tick(s.online !== false),
    offline: tick(s.offline === true),
    status: r ? r.status : '',
    bug: r ? r.bug : '',
  };
});

await fsp.mkdir(outDir, { recursive: true });

const wb = new ExcelJS.Workbook();
wb.creator = 'Obecno QA';
wb.created = new Date();
wb.description = `QA Excel report for run ${runId} (Sheet6 style)`;

addSheet6(wb, 'Sheet6', caseRows.length ? caseRows : masterRows);
addSheet6(wb, 'Sheet6 catalog', masterRows);

const employeeRows = caseRows.filter((r) =>
  ['employee', 'shared'].includes(String(r.role).toLowerCase())
);
const managerRows = caseRows.filter((r) =>
  ['manager', 'shared', 'cross'].includes(String(r.role).toLowerCase())
);

addSheet6(wb, 'Employee', employeeRows);
addSheet6(wb, 'Manager', managerRows);

const summaryWs = wb.addWorksheet('Summary');
summaryWs.columns = [
  { header: 'Field', key: 'k', width: 18 },
  { header: 'Value', key: 'v', width: 60 },
];
const sumHeader = summaryWs.getRow(1);
sumHeader.values = ['Field', 'Value'];
styleSheet6Header(sumHeader);
const totals = summary.totals || summary.counts || {};
const summaryLines = [
  ['Run ID', runId],
  ['Started', summary.started_at || summary.startedAt || ''],
  ['Finished', summary.finished_at || summary.finishedAt || ''],
  ['success', totals.pass ?? ''],
  ['Failed', totals.fail ?? ''],
  ['Blocked', totals.blocked ?? ''],
  ['Skip', totals.skip ?? ''],
  ['Total', totals.total ?? caseRows.length],
  ['APK', summary.apk || ''],
  ['Device', summary.device || ''],
  ['Notes', summary.notes || ''],
];
for (const [k, v] of summaryLines) {
  const row = summaryWs.addRow([k, v]);
  if (STATUS_STYLE[k]) applyStatusColor(row.getCell(1), k);
}

function titleFromRunId(id) {
  const stripped = String(id || '').replace(/^\d{8}-\d{4}-/, '');
  const parts = stripped.split(/[-_]+/).filter(Boolean);
  if (!parts.length) return String(id || 'QA').toUpperCase();
  const head = parts[0].toUpperCase();
  const rest = parts.slice(1).map((p) => p.toUpperCase()).join(' ');
  return rest ? `${head}-${rest}` : head;
}

const runTitle = summary.title || titleFromRunId(runId);
const excelTitle =
  summary.excel_title ||
  `${String(runTitle).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()} EXCEL REPORT`;
const safeFileBase = excelTitle.replace(/[^\w\s-]+/g, '').replace(/\s+/g, '_');

const outFile = path.join(outDir, `${safeFileBase}.xlsx`);
await wb.xlsx.writeFile(outFile);

// Remove older Obecno_QA_* names for this run so the UI picks the friendly file
try {
  for (const name of await fsp.readdir(outDir)) {
    if (!name.toLowerCase().endsWith('.xlsx') && !name.toLowerCase().endsWith('.csv')) continue;
    if (name === `${safeFileBase}.xlsx` || name === `${safeFileBase}.csv`) continue;
    if (name.startsWith('Obecno_QA_') || name.includes(runId)) {
      await fsp.unlink(path.join(outDir, name)).catch(() => {});
    }
  }
} catch { /* ignore */ }

const csvPath = path.join(outDir, `${safeFileBase}.csv`);
const csvHeader = SHEET6_COLUMNS.map((c) => c.header);
const csvLines = [csvHeader.join(',')];
for (const r of caseRows) {
  const cells = [
    r.module,
    r.screen,
    r.functionality,
    r.online,
    r.offline,
    r.status,
    r.bug,
  ].map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`);
  csvLines.push(cells.join(','));
}
await fsp.writeFile(csvPath, csvLines.join('\n'), 'utf8');

console.log(
  JSON.stringify(
    {
      ok: true,
      xlsx: outFile,
      csv: csvPath,
      title: runTitle,
      excel_title: excelTitle,
      cases: caseRows.length,
      catalog: masterRows.length,
      columns: csvHeader,
    },
    null,
    2
  )
);
