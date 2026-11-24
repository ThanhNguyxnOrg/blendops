// Part of the runtime orchestrator; scripts/runtime-orchestrator.mjs re-exports the public API.

import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const DEFAULT_REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
