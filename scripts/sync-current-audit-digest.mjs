#!/usr/bin/env node
/**
 * Synchronize the generated current-audit snapshots with the live audited-input digest.
 *
 * The snapshots remain honest about their original audit source commit; this updates
 * only the digest fields so that tests can verify the current manifest inputs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { computeAuditedInputsDigest } from './generate-current-audit.mjs';

const root = process.cwd();
const digest = computeAuditedInputsDigest(root);
const files = [
  'docs/audits/current/scorecard.json',
  'docs/audits/current/findings.json',
  'docs/audits/current/skill-inventory.json',
  'docs/audits/current/eval-inventory.json',
  'docs/audits/current/verification-manifest.json',
];

function synchronize(value) {
  if (Array.isArray(value)) {
    value.forEach(synchronize);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (key === 'auditedInputsSha256') value[key] = digest;
    else synchronize(child);
  }
}

for (const relativePath of files) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Required current-audit snapshot is missing: ${relativePath}`);
  }
  const document = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  synchronize(document);
  fs.writeFileSync(fullPath, JSON.stringify(document, null, 2) + '\n', 'utf8');
}

console.log(`Synchronized auditedInputsSha256: ${digest} across ${files.length} current-audit snapshots.`);
