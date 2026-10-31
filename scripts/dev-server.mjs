#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 3000);
const auditDir = path.join(root, 'docs', 'audits', 'phase-0');

function loadJson(filename) {
  const full = path.join(auditDir, filename);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function renderHtml() {
  const skillInv = loadJson('skill-inventory.json');
  const handoffInv = loadJson('handoff-inventory.json');
  const evalInv = loadJson('eval-inventory.json');
  const scorecard = loadJson('baseline-scorecard.json');

  const skills = skillInv ? skillInv.skills : [];
  const pillars = scorecard ? scorecard.pillars : [];

  return `<!doctype html>
<html lang="en">
<head><script>
(function () {
  try {
    var nativeFetch = window.fetch ? window.fetch.bind(window) : undefined;
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get: function () { return nativeFetch; },
      set: function (v) { nativeFetch = v; }
    });
    Object.defineProperty(Window.prototype, 'fetch', {
      configurable: true,
      enumerable: true,
      get: function () { return nativeFetch; },
      set: function (v) { nativeFetch = v; }
    });
  } catch (_) {}
  window.addEventListener('error', function (e) {
    if (e && e.filename && String(e.filename).indexOf('chrome-extension://') === 0) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return true;
    }
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var stack = e && e.reason && e.reason.stack ? String(e.reason.stack) : '';
    if (stack.indexOf('chrome-extension://') !== -1) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return true;
    }
  }, true);
})();
</script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BlendOps — Phase 0 Audit Read-Only Inspector</title>
  <style>
    :root {
      --bg: #0b0d12;
      --surface: #12161f;
      --surface-2: #181d29;
      --border: #252c3d;
      --text: #e6edf3;
      --muted: #8b949e;
      --accent: #f97316;
      --green: #22c55e;
      --amber: #f59e0b;
      --red: #ef4444;
      --blue: #38bdf8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    header {
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      padding: 18px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .badge {
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--accent);
    }
    main { max-width: 1400px; margin: 0 auto; padding: 24px 28px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 18px;
    }
    .kpi-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-val { font-size: 26px; font-weight: 700; font-family: ui-monospace, monospace; margin-top: 4px; }
    .kpi-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
    h2 { font-size: 16px; margin: 28px 0 12px; color: var(--text); }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      font-size: 13px;
      margin-bottom: 24px;
    }
    th, td {
      text-align: left;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    th {
      background: var(--surface-2);
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .tag {
      display: inline-block;
      font-size: 11px;
      font-family: ui-monospace, monospace;
      padding: 2px 6px;
      margin: 2px 4px 2px 0;
      border-radius: 4px;
      background: var(--surface-2);
      border: 1px solid var(--border);
    }
    .tag-keep { color: var(--green); border-color: rgba(34,197,94,0.35); }
    .tag-improve { color: var(--amber); border-color: rgba(245,158,11,0.35); }
    .tag-bug { color: var(--red); border-color: rgba(239,68,68,0.35); }
    input[type="search"] {
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 14px;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <header>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <strong style="font-size:18px;">BlendOps — Phase 0 &amp; Phase 1 Inspector</strong>
      <span class="badge">base: 3ea3c35</span>
      <span class="badge" style="color:var(--blue)">phase-0: 27cfcb8</span>
      <span class="badge" style="color:var(--green)">phase-1: f9d1043 (CI PASS)</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <a href="/download/phase0-and-phase1.patch" download="phase0-and-phase1.patch" style="text-decoration:none;background:var(--accent);color:#000;font-weight:600;font-size:12px;padding:6px 12px;border-radius:6px;">Download Phase 0 + 1 Patch (.patch)</a>
      <a href="/download/phase1-only.patch" download="phase1-only.patch" style="text-decoration:none;background:var(--surface-2);color:var(--text);border:1px solid var(--border);font-weight:600;font-size:12px;padding:6px 12px;border-radius:6px;">Download Phase 1 Only (.patch)</a>
    </div>
  </header>
  <main>
    <div class="kpi-grid">
      <div class="card">
        <div class="kpi-label">Provisional Baseline Score</div>
        <div class="kpi-val" style="color:var(--amber)">${scorecard ? scorecard.totals.measuredScore : 54.5} / 100</div>
        <div class="kpi-sub">3 active P0 zero-compensation blockers</div>
      </div>
      <div class="card">
        <div class="kpi-label">Skills Audited</div>
        <div class="kpi-val">${skills.length}</div>
        <div class="kpi-sub">3 KEEP &middot; 45 IMPROVE &middot; 151 references</div>
      </div>
      <div class="card">
        <div class="kpi-label">Cross-Skill Edges</div>
        <div class="kpi-val" style="color:var(--blue)">${handoffInv ? handoffInv.summary.totalEdges : 373}</div>
        <div class="kpi-sub">211 progression (0 cycles) &middot; 8 retry</div>
      </div>
      <div class="card">
        <div class="kpi-label">Structured Eval Cases</div>
        <div class="kpi-val" style="color:var(--red)">${evalInv ? evalInv.summary.structuredMultiCaseTableCount : 8} / 48</div>
        <div class="kpi-sub">${evalInv ? evalInv.summary.totalStructuredEvalTableRows : 52} table rows &middot; 40 prose-only</div>
      </div>
    </div>

    <h2>9-Pillar Provisional Baseline Scorecard (docs/audits/phase-0/baseline-scorecard.json)</h2>
    <table>
      <thead>
        <tr>
          <th>Pillar</th>
          <th>Measured / Weight</th>
          <th>Verdict</th>
          <th>Key Findings</th>
        </tr>
      </thead>
      <tbody>
        ${pillars
          .map(
            (p) => `<tr>
          <td style="font-weight:600">${p.name}</td>
          <td class="mono">${p.measuredScore} / ${p.weight}</td>
          <td><span class="tag ${p.verdict === 'Pass' ? 'tag-keep' : p.verdict === 'Fail' ? 'tag-bug' : 'tag-improve'}">${p.verdict}</span></td>
          <td>${p.criteria.map((c) => `<div style="margin-bottom:4px;"><span class="mono">[${c.awardedPoints}/${c.maxPoints}]</span> ${c.evidence}</div>`).join('')}</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>

    <h2>48 Skills Audit Inventory (docs/audits/phase-0/skill-inventory.json)</h2>
    <input type="search" placeholder="Filter 48 skills by ID, category, role, or defect flag..." oninput="filterSkills(this.value)" />
    <table id="skills-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Skill ID</th>
          <th>Category &amp; Role</th>
          <th>Disposition</th>
          <th>Headings / Refs</th>
          <th>Graph Degree (In/Out)</th>
          <th>Audit Flags</th>
        </tr>
      </thead>
      <tbody>
        ${skills
          .map(
            (s, idx) => `<tr data-search="${(s.id + ' ' + s.category + ' ' + s.canonicalRole + ' ' + s.issues.join(' ')).toLowerCase()}">
          <td class="mono" style="color:var(--muted)">${idx + 1}</td>
          <td class="mono" style="font-weight:600;color:var(--accent)">${s.id}</td>
          <td>
            <div>${s.category}</div>
            <div class="mono" style="font-size:11px;color:var(--muted)">${s.canonicalRole}</div>
          </td>
          <td><span class="tag ${s.auditDisposition === 'KEEP' ? 'tag-keep' : 'tag-improve'}">${s.auditDisposition}</span></td>
          <td class="mono">${s.headingCount} sec &middot; ${s.referenceCount} refs</td>
          <td class="mono">IN: ${s.graphDegree.incomingForward} / OUT: ${s.graphDegree.outgoingForward}</td>
          <td>${
            s.issues.length === 0
              ? '<span class="tag tag-keep">clean</span>'
              : s.issues.map((iss) => `<span class="tag tag-bug">${iss}</span>`).join('')
          }</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </main>
  <script>
    function filterSkills(q) {
      const term = q.trim().toLowerCase();
      document.querySelectorAll('#skills-table tbody tr').forEach(tr => {
        tr.style.display = !term || tr.dataset.search.includes(term) ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
}

import { execFileSync } from 'node:child_process';

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${port}`);
  if (url.pathname === '/download/phase0-and-phase1.patch') {
    const patch = execFileSync('git', ['format-patch', 'origin/main..HEAD', '--stdout'], { cwd: root });
    res.writeHead(200, {
      'Content-Type': 'text/x-patch; charset=utf-8',
      'Content-Disposition': 'attachment; filename="phase0-and-phase1.patch"',
    });
    res.end(patch);
    return;
  }
  if (url.pathname === '/download/phase1-only.patch') {
    const patch = execFileSync('git', ['format-patch', '-1', 'HEAD', '--stdout'], { cwd: root });
    res.writeHead(200, {
      'Content-Type': 'text/x-patch; charset=utf-8',
      'Content-Disposition': 'attachment; filename="phase1-only.patch"',
    });
    res.end(patch);
    return;
  }
  if (url.pathname === '/api/phase-0') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify(
        {
          skillInventory: loadJson('skill-inventory.json'),
          handoffInventory: loadJson('handoff-inventory.json'),
          evalInventory: loadJson('eval-inventory.json'),
          baselineScorecard: loadJson('baseline-scorecard.json'),
        },
        null,
        2,
      ),
    );
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(renderHtml());
});

server.listen(port, '0.0.0.0', () => {
  console.log(`BlendOps Phase 0 Inspector listening on http://0.0.0.0:${port}`);
});
