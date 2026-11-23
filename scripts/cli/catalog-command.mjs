import path from 'node:path';
import { searchCatalog, resolveCatalogRecord, validateKnowledgeAndRecipeCatalogs, runCatalogRetrievalEvals } from '../build-knowledge-catalog.mjs';
import { DEFAULT_REPO_ROOT } from './constants.mjs';
import { formatInstallerHelp } from './report.mjs';

export const CATALOG_SUBCOMMANDS = new Set([
  'catalog-search',
  '--catalog-search',
  'catalog-resolve',
  '--catalog-resolve',
  'catalog-validate',
  '--catalog-validate',
  'catalog-eval',
  '--catalog-eval',
]);

export const PLAN_SUBCOMMANDS = new Set([
  'scene-spec-validate',
  '--scene-spec-validate',
  'plan-compile',
  '--plan-compile',
  'plan-inspect',
  '--plan-inspect',
]);

export function runCatalogCliSubcommand(argv = [], options = {}) {
  const repoRoot = path.resolve(options.repoRoot || DEFAULT_REPO_ROOT);
  const rawSub = String(argv[0] || '').replace(/^--/, '');
  const rest = argv.slice(1);

  if (rest.includes('--help') || rest.includes('-h')) {
    return {
      ok: true,
      mode: 'help',
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      report: formatInstallerHelp(),
    };
  }

  if (rawSub === 'catalog-search') {
    let query = '';
    let projectDir = null;
    let type = 'all';
    let domain = null;
    let kind = null;
    let skillId = null;
    let blenderVersion = null;
    let evidenceStatus = null;
    let limit = 10;
    let jsonOutput = false;
    const positional = [];

    for (let i = 0; i < rest.length; i += 1) {
      const arg = rest[i];
      if (arg === '--json') {
        jsonOutput = true;
      } else if (arg === '--project' && i + 1 < rest.length) {
        projectDir = rest[++i];
      } else if (typeof arg === 'string' && arg.startsWith('--project=')) {
        projectDir = arg.slice('--project='.length).trim();
      } else if (arg === '--type' && i + 1 < rest.length) {
        type = rest[++i];
      } else if (arg === '--domain' && i + 1 < rest.length) {
        domain = rest[++i];
      } else if (arg === '--kind' && i + 1 < rest.length) {
        kind = rest[++i];
      } else if (arg === '--skill' && i + 1 < rest.length) {
        skillId = rest[++i];
      } else if (arg === '--blender-version' && i + 1 < rest.length) {
        blenderVersion = rest[++i];
      } else if (arg === '--evidence-status' && i + 1 < rest.length) {
        evidenceStatus = rest[++i];
      } else if (arg === '--limit' && i + 1 < rest.length) {
        limit = Number(rest[++i]) || 10;
      } else if (arg === '--query' && i + 1 < rest.length) {
        query = rest[++i];
      } else if (!arg.startsWith('-')) {
        positional.push(arg);
      } else {
        throw new Error(`Unknown or malformed catalog-search argument: ${String(arg)}`);
      }
    }

    if (!query && positional.length > 0) {
      query = positional.join(' ');
    }

    const effectiveRoot = projectDir ? path.resolve(projectDir) : repoRoot;
    const searchResult = searchCatalog(effectiveRoot, query, {
      type,
      domain,
      kind,
      skill_id: skillId,
      blender_version: blenderVersion,
      evidence_status: evidenceStatus,
      limit,
    });

    const report = jsonOutput
      ? `${JSON.stringify(searchResult, null, 2)}\n`
      : [
          '## BlendOps Knowledge & Recipe Catalog Search',
          '',
          `- Query: ${searchResult.query || '(empty)'}`,
          `- Coverage Gap: ${searchResult.coverage_gap ? 'Yes (no high-confidence catalog match)' : 'No'}`,
          `- Total Matches: ${searchResult.total_matches}`,
          ...(searchResult.coverage_gap && searchResult.coverage_gap_reason
            ? [`- Coverage Gap Note: ${searchResult.coverage_gap_reason}`]
            : []),
          '',
          ...searchResult.results.map(
            (r, idx) =>
              `${idx + 1}. \`${r.id}\` (${r.type}, domain: \`${r.domain}\`, score: ${r.score}, min Blender: \`${r.minimum_blender}\`, evidence: \`${r.evidence_status}\`) — ${r.title}`,
          ),
          '',
          '- Global files touched: No',
          '- Runtime status: Not Run',
          '- Artifact status: Not Produced',
          '',
        ].join('\n');

    return {
      ok: true,
      mode: 'catalog-search',
      searchResult,
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      report,
    };
  }

  if (rawSub === 'catalog-resolve') {
    let recordId = null;
    let projectDir = null;
    let jsonOutput = false;

    for (let i = 0; i < rest.length; i += 1) {
      const arg = rest[i];
      if (arg === '--json') {
        jsonOutput = true;
      } else if (arg === '--project' && i + 1 < rest.length) {
        projectDir = rest[++i];
      } else if (typeof arg === 'string' && arg.startsWith('--project=')) {
        projectDir = arg.slice('--project='.length).trim();
      } else if (arg === '--id' && i + 1 < rest.length) {
        recordId = rest[++i];
      } else if (!arg.startsWith('-') && !recordId) {
        recordId = arg;
      } else {
        throw new Error(`Unknown or malformed catalog-resolve argument: ${String(arg)}`);
      }
    }

    if (!recordId || typeof recordId !== 'string' || recordId.trim().length === 0) {
      throw new Error('catalog-resolve requires a <knowledge.*|recipe.*|source.*|skill-id> identifier.');
    }

    const effectiveRoot = projectDir ? path.resolve(projectDir) : repoRoot;
    const resolved = resolveCatalogRecord(effectiveRoot, recordId.trim());
    if (!resolved.found) {
      if (jsonOutput) {
        return {
          ok: false,
          mode: 'catalog-resolve',
          resolved,
          globalTouched: false,
          runtimeStatus: 'Not Run',
          artifactStatus: 'Not Produced',
          report: `${JSON.stringify(resolved, null, 2)}\n`,
        };
      }
      throw new Error(resolved.error || `Catalog record not found: ${recordId}`);
    }

    const report = jsonOutput
      ? `${JSON.stringify(resolved, null, 2)}\n`
      : [
          '## BlendOps Catalog Record Resolution',
          '',
          `- ID: \`${resolved.id || resolved.record.id}\``,
          `- Type: \`${resolved.type}\``,
          `- Title: ${resolved.record.title || resolved.record.name || resolved.id || resolved.record.id}`,
          ...(resolved.record.domain ? [`- Domain: \`${resolved.record.domain}\``] : []),
          ...(resolved.record.summary ? [`- Summary: ${resolved.record.summary}`] : []),
          '- Global files touched: No',
          '- Runtime status: Not Run',
          '- Artifact status: Not Produced',
          '',
        ].join('\n');

    return {
      ok: true,
      mode: 'catalog-resolve',
      resolved,
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      report,
    };
  }

  if (rawSub === 'catalog-validate') {
    let projectDir = null;
    let jsonOutput = false;
    for (let i = 0; i < rest.length; i += 1) {
      const arg = rest[i];
      if (arg === '--json') {
        jsonOutput = true;
      } else if (arg === '--project' && i + 1 < rest.length) {
        projectDir = rest[++i];
      } else if (typeof arg === 'string' && arg.startsWith('--project=')) {
        projectDir = arg.slice('--project='.length).trim();
      } else {
        throw new Error(`Unknown or malformed catalog-validate argument: ${String(arg)}`);
      }
    }
    const effectiveRoot = projectDir ? path.resolve(projectDir) : repoRoot;
    const validation = validateKnowledgeAndRecipeCatalogs(effectiveRoot);
    if (!validation.valid && !jsonOutput) {
      throw new Error(`Catalog validation failed: ${validation.errors.join('; ')}`);
    }
    const report = jsonOutput
      ? `${JSON.stringify(validation, null, 2)}\n`
      : [
          '## BlendOps Knowledge & Recipe Catalog Validation',
          '',
          `- Valid: ${validation.valid ? 'Yes' : 'No'}`,
          `- Sources: ${validation.counts?.sources ?? 0}`,
          `- Knowledge records: ${validation.counts?.knowledge_records ?? 0}`,
          `- Recipes: ${validation.counts?.recipes ?? 0}`,
          `- Domains: ${validation.counts?.domains ?? 0}`,
          `- Canonical skills: ${validation.counts?.skills ?? 0}`,
          '- Global files touched: No',
          '- Runtime status: Not Run',
          '- Artifact status: Not Produced',
          '',
        ].join('\n');

    return {
      ok: validation.valid,
      mode: 'catalog-validate',
      validation,
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      report,
    };
  }

  if (rawSub === 'catalog-eval') {
    const jsonOutput = rest.includes('--json');
    const evalRes = runCatalogRetrievalEvals(repoRoot);
    if (!evalRes.passed && !jsonOutput) {
      throw new Error(`Catalog retrieval evaluation failed: ${evalRes.failures.join('; ')}`);
    }
    const report = jsonOutput
      ? `${JSON.stringify(evalRes, null, 2)}\n`
      : [
          '## BlendOps Knowledge & Recipe Retrieval Evaluation',
          '',
          `- Passed: ${evalRes.passed ? 'Yes' : 'No'} (${evalRes.passed_count}/${evalRes.total})`,
          '- Global files touched: No',
          '- Runtime status: Not Run',
          '- Artifact status: Not Produced',
          '',
        ].join('\n');

    return {
      ok: evalRes.passed,
      mode: 'catalog-eval',
      evalRes,
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      report,
    };
  }

  throw new Error(`Unknown catalog subcommand: ${rawSub}`);
}
