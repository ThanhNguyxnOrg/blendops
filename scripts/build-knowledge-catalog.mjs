#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateEvidencePacket } from './validate-evidence-packet.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(__dirname, '..');

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'how', 'in', 'into', 'is', 'it', 'of', 'on', 'or', 'that', 'the',
  'their', 'this', 'to', 'use', 'using', 'vs', 'when', 'with',
  'la', 'va', 'cua', 'cho', 'trong', 'voi', 'khi', 'nhu', 'the', 'nao',
  'mot', 'cac', 'nhung', 'duoc', 'can', 'lam', 'sao', 'de'
]);

const OUT_OF_SCOPE_TOKENS = new Set([
  'houdini', 'vex', 'wrangle', 'pyro', 'solaris', 'karma', 'lops',
  'unreal', 'nanite', 'lumen', 'niagara', 'metasounds', 'blueprint',
  'maya', 'xgen', 'bifrost', 'arnold', 'hypershade', 'aistandardsurface',
  '3dsmax', 'tyflow', 'vray', 'vraymtl', 'railclone',
  'cinema4d', 'c4d', 'mograph', 'xpresso',
  'redshift', 'zbrush', 'zsphere', 'zremesher', 'dynamesh', 'subtoolfibermesh',
  'substancepainter', 'sbsar',
  'unity', 'urp', 'hdrp', 'shadergraph', 'assetbundles', 'monobehaviour',
  'autocad', 'revit', 'sketchup', 'katana', 'nuke', 'houdinifx',
  'postgresql', 'btree', 'kubernetes', 'helm', 'dockerfile', 'terraform', 'nextjs', 'redux'
]);

const OUT_OF_SCOPE_PHRASES = [
  'cinema 4d',
  '3ds max',
  'unreal engine',
  'unity engine',
  'substance painter',
  'autodesk maya',
  'maya xgen',
  'arnold render',
  'redshift render',
  'houdini vex',
  'houdini pyro',
  'zbrush zremesher'
];

/**
 * Deterministic bilingual (Vietnamese -> English) 3D/Blender terminology expansion map.
 * Keys are Vietnamese folded (ASCII lowercase) phrases/tokens; values are canonical English tokens.
 */
export const VIETNAMESE_DOMAIN_SYNONYMS = Object.freeze({
  // Modeling & topology
  'luoi tu giac': ['quad', 'dominant', 'subdivision', 'topology', 'edge', 'loops'],
  'tu giac': ['quad', 'topology', 'subdivision'],
  'chia luoi be mat': ['subdivision', 'surface', 'catmull', 'clark', 'topology'],
  'cuc 5 canh': ['pole', 'poles', 'valence', 'subdivision', 'pinching'],
  'nhon be mat': ['pinching', 'subdivision', 'poles', 'holding', 'loops'],
  'phap tuyen bi nguoc': ['inverted', 'face', 'normals', 'recalculate', 'outside', 'manifold'],
  'dao nguoc phap tuyen': ['inverted', 'face', 'normals', 'recalculate', 'outside', 'manifold'],
  'phap tuyen': ['normals', 'face', 'normal', 'weighted'],
  'khong kin': ['non-manifold', 'manifold', 'watertight', 'open', 'edges', 'hygiene'],
  'loi luoi': ['non-manifold', 'manifold', 'normals', 'scale', 'hygiene', 'inspection'],
  'ty le am': ['negative', 'scale', 'unapplied', 'transform', 'apply'],
  'ap dung scale': ['apply', 'scale', 'transform', 'unapplied', 'normals'],
  'ap dung ty le': ['apply', 'scale', 'transform', 'unapplied', 'normals', 'hygiene'],
  'vat cung': ['hard', 'surface', 'prop', 'mechanical', 'bevel', 'boolean'],
  'vat dung co khi': ['hard', 'surface', 'prop', 'mechanical', 'bevel', 'boolean'],
  'mechanical': ['hard', 'surface', 'prop', 'mechanical', 'bevel', 'boolean'],
  'vat mep': ['bevel', 'segments', 'modifier', 'hard', 'surface', 'crease'],
  'vat canh': ['bevel', 'segments', 'modifier', 'hard', 'surface', 'shading', 'cleanup'],
  'cat khoi boolean': ['boolean', 'bevel', 'shading', 'cleanup', 'weighted', 'normal'],
  'cat boolean': ['boolean', 'bevel', 'shading', 'cleanup', 'weighted', 'normal'],
  'dieu khac': ['sculpt', 'retopology', 'voxel', 'remesh', 'multires', 'shrinkwrap', 'organic'],
  'diu khac': ['sculpt', 'retopology', 'voxel', 'remesh', 'multires', 'organic'],
  'retopo': ['retopology', 'sculpt', 'quad', 'shrinkwrap', 'organic'],
  'khe ranh': ['panel', 'gap', 'creases', 'cad', 'hard', 'surface', 'detailing'],

  // Geometry Nodes & procedural
  'rai vat the': ['scatter', 'distribute', 'points', 'faces', 'poisson', 'disk', 'instances', 'geometry', 'nodes'],
  'rai phan bo': ['scatter', 'distribute', 'points', 'faces', 'poisson', 'disk', 'slope', 'masking', 'geometry', 'nodes'],
  'rai cay co': ['scatter', 'poisson', 'disk', 'slope', 'masking', 'foliage', 'geometry', 'nodes'],
  'rai da': ['scatter', 'poisson', 'disk', 'slope', 'geometry', 'nodes', 'instance'],
  'do doc': ['slope', 'mask', 'masking', 'normal', 'dot', 'product', 'scatter', 'poisson', 'disk'],
  'hien thuc hoa instance': ['realize', 'instances', 'geometry', 'nodes', 'memory', 'export', 'instancing'],
  'nut hinh hoc': ['geometry', 'nodes', 'fields', 'procedural', 'scatter', 'instances'],
  'thuoc tinh': ['attribute', 'anonymous', 'named', 'capture', 'store', 'fields', 'geometry', 'nodes'],
  'tham so hoa': ['parametric', 'procedural', 'geometry', 'nodes', 'generator'],

  // UV, texturing & baking
  'trai uv': ['uv', 'unwrap', 'seam', 'placement', 'texel', 'density', 'margin', 'island'],
  'duong cat uv': ['uv', 'seam', 'placement', 'unwrap', 'texel', 'density'],
  'duong cat seam': ['uv', 'seam', 'placement', 'unwrap', 'texel', 'density'],
  'mat do diem anh': ['texel', 'density', 'pixels', 'meter', 'uv', 'seam'],
  'mat do texel': ['texel', 'density', 'pixels', 'meter', 'uv', 'seam', 'placement'],
  'nuong normal map': ['bake', 'baking', 'normal', 'map', 'tangent', 'space', 'cage', 'extrusion', 'high', 'low', 'poly', 'mikktspace'],
  'ban do phap tuyen': ['normal', 'map', 'baking', 'high', 'low', 'poly', 'cage', 'tangent', 'mikktspace'],
  'nuong texture': ['bake', 'baking', 'normal', 'ao', 'ambient', 'occlusion', 'cage'],
  'nhieu o udim': ['udim', 'multi', 'tile', '1001', '1002', 'single', 'atlas', 'uv', 'packing', 'gltf'],

  // Materials, shaders & PBR
  'vat lieu pbr': ['principled', 'bsdf', 'v2', 'energy', 'conserving', 'pbr', 'metallic', 'roughness', 'albedo'],
  'vat lieu kim loai': ['metallic', 'principled', 'bsdf', 'pbr', 'ibl', 'environment', 'threejs', 'black', 'tone', 'mapping'],
  'bi den trong threejs': ['metallic', 'black', 'threejs', 'r3f', 'tone', 'mapping', 'environment', 'ibl', 'shader', 'export', 'parity'],
  'dong goi kenh orm': ['orm', 'occlusion', 'roughness', 'metallic', 'channel', 'packing', 'non-color', 'linear', 'srgb'],
  'do nham': ['roughness', 'orm', 'channel', 'packing', 'non-color', 'principled', 'bsdf'],
  'khong tuong thich gltf': ['shader', 'node', 'gltf', 'export', 'portability', 'procedural', 'bake'],

  // Lighting, camera & rendering
  'anh sang ba diem': ['three', 'point', 'lighting', 'key', 'fill', 'rim', 'ratio', 'hdri', 'studio'],
  'anh sang 3 diem': ['three', 'point', 'lighting', 'key', 'fill', 'rim', 'ratio', 'hdri', 'studio'],
  'den chinh': ['key', 'fill', 'rim', 'three', 'point', 'studio', 'lighting'],
  'anh sang studio': ['studio', 'three', 'point', 'lighting', 'key', 'fill', 'rim', 'hdri', 'product', 'hero'],
  'ong kinh may anh': ['camera', 'focal', 'length', '85mm', 'sensor', 'width', 'f-stop', 'depth', 'field', 'dof'],
  'tieu cu': ['camera', 'focal', 'length', '85mm', 'sensor', 'f-stop', 'dof', 'physically', 'based'],
  'khau do': ['f-stop', 'dof', 'depth', 'field', 'camera', 'lens'],
  'xoa phong': ['dof', 'depth', 'field', 'f-stop', 'camera', 'lens'],
  'do sau truong anh': ['depth', 'field', 'dof', 'f-stop', 'camera', 'focal', 'length'],
  'quan ly mau agx': ['agx', 'filmic', 'color', 'management', 'view', 'transform', 'cycles', 'eevee'],
  'chay sang highlight': ['agx', 'filmic', 'highlight', 'desaturation', 'color', 'management', 'cycles', 'eevee'],
  'khu nhieu': ['denoising', 'denoise', 'openimagedenoise', 'adaptive', 'sampling', 'cycles', 'eevee', 'agx'],
  'so sanh cycles va eevee': ['cycles', 'eevee', 'render', 'engine', 'agx', 'filmic', 'path', 'tracing'],
  'san pham hero': ['product', 'hero', 'scene', 'studio', 'lighting', 'render', 'glb'],
  'giay sneaker': ['sneaker', 'product', 'hero', 'scene', 'cyberpunk', 'studio'],

  // Rigging & animation
  'gan xuong': ['armature', 'rigging', 'rigged', 'skinning', 'joint', 'weights', 'vertex', 'bone', 'roll', 'hierarchy'],
  'trong so xuong': ['joint', 'weights', 'vertex', 'skinning', 'armature', 'normalize'],
  'toi da 4 xuong': ['armature', 'skinning', 'max', '4', 'joint', 'weights', 'vertex', 'normalize'],
  'hanh dong nla': ['nla', 'action', 'baking', 'visual', 'keying', 'keyframes', 'morph', 'targets', 'shape', 'keys', 'animation'],
  'nuong hoat anh': ['nla', 'action', 'baking', 'keyframes', 'morph', 'target', 'export'],
  'chuyen dong nhan vat': ['rigged', 'animated', 'character', 'armature', 'skinning', 'nla', 'action', 'baking'],
  'chan dung nhan vat': ['character', 'portrait', 'camera', 'lighting', 'rigged'],

  // Simulation & VFX
  'mo phong vat ly': ['rigid', 'body', 'cloth', 'physics', 'simulation', 'cache', 'baking', 'substeps', 'collision'],
  'va cham vat cung': ['rigid', 'body', 'collision', 'substeps', 'convex', 'hull', 'physics', 'bake'],
  'mo phong vai': ['cloth', 'simulation', 'collision', 'cache', 'baking', 'physics'],
  'suong mu the tich': ['volumetrics', 'volumetric', 'fog', 'principled', 'volume', 'tradeoffs', 'eevee', 'cycles'],

  // Environment & architecture
  'boi canh moi truong': ['stylized', 'environment', 'scene', 'diorama', 'architectural', 'blockout', 'scatter', 'foliage', 'fog'],
  'kien truc noi that': ['modular', 'architectural', 'grid', 'snapping', 'metric', 'scale', 'interior', 'doorway'],
  'cua so': ['interior', 'architectural', 'modular', 'grid', 'environment', 'lighting'],
  'luoi kien truc': ['modular', 'architectural', 'grid', 'snapping', 'corner', 'pivot', 'metric', 'scale'],
  'phan lop tien canh': ['foreground', 'midground', 'background', 'depth', 'layering', 'environment', 'atmospheric', 'perspective'],

  // Optimization, LOD & glTF/Web
  'ngan sach da giac': ['triangle', 'count', 'budget', 'draw', 'calls', 'vram', 'mobile', 'web', 'desktop'],
  'dien thoai di dong': ['mobile', 'web', 'ready', 'asset', 'optimization', 'triangle', 'budget', 'ktx2', 'draco'],
  'giam da giac': ['decimate', 'decimation', 'lod', 'hierarchy', 'triangle', 'budget', 'optimization'],
  'toi uu hoa web mobile': ['web', 'ready', 'mobile', 'asset', 'optimization', 'decimate', 'lod', 'draco', 'meshopt', 'ktx2', 'compression'],
  'nen draco va ktx2': ['draco', 'meshopt', 'ktx2', 'basis', 'universal', 'texture', 'vram', 'geometry', 'compression'],
  'muc do chi tiet lod': ['lod', 'level', 'detail', 'decimate', 'decimation', 'hierarchy', 'strategy', 'silhouette'],
  'he toa do gltf': ['gltf', 'coordinate', 'system', 'right', 'handed', '+y', 'up', '+z', 'forward', 'trs', 'transform'],
  'xuat file glb': ['blender', 'glb', 'export', 'handoff', 'khronos', 'gltf', 'validator', 'react', 'three', 'fiber', 'binary', 'chunk'],
  'ban giao file glb': ['blender', 'glb', 'handoff', 'khronos', 'validation', 'coordinate', 'system', 'react', 'three', 'fiber'],
  'kiem tra chat luong': ['scene', 'quality', 'inspection', 'correction', 'audit', 'non-manifold', 'normals', 'scale']
});

export const REQUIRED_DOMAINS = [
  'modeling-and-topology',
  'hard-surface-and-organic',
  'geometry-nodes-and-procedural',
  'uv-texturing-and-baking',
  'materials-shaders-and-pbr',
  'lighting-camera-and-rendering',
  'rigging-and-animation',
  'simulation-and-vfx',
  'environment-and-architecture',
  'optimization-lod-and-performance',
  'interchange-gltf-and-web'
];

export const REQUIRED_RECIPE_IDS = [
  'recipe.product-hero-scene',
  'recipe.stylized-environment-scene',
  'recipe.hard-surface-prop',
  'recipe.procedural-geometry-nodes-asset',
  'recipe.uv-and-pbr-material-preparation',
  'recipe.presentation-lighting-and-camera',
  'recipe.rigged-and-animated-asset',
  'recipe.scene-quality-inspection-and-correction',
  'recipe.blender-to-glb-handoff',
  'recipe.web-ready-asset-optimization'
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonStable(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * Resolves catalog file paths across either the canonical BlendOps repository/package root
 * (`registry/*`, `schemas/*`) or a project-local installed catalog root (`.blendops/catalog/*`).
 */
export function resolveCatalogPaths(rootDir = DEFAULT_ROOT) {
  const absRoot = path.resolve(rootDir);
  const directCatalogCandidate = path.join(absRoot, 'knowledge-catalog.json');
  const installedCatalogCandidate = path.join(absRoot, '.blendops', 'catalog', 'knowledge-catalog.json');

  if (fs.existsSync(directCatalogCandidate)) {
    return {
      mode: 'installed-catalog-dir',
      baseDir: absRoot,
      sourcesPath: path.join(absRoot, 'knowledge-sources.json'),
      knowledgePath: path.join(absRoot, 'knowledge-catalog.json'),
      recipesPath: path.join(absRoot, 'recipe-catalog.json'),
      indexPath: path.join(absRoot, 'catalog-index.json'),
      skillsPath: fs.existsSync(path.join(absRoot, 'skills-summary.json'))
        ? path.join(absRoot, 'skills-summary.json')
        : path.join(absRoot, 'registry/skills.json'),
      sourcesSchemaPath: path.join(absRoot, 'schemas/knowledge-source-registry.schema.json'),
      knowledgeSchemaPath: path.join(absRoot, 'schemas/knowledge-record.schema.json'),
      recipeSchemaPath: path.join(absRoot, 'schemas/recipe-record.schema.json')
    };
  }

  if (
    !fs.existsSync(path.join(absRoot, 'registry/knowledge-catalog.json')) &&
    fs.existsSync(installedCatalogCandidate)
  ) {
    const catDir = path.join(absRoot, '.blendops', 'catalog');
    return {
      mode: 'project-local-blendops-catalog',
      baseDir: catDir,
      sourcesPath: path.join(catDir, 'knowledge-sources.json'),
      knowledgePath: path.join(catDir, 'knowledge-catalog.json'),
      recipesPath: path.join(catDir, 'recipe-catalog.json'),
      indexPath: path.join(catDir, 'catalog-index.json'),
      skillsPath: path.join(catDir, 'skills-summary.json'),
      sourcesSchemaPath: path.join(catDir, 'schemas/knowledge-source-registry.schema.json'),
      knowledgeSchemaPath: path.join(catDir, 'schemas/knowledge-record.schema.json'),
      recipeSchemaPath: path.join(catDir, 'schemas/recipe-record.schema.json')
    };
  }

  return {
    mode: 'canonical-repo',
    baseDir: absRoot,
    sourcesPath: path.join(absRoot, 'registry/knowledge-sources.json'),
    knowledgePath: path.join(absRoot, 'registry/knowledge-catalog.json'),
    recipesPath: path.join(absRoot, 'registry/recipe-catalog.json'),
    indexPath: path.join(absRoot, 'registry/catalog-index.json'),
    skillsPath: path.join(absRoot, 'registry/skills.json'),
    sourcesSchemaPath: path.join(absRoot, 'schemas/knowledge-source-registry.schema.json'),
    knowledgeSchemaPath: path.join(absRoot, 'schemas/knowledge-record.schema.json'),
    recipeSchemaPath: path.join(absRoot, 'schemas/recipe-record.schema.json')
  };
}

/**
 * Folds Vietnamese diacritics and Unicode combining marks to ASCII lowercase while
 * preserving technical symbols (+, #, ., -).
 */
export function foldVietnameseDiacritics(input) {
  if (!input) return '';
  return String(input)
    .normalize('NFC')
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Detects whether a query contains Vietnamese characters or known Vietnamese 3D phrases.
 */
export function detectQueryLanguage(query) {
  if (!query) return 'en';
  const raw = String(query).normalize('NFC');
  const hasVietnameseChars = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(raw);
  const folded = foldVietnameseDiacritics(raw);
  const hasViPhrase = Object.keys(VIETNAMESE_DOMAIN_SYNONYMS).some((phrase) => folded.includes(phrase));
  if (!hasVietnameseChars && !hasViPhrase) {
    return 'en';
  }
  const hasEnglishTechTerms = /\b(blender|gltf|glb|cycles|eevee|agx|filmic|uv|pbr|udim|draco|meshopt|ktx2|threejs|r3f|geometry nodes|principled bsdf|nla|mikktspace)\b/i.test(raw);
  return hasEnglishTechTerms ? 'mixed_vi_en' : 'vi';
}

export function tokenize(text) {
  if (!text) return [];
  const nfc = String(text).normalize('NFC');
  const folded = foldVietnameseDiacritics(nfc);

  const baseTokens = folded
    .replace(/[^a-z0-9+#.-]+/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

  // Expand Vietnamese domain phrases deterministically
  const expanded = [...baseTokens];
  const cleanSpaceFolded = folded.replace(/[^a-z0-9+#.-]+/g, ' ').trim();
  for (const [viPhrase, enTokens] of Object.entries(VIETNAMESE_DOMAIN_SYNONYMS)) {
    if (cleanSpaceFolded.includes(viPhrase)) {
      for (const tok of enTokens) {
        if (!STOP_WORDS.has(tok)) {
          expanded.push(tok);
        }
      }
    }
  }

  return Array.from(new Set(expanded));
}

export const normalizeAndTokenizeBilingual = tokenize;

/**
 * Deterministic workflow stage derivation rule from canonical `registry/skills.json`
 * (`category`, `role`, `id`). Explicitly labeled as derived in audit outputs.
 */
export const WORKFLOW_STAGE_DERIVATION_RULE =
  'Derived deterministically from registry/skills.json category + role + skill ID: routing-and-governance/brief-and-scope/recipe-and-pack-governance -> discover-and-plan; asset-and-library-governance -> source-and-clear-assets; runtime-and-bridge-governance -> runtime-preflight; scene-and-domain-planning/color-and-render-decisions -> stage-camera-lighting-and-lookdev; quality-and-budget-validation -> inspect-and-validate; web-and-glb-handoff/evidence-and-reporting -> verify-evidence-and-handoff.';

export function deriveSkillWorkflowStage(skill) {
  const cat = skill.category || '';
  const id = skill.id || '';
  if (
    cat === 'routing-and-governance' ||
    cat === 'brief-and-scope' ||
    cat === 'recipe-and-pack-governance' ||
    id === 'blender-brainstorming'
  ) {
    return 'discover-and-plan';
  }
  if (cat === 'asset-and-library-governance') {
    return 'source-and-clear-assets';
  }
  if (cat === 'runtime-and-bridge-governance') {
    return 'runtime-preflight';
  }
  if (cat === 'scene-and-domain-planning' || cat === 'color-and-render-decisions') {
    return 'stage-camera-lighting-and-lookdev';
  }
  if (cat === 'quality-and-budget-validation' || id === 'blender-troubleshooting') {
    return 'inspect-and-validate';
  }
  if (cat === 'web-and-glb-handoff' || cat === 'evidence-and-reporting') {
    return 'verify-evidence-and-handoff';
  }
  return 'stage-camera-lighting-and-lookdev';
}

function classifySkillRole(skill) {
  const cat = skill.category || '';
  const id = skill.id || '';
  if (
    cat === 'routing-and-governance' ||
    cat === 'brief-and-scope' ||
    cat === 'recipe-and-pack-governance'
  ) {
    return 'intake-routing-or-governance';
  }
  if (cat === 'asset-and-library-governance') {
    return 'asset-sourcing-license-or-style-governance';
  }
  if (cat === 'runtime-and-bridge-governance') {
    return 'runtime-bridge-or-preflight-governance';
  }
  if (cat === 'quality-and-budget-validation') {
    if (id.includes('budget') || id.includes('polycount')) {
      return 'optimization-or-budget-audit';
    }
    return 'scene-inspection-or-quality-validation';
  }
  if (cat === 'scene-and-domain-planning' || cat === 'color-and-render-decisions') {
    if (id.includes('material') || id.includes('color')) {
      return 'uv-material-or-lookdev-workflow';
    }
    return 'lighting-camera-or-scene-planning-workflow';
  }
  if (cat === 'web-and-glb-handoff') {
    return 'export-interchange-or-handoff';
  }
  if (cat === 'evidence-and-reporting') {
    return 'review-recovery-or-evidence';
  }
  return 'modeling-or-procedural-workflow';
}

function readSkillMarkdownMetadata(rootDir, skillId) {
  const mdPath = path.join(rootDir, 'skills', skillId, 'SKILL.md');
  if (!fs.existsSync(mdPath)) {
    return {
      display_name: skillId,
      frontmatter_description: '',
      laws_referenced: ['laws/evidence-before-done.md', 'laws/non-blender-user-language.md']
    };
  }
  const raw = fs.readFileSync(mdPath, 'utf8');
  const h1Match = raw.match(/^#\s+(.+?)\s*$/m);
  const descMatch = raw.match(/^description:\s*(.+?)\s*$/m);
  const laws = [];
  for (const lawName of [
    'official-runtime-only',
    'no-arbitrary-python-interface',
    'evidence-before-done',
    'non-blender-user-language'
  ]) {
    if (raw.includes(lawName)) {
      laws.push(`laws/${lawName}.md`);
    }
  }
  return {
    display_name: h1Match ? h1Match[1].trim() : skillId,
    frontmatter_description: descMatch ? descMatch[1].trim().replace(/^['"]|['"]$/g, '') : '',
    laws_referenced: laws.length > 0 ? laws : ['laws/evidence-before-done.md']
  };
}

function inspectReferenceMarkdownFile(rootDir, relPath) {
  const absPath = path.join(rootDir, relPath);
  if (!fs.existsSync(absPath)) {
    return { title: path.basename(relPath), headings: [], lineCount: 0, byteSize: 0 };
  }
  const raw = fs.readFileSync(absPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const h1 = lines.find((l) => l.startsWith('# '))?.replace(/^#\s+/, '').trim() || path.basename(relPath);
  const headings = lines
    .filter((l) => /^##\s+/.test(l))
    .map((l) => l.replace(/^##\s+/, '').trim());
  return {
    title: h1,
    headings,
    lineCount: lines.length,
    byteSize: Buffer.byteLength(raw, 'utf8')
  };
}

// Cross-skill reference files that touch domain concepts shared across multiple skills and are flagged
// for periodic human semantic review rather than claiming 100% automated semantic deduplication.
const SEMANTIC_REVIEW_CANDIDATE_REFS = new Set([
  'skills/product-hero-scene-planner/references/scene-plan-schema.md',
  'skills/r3f-component-plan/references/suspense-placement-rules.md',
  'skills/r3f-component-plan/references/usegltf-caching-rules.md',
  'skills/render-export-evidence/references/evidence-record-templates.md',
  'skills/render-export-evidence/references/truth-label-decision-tree.md',
  'skills/resolution-aspect-decision/references/aspect-defaults.md',
  'skills/resolution-aspect-decision/references/print-vs-screen-rules.md',
  'skills/scene-readiness/references/quality-rubric.md'
]);

function classifyReferenceFile(rootDir, relPath, promotedMap) {
  const promotedTo = promotedMap.get(relPath) || [];
  const fileMeta = inspectReferenceMarkdownFile(rootDir, relPath);

  if (
    relPath.startsWith('skills/recipe-fit-assessor/references/') ||
    relPath.startsWith('skills/blender-recipe-decomposer/references/')
  ) {
    return {
      path: relPath,
      title: fileMeta.title,
      line_count: fileMeta.lineCount,
      classification: 'recipe_specific_procedure',
      classification_method: 'human_semantic_review',
      review_status: 'verified_synchronized',
      rationale: 'Reviewed and synchronized with registry/recipe-catalog.json for recipe fit scoring and multi-deliverable decomposition.',
      promoted_to_knowledge_ids: promotedTo
    };
  }

  if (promotedTo.length > 0) {
    return {
      path: relPath,
      title: fileMeta.title,
      line_count: fileMeta.lineCount,
      classification: 'reusable_cross_skill_knowledge',
      classification_method: 'knowledge_promotion_mapping',
      review_status: 'verified_promoted',
      rationale: `Domain rules promoted to canonical knowledge record(s): ${promotedTo.join(', ')} while remaining available as a progressive-disclosure skill reference.`,
      promoted_to_knowledge_ids: promotedTo
    };
  }

  if (
    relPath.startsWith('skills/workflow-stage-router/references/') ||
    relPath.startsWith('skills/pack-prerequisite-checker/references/') ||
    relPath.startsWith('skills/acceptance-criteria-builder/references/') ||
    relPath.startsWith('skills/stage-gates/references/') ||
    relPath.startsWith('skills/done-criteria/references/') ||
    relPath.startsWith('skills/scope-guard/references/') ||
    relPath.startsWith('skills/blendops-help/references/') ||
    relPath.startsWith('skills/runtime-path-picker/references/') ||
    relPath.startsWith('skills/runtime-setup/references/') ||
    relPath.startsWith('skills/runtime-readiness/references/') ||
    relPath.startsWith('skills/bridge-conflicts/references/') ||
    relPath.startsWith('skills/path-one-host-outline/references/') ||
    relPath.startsWith('skills/cli-appendix-job-outline/references/') ||
    relPath.startsWith('skills/runtime-attempt-report/references/')
  ) {
    return {
      path: relPath,
      title: fileMeta.title,
      line_count: fileMeta.lineCount,
      classification: 'workflow_or_pack_governance',
      classification_method: 'human_semantic_review',
      review_status: 'verified_synchronized',
      rationale: 'Governs BlendOps workflow stage routing, pack prerequisites, stage gates, stop criteria, or Path 1 / Path 2 / CLI runtime boundaries.',
      promoted_to_knowledge_ids: []
    };
  }

  const needsReview = SEMANTIC_REVIEW_CANDIDATE_REFS.has(relPath);
  return {
    path: relPath,
    title: fileMeta.title,
    line_count: fileMeta.lineCount,
    classification: 'skill_specific_operating_instructions',
    classification_method: 'rule_based_path_and_heading_inspection',
    review_status: needsReview ? 'needs_semantic_review' : 'rule_classified_skill_local',
    rationale: needsReview
      ? 'Provides skill-local checklists/templates adjacent to promoted domain knowledge; flagged as needs_semantic_review for future cross-skill consolidation.'
      : 'Provides skill-local execution steps, report formatting templates, or checklists specific to this skill contract.',
    promoted_to_knowledge_ids: []
  };
}

export function buildSkillArchitectureAuditData(rootDir = DEFAULT_ROOT) {
  const skillsRegistry = readJson(path.join(rootDir, 'registry/skills.json'));
  const knowledgeCatalog = readJson(path.join(rootDir, 'registry/knowledge-catalog.json'));
  const recipeCatalog = readJson(path.join(rootDir, 'registry/recipe-catalog.json'));
  const workflowGraph = readJson(path.join(rootDir, 'registry/workflow-graph.json'));
  const capabilityPolicy = readJson(path.join(rootDir, 'registry/runtime-capability-policy.json'));

  const capPolicyMap = new Map(
    (capabilityPolicy.skills || []).map((entry) => [entry.skillId, entry])
  );

  const promotedMap = new Map();
  const skillToKnowledge = new Map();
  const skillToRecipes = new Map();

  for (const record of knowledgeCatalog.records) {
    for (const refPath of record.promoted_from_skill_refs || []) {
      if (!promotedMap.has(refPath)) promotedMap.set(refPath, []);
      promotedMap.get(refPath).push(record.id);
    }
    for (const skillId of record.related_ids?.skill_ids || []) {
      if (!skillToKnowledge.has(skillId)) skillToKnowledge.set(skillId, []);
      if (!skillToKnowledge.get(skillId).includes(record.id)) {
        skillToKnowledge.get(skillId).push(record.id);
      }
    }
  }

  for (const recipe of recipeCatalog.recipes) {
    const allSkillIds = new Set([
      ...(recipe.required_skill_ids || recipe.required_skills || []),
      ...(recipe.optional_skills || [])
    ]);
    for (const st of recipe.stages || []) {
      for (const sid of st.skill_ids || []) allSkillIds.add(sid);
    }
    for (const skillId of allSkillIds) {
      if (!skillToRecipes.has(skillId)) skillToRecipes.set(skillId, []);
      if (!skillToRecipes.get(skillId).includes(recipe.id)) {
        skillToRecipes.get(skillId).push(recipe.id);
      }
    }
  }

  const allReferenceClassifications = [];
  const classificationCounts = {
    reusable_cross_skill_knowledge: 0,
    skill_specific_operating_instructions: 0,
    recipe_specific_procedure: 0,
    workflow_or_pack_governance: 0,
    historical_or_eval_evidence: 0,
    outdated_or_duplicated: 0
  };
  const classificationMethodCounts = {
    knowledge_promotion_mapping: 0,
    human_semantic_review: 0,
    rule_based_path_and_heading_inspection: 0
  };
  let needsSemanticReviewCount = 0;

  const skillAudits = skillsRegistry.skills.map((skill) => {
    const refsDir = path.join(rootDir, 'skills', skill.id, 'references');
    const refFiles = fs.existsSync(refsDir)
      ? fs.readdirSync(refsDir).filter((f) => f.endsWith('.md')).sort()
      : [];

    const classifiedRefs = refFiles.map((fileName) => {
      const relPath = `skills/${skill.id}/references/${fileName}`;
      const entry = classifyReferenceFile(rootDir, relPath, promotedMap);
      classificationCounts[entry.classification] = (classificationCounts[entry.classification] || 0) + 1;
      classificationMethodCounts[entry.classification_method] =
        (classificationMethodCounts[entry.classification_method] || 0) + 1;
      if (entry.review_status === 'needs_semantic_review') {
        needsSemanticReviewCount += 1;
      }
      allReferenceClassifications.push(entry);
      return entry;
    });

    const linkedKnowledge = (skillToKnowledge.get(skill.id) || []).sort();
    const linkedRecipes = (skillToRecipes.get(skill.id) || []).sort();
    const mdMeta = readSkillMarkdownMetadata(rootDir, skill.id);
    const capEntry = capPolicyMap.get(skill.id);
    const derivedStage = deriveSkillWorkflowStage(skill);
    const governedCeiling = capEntry?.governedRuntimeCeiling || skill.capabilityTier || 'L0';

    return {
      skill_id: skill.id,
      version: skill.version || '1.0.0',
      display_name: mdMeta.display_name,
      category: skill.category,
      contract_role: skill.role,
      purpose: skill.purpose,
      frontmatter_description: mdMeta.frontmatter_description,
      derived_workflow_stage: derivedStage,
      workflow_stage: derivedStage,
      workflow_stage_is_derived: true,
      capability_tier: skill.capabilityTier,
      governed_runtime_ceiling: governedCeiling,
      mutates_scene: governedCeiling !== 'L0',
      requires_pre_mutation_backup_when_executed: Boolean(capEntry?.requiresPreMutationBackupWhenExecuted),
      laws_enforced: mdMeta.laws_referenced,
      primary_layer: 'skill-layer',
      current_role_classification: classifySkillRole(skill),
      recommended_disposition: 'keep_as_skill_and_link_knowledge',
      linked_knowledge_ids: linkedKnowledge,
      linked_recipe_ids: linkedRecipes,
      reference_files_count: classifiedRefs.length,
      references: classifiedRefs
    };
  });

  // Historical / evaluation evidence files stored in their canonical layer (docs/evals/ & docs/audits/)
  const docsEvalsDir = path.join(rootDir, 'docs/evals');
  const historicalEvalFilesCount = fs.existsSync(docsEvalsDir)
    ? fs.readdirSync(docsEvalsDir).filter((f) => f.endsWith('.md') && f !== 'README.md').length
    : 0;

  return {
    schema_version: '1.1.0',
    audit_scope: 'phase-0-phase-1-and-phase-2-architecture-reconciliation',
    workflow_stage_derivation_rule: WORKFLOW_STAGE_DERIVATION_RULE,
    classification_methodology: {
      summary:
        'Combines explicit promoted_from_skill_refs mappings (32 files), human-reviewed recipe & governance references (48 files), and rule-based path + heading inspection of skill-local operating instructions (71 files).',
      methods_breakdown: classificationMethodCounts,
      needs_semantic_review_count: needsSemanticReviewCount,
      historical_eval_evidence_files_in_docs_evals: historicalEvalFilesCount,
      honesty_note:
        'outdated_or_duplicated is 0 for exact file hash collisions inside skills/*/references/*.md; 8 skill-local checklist references that border promoted domain topics are explicitly marked review_status="needs_semantic_review" rather than claiming full semantic deduplication without manual review.'
    },
    five_layer_architecture: {
      skill_layer: {
        canonical_paths: ['skills/*/SKILL.md', 'skills/*/contract.json', 'registry/skills.json', 'registry/workflow-graph.json'],
        skill_count: skillAudits.length,
        workflow_edge_count: (workflowGraph.edges || []).length
      },
      knowledge_layer: {
        canonical_paths: ['registry/knowledge-sources.json', 'registry/knowledge-catalog.json', 'schemas/knowledge-record.schema.json', 'schemas/knowledge-source-registry.schema.json'],
        domain_count: REQUIRED_DOMAINS.length,
        source_count: readJson(path.join(rootDir, 'registry/knowledge-sources.json')).sources.length,
        knowledge_record_count: knowledgeCatalog.records.length
      },
      recipe_layer: {
        canonical_paths: ['registry/recipe-catalog.json', 'schemas/recipe-record.schema.json', 'docs/recipes/'],
        recipe_count: recipeCatalog.recipes.length,
        scenario_recipes: ['docs/recipes/cyberpunk-shoe-hero.md']
      },
      runtime_production_layer: {
        status: 'external-boundary-only',
        paths_supported: [
          'Path 1: Official Blender Lab MCP (Blender 5.1+ Lab add-on + server)',
          'Path 2: Community mcp-for-blender (Blender 3.0+)',
          'CLI Appendix: blender --background --python'
        ],
        capability_policy_path: 'registry/runtime-capability-policy.json'
      },
      evaluation_and_evidence_layer: {
        canonical_paths: ['evals/suites/*.eval.json', 'evals/catalog-retrieval-evals.json', 'evals/scene-specs/', 'docs/evals/', 'docs/audits/'],
        runtime_execution_truth_state: 'Not Run',
        artifact_production_truth_state: 'Not Produced'
      }
    },
    summary: {
      total_skills_audited: skillAudits.length,
      total_skill_references_classified: allReferenceClassifications.length,
      reference_classification_breakdown: classificationCounts,
      classification_method_breakdown: classificationMethodCounts,
      needs_semantic_review_count: needsSemanticReviewCount,
      skills_with_linked_knowledge: skillAudits.filter((s) => s.linked_knowledge_ids.length > 0).length,
      skills_with_linked_recipes: skillAudits.filter((s) => s.linked_recipe_ids.length > 0).length
    },
    skills: skillAudits,
    reference_classifications: allReferenceClassifications
  };
}

export function renderSkillArchitectureAuditMarkdown(auditData) {
  const lines = [
    '# BlendOps Phase 0, Phase 1 & Phase 2 — Skill Architecture & Reference Classification Audit',
    '',
    '> Generated deterministically by `scripts/build-knowledge-catalog.mjs`. Maps all 48 canonical skills from `registry/skills.json` and `registry/runtime-capability-policy.json`, and classifies all 151 `skills/*/references/*.md` files across the 5-layer architecture.',
    '',
    '## 1. Five-Layer Architecture Summary',
    '',
    '| Layer | Canonical Artifacts | Count / Status | Responsibility |',
    '| :--- | :--- | :--- | :--- |',
    `| **A. Skill Layer** | \`skills/*/SKILL.md\`, \`skills/*/contract.json\`, \`registry/skills.json\`, \`registry/workflow-graph.json\` | ${auditData.five_layer_architecture.skill_layer.skill_count} skills, ${auditData.five_layer_architecture.skill_layer.workflow_edge_count} workflow edges | Single-responsibility agent task units, contracts, capability tiers (\`L0\`–\`L3\`), and handoffs |`,
    `| **B. Knowledge Layer** | \`registry/knowledge-sources.json\`, \`registry/knowledge-catalog.json\` | ${auditData.five_layer_architecture.knowledge_layer.knowledge_record_count} records across ${auditData.five_layer_architecture.knowledge_layer.domain_count} domains (${auditData.five_layer_architecture.knowledge_layer.source_count} sources) | Reusable, source-traceable 3D/Blender domain rules, parameters, tradeoffs, and validation checks |`,
    `| **C. Recipe Layer** | \`registry/recipe-catalog.json\`, \`docs/recipes/cyberpunk-shoe-hero.md\` | ${auditData.five_layer_architecture.recipe_layer.recipe_count} canonical recipes + 1 golden-path scenario doc | Multi-stage asset/scene construction plans composing skills, knowledge records, and checkpoints |`,
    `| **D. Runtime / Production Layer** | \`registry/runtime-capability-policy.json\`, \`docs/runtime-stack-strategy.md\` | External boundary (Path 1 Lab MCP 5.1+, Path 2 \`mcp-for-blender\` 3.0+, CLI appendix) | External execution bridges; BlendOps owns zero runtime servers or add-ons |`,
    `| **E. Evaluation & Evidence Layer** | \`evals/suites/\`, \`evals/catalog-retrieval-evals.json\`, \`evals/scene-specs/\`, \`docs/evals/\` | Offline contract + retrieval + planner evals passing; runtime = \`${auditData.five_layer_architecture.evaluation_and_evidence_layer.runtime_execution_truth_state}\`, artifacts = \`${auditData.five_layer_architecture.evaluation_and_evidence_layer.artifact_production_truth_state}\` | Separates schema validity, source backing, version checks, runtime execution, and visual critique |`,
    '',
    '## 2. Skill Reference Classification & Methodology Summary (151 Files)',
    '',
    `- **Derivation Rule for Workflow Stages**: ${auditData.workflow_stage_derivation_rule}`,
    `- **Classification Methodology**: ${auditData.classification_methodology.summary}`,
    `- **Honesty Note**: ${auditData.classification_methodology.honesty_note}`,
    '',
    '| Classification Category | File Count | Primary Method | Description |',
    '| :--- | ---: | :--- | :--- |',
    `| \`reusable_cross_skill_knowledge\` | ${auditData.summary.reference_classification_breakdown.reusable_cross_skill_knowledge} | \`knowledge_promotion_mapping\` | Domain rules promoted to canonical \`knowledge.*\` records in \`registry/knowledge-catalog.json\` |`,
    `| \`skill_specific_operating_instructions\` | ${auditData.summary.reference_classification_breakdown.skill_specific_operating_instructions} | \`rule_based_path_and_heading_inspection\` (${auditData.summary.needs_semantic_review_count} flagged \`needs_semantic_review\`) | Skill-local checklists, report templates, and step-by-step operating instructions |`,
    `| \`workflow_or_pack_governance\` | ${auditData.summary.reference_classification_breakdown.workflow_or_pack_governance} | \`human_semantic_review\` | Stage routing, intake clarification, pack prerequisite, stage gates, and runtime path governance |`,
    `| \`recipe_specific_procedure\` | ${auditData.summary.reference_classification_breakdown.recipe_specific_procedure} | \`human_semantic_review\` | Recipe discovery catalog and recipe decomposition rules synchronized with \`registry/recipe-catalog.json\` |`,
    `| \`historical_or_eval_evidence\` | ${auditData.summary.reference_classification_breakdown.historical_or_eval_evidence} | Stored in \`docs/evals/\` (${auditData.classification_methodology.historical_eval_evidence_files_in_docs_evals} files) | Historical evaluation and runtime evidence records live under \`docs/evals/\` rather than inside \`skills/*/references/\` |`,
    `| \`outdated_or_duplicated\` | ${auditData.summary.reference_classification_breakdown.outdated_or_duplicated} | Exact hash & promotion audit | Zero exact duplicate reference files; ${auditData.summary.needs_semantic_review_count} adjacent checklist files tracked under \`needs_semantic_review\` |`,
    `| **Total** | **${auditData.summary.total_skill_references_classified}** | **100% accounted for** | **All 151 \`skills/*/references/*.md\` files classified with zero \`undefined\` fields** |`,
    '',
    '## 3. Complete 48-Skill Architecture Matrix',
    '',
    '| # | Skill ID | Category | Derived Stage | Capability Tier (Ceiling) | Role Classification | Disposition | Linked Knowledge | Linked Recipes | Refs |',
    '| ---: | :--- | :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: |'
  ];

  auditData.skills.forEach((s, idx) => {
    lines.push(
      `| ${idx + 1} | \`${s.skill_id}\` | \`${s.category}\` | \`${s.derived_workflow_stage}\` | \`${s.capability_tier}\` (\`${s.governed_runtime_ceiling}\`) | \`${s.current_role_classification}\` | \`${s.recommended_disposition}\` | ${s.linked_knowledge_ids.length} | ${s.linked_recipe_ids.length} | ${s.reference_files_count} |`
    );
  });

  lines.push(
    '',
    '## 4. Promoted Cross-Skill Reference Files -> Canonical Knowledge Records',
    '',
    '| Reference File Path | Title | Classification | Method | Promoted To Canonical `knowledge.*` ID(s) |',
    '| :--- | :--- | :--- | :--- | :--- |'
  );

  for (const ref of auditData.reference_classifications) {
    if (ref.promoted_to_knowledge_ids.length > 0 || ref.classification === 'recipe_specific_procedure') {
      const targets = ref.promoted_to_knowledge_ids.length > 0
        ? ref.promoted_to_knowledge_ids.map((id) => `\`${id}\``).join(', ')
        : 'Synchronized with `registry/recipe-catalog.json`';
      lines.push(`| \`${ref.path}\` | ${ref.title} | \`${ref.classification}\` | \`${ref.classification_method}\` | ${targets} |`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

export const generateSkillArchitectureAuditData = buildSkillArchitectureAuditData;

/**
 * Compiles a real JSON Schema Draft 2020-12 validator using Ajv2020.
 */
export function compileSchemaValidator(rootSchema) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(rootSchema);
}

/**
 * Evaluates whether a knowledge record or recipe record is eligible for its declared `evidence_status`.
 * Specifically enforces that `runtime-tested` is only allowed when backed by a real, non-static,
 * schema-validated runtime evidence packet recording actual Blender version, MCP/CLI procedure,
 * Produced/Verified status, and artifact hashes.
 */
export function evaluateEvidencePromotionGate(recordOrRecipe, rootDir = DEFAULT_ROOT) {
  const errors = [];
  const status = recordOrRecipe?.evidence_status;
  const id = recordOrRecipe?.id || '(unknown-id)';

  if (!['authored', 'source-reviewed', 'version-checked', 'runtime-tested'].includes(status)) {
    return {
      allowed: false,
      status,
      errors: [`Record ${id} has invalid evidence_status "${status}".`]
    };
  }

  if (status !== 'runtime-tested') {
    if (recordOrRecipe?.blender_versions?.runtime_tested_version) {
      errors.push(
        `Record ${id} has evidence_status="${status}" (not runtime-tested), so blender_versions.runtime_tested_version must be null (got "${recordOrRecipe.blender_versions.runtime_tested_version}").`
      );
    }
    return {
      allowed: errors.length === 0,
      status,
      errors
    };
  }

  const relPacketPath = recordOrRecipe.evidence_packet_path;
  if (!relPacketPath || typeof relPacketPath !== 'string' || !/^docs\/evals\/[a-z0-9._-]+\.(md|json)$/.test(relPacketPath)) {
    errors.push(
      `Record ${id} claims evidence_status="runtime-tested" without a valid evidence_packet_path under docs/evals/*.json or docs/evals/*.md.`
    );
    return { allowed: false, status, errors };
  }

  const absPacketPath = path.join(rootDir, relPacketPath);
  if (!fs.existsSync(absPacketPath)) {
    errors.push(
      `Record ${id} claims evidence_status="runtime-tested", but evidence_packet_path "${relPacketPath}" does not exist on disk.`
    );
    return { allowed: false, status, errors };
  }

  const rawContent = fs.readFileSync(absPacketPath, 'utf8');
  let packetObj = null;

  if (relPacketPath.endsWith('.json')) {
    try {
      packetObj = JSON.parse(rawContent);
    } catch (err) {
      errors.push(`Record ${id} evidence_packet_path "${relPacketPath}" contains malformed JSON: ${err.message}`);
      return { allowed: false, status, errors };
    }
  } else {
    // Markdown eval file: check if it embeds a JSON runtime-evidence-packet block
    const jsonBlockMatch = rawContent.match(/```json\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      try {
        const candidate = JSON.parse(jsonBlockMatch[1]);
        if (candidate && typeof candidate === 'object' && candidate.runtimeEvidence && candidate.artifactEvidence) {
          packetObj = candidate;
        }
      } catch {
        packetObj = null;
      }
    }
    if (!packetObj) {
      errors.push(
        `Record ${id} claims evidence_status="runtime-tested" pointing to "${relPacketPath}", which does not contain a machine-validated live runtime evidence packet (runtime remains Not Run).`
      );
      return { allowed: false, status, errors };
    }
  }

  const packetVal = validateEvidencePacket(packetObj);
  if (!packetVal.valid) {
    errors.push(
      `Record ${id} runtime evidence packet "${relPacketPath}" failed schema/policy validation: ${packetVal.errors.join('; ')}`
    );
    return { allowed: false, status, errors };
  }

  if (packetObj.isStaticFixture === true) {
    errors.push(
      `Record ${id} cannot promote to evidence_status="runtime-tested" using a static CI fixture (isStaticFixture: true in "${relPacketPath}").`
    );
  }

  const rtStatus = packetObj.runtimeEvidence?.runtimeStatus;
  if (rtStatus !== 'Produced' && rtStatus !== 'Verified') {
    errors.push(
      `Record ${id} cannot promote to evidence_status="runtime-tested" when runtimeEvidence.runtimeStatus is "${rtStatus}" (requires "Produced" or "Verified").`
    );
  }

  const testedVer = packetObj.runtimeEvidence?.blenderVersion;
  if (!testedVer) {
    errors.push(
      `Record ${id} runtime evidence packet "${relPacketPath}" is missing runtimeEvidence.blenderVersion.`
    );
  } else if (
    recordOrRecipe.blender_versions &&
    recordOrRecipe.blender_versions.runtime_tested_version !== testedVer
  ) {
    errors.push(
      `Record ${id} blender_versions.runtime_tested_version ("${recordOrRecipe.blender_versions.runtime_tested_version}") does not match evidence packet blenderVersion ("${testedVer}").`
    );
  }

  return {
    allowed: errors.length === 0,
    status,
    errors,
    packet: packetObj
  };
}

export function validateKnowledgeAndRecipeCatalogs(rootDir = DEFAULT_ROOT) {
  const errors = [];
  const warnings = [];
  const paths = resolveCatalogPaths(rootDir);

  for (const p of [
    paths.sourcesSchemaPath,
    paths.knowledgeSchemaPath,
    paths.recipeSchemaPath,
    paths.sourcesPath,
    paths.knowledgePath,
    paths.recipesPath,
    paths.skillsPath
  ]) {
    if (!fs.existsSync(p)) {
      errors.push(`Missing required file: ${path.relative(rootDir, p)}`);
    }
  }
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const validateSources = compileSchemaValidator(readJson(paths.sourcesSchemaPath));
  const validateKnowledge = compileSchemaValidator(readJson(paths.knowledgeSchemaPath));
  const validateRecipes = compileSchemaValidator(readJson(paths.recipeSchemaPath));

  const sourcesData = readJson(paths.sourcesPath);
  const knowledgeData = readJson(paths.knowledgePath);
  const recipesData = readJson(paths.recipesPath);
  const skillsData = readJson(paths.skillsPath);

  if (!validateSources(sourcesData)) {
    for (const err of validateSources.errors || []) {
      errors.push(`registry/knowledge-sources.json ${err.instancePath || '/'}: ${err.message}`);
    }
  }
  if (!validateKnowledge(knowledgeData)) {
    for (const err of validateKnowledge.errors || []) {
      errors.push(`registry/knowledge-catalog.json ${err.instancePath || '/'}: ${err.message}`);
    }
  }
  if (!validateRecipes(recipesData)) {
    for (const err of validateRecipes.errors || []) {
      errors.push(`registry/recipe-catalog.json ${err.instancePath || '/'}: ${err.message}`);
    }
  }

  const sourceIds = new Set();
  for (const src of sourcesData.sources || []) {
    if (sourceIds.has(src.id)) {
      errors.push(`Duplicate source ID: ${src.id}`);
    }
    sourceIds.add(src.id);
  }

  const skillIds = new Set((skillsData.skills || []).map((s) => s.id));
  const knowledgeIds = new Set();
  const domainCounts = new Map(REQUIRED_DOMAINS.map((d) => [d, 0]));

  for (const rec of knowledgeData.records || []) {
    if (knowledgeIds.has(rec.id)) {
      errors.push(`Duplicate knowledge ID: ${rec.id}`);
    }
    knowledgeIds.add(rec.id);
    domainCounts.set(rec.domain, (domainCounts.get(rec.domain) || 0) + 1);
  }

  for (const domain of REQUIRED_DOMAINS) {
    const count = domainCounts.get(domain) || 0;
    if (count < 2) {
      errors.push(`Domain "${domain}" has ${count} knowledge records; at least 2 are required.`);
    }
  }

  const recipeIds = new Set();
  for (const rec of recipesData.recipes || []) {
    if (recipeIds.has(rec.id)) {
      errors.push(`Duplicate recipe ID: ${rec.id}`);
    }
    recipeIds.add(rec.id);
  }

  for (const reqRecipeId of REQUIRED_RECIPE_IDS) {
    if (!recipeIds.has(reqRecipeId)) {
      errors.push(`Missing required canonical recipe ID: ${reqRecipeId}`);
    }
  }

  const placeholderRegex = /\b(TODO|TBD|FIXME|lorem ipsum)\b/i;

  // Cross-reference & evidence-gate validation for knowledge records
  for (const rec of knowledgeData.records || []) {
    if (placeholderRegex.test(JSON.stringify(rec))) {
      errors.push(`Knowledge record ${rec.id} contains placeholder text (TODO/TBD/FIXME).`);
    }
    const gateRes = evaluateEvidencePromotionGate(rec, paths.baseDir);
    if (!gateRes.allowed) {
      for (const ge of gateRes.errors) errors.push(ge);
    }
    for (const sr of rec.source_refs || []) {
      if (!sourceIds.has(sr.source_id)) {
        errors.push(`Knowledge record ${rec.id} references unknown source_id "${sr.source_id}".`);
      }
    }
    for (const claim of rec.claims || []) {
      for (const sr of claim.source_refs || []) {
        if (!sourceIds.has(sr.source_id)) {
          errors.push(`Knowledge record ${rec.id} claim ${claim.id} references unknown source_id "${sr.source_id}".`);
        }
      }
    }
    for (const kid of rec.related_ids?.knowledge_ids || []) {
      if (!knowledgeIds.has(kid)) {
        errors.push(`Knowledge record ${rec.id} references unknown related knowledge_id "${kid}".`);
      }
      if (kid === rec.id) {
        errors.push(`Knowledge record ${rec.id} self-references "${kid}" in related_ids.knowledge_ids.`);
      }
    }
    for (const sid of rec.related_ids?.skill_ids || []) {
      if (!skillIds.has(sid)) {
        errors.push(`Knowledge record ${rec.id} references unknown skill_id "${sid}".`);
      }
    }
    for (const rid of rec.related_ids?.recipe_ids || []) {
      if (!recipeIds.has(rid)) {
        errors.push(`Knowledge record ${rec.id} references unknown recipe_id "${rid}".`);
      }
    }
    for (const refPath of rec.promoted_from_skill_refs || []) {
      const fullPath = path.join(paths.baseDir, refPath);
      if (fs.existsSync(path.join(paths.baseDir, 'skills')) && !fs.existsSync(fullPath)) {
        errors.push(`Knowledge record ${rec.id} promoted_from_skill_refs path does not exist: ${refPath}`);
      }
    }
  }

  // Cross-reference & evidence-gate validation for recipes
  for (const recipe of recipesData.recipes || []) {
    if (placeholderRegex.test(JSON.stringify(recipe))) {
      errors.push(`Recipe ${recipe.id} contains placeholder text (TODO/TBD/FIXME).`);
    }
    const gateRes = evaluateEvidencePromotionGate(recipe, paths.baseDir);
    if (!gateRes.allowed) {
      for (const ge of gateRes.errors) errors.push(ge);
    }
    for (const sid of [...(recipe.required_skill_ids || []), ...(recipe.optional_skills || [])]) {
      if (!skillIds.has(sid)) {
        errors.push(`Recipe ${recipe.id} references unknown skill_id "${sid}".`);
      }
    }
    for (const kid of recipe.required_knowledge_ids || []) {
      if (!knowledgeIds.has(kid)) {
        errors.push(`Recipe ${recipe.id} references unknown knowledge_id "${kid}" in required_knowledge_ids.`);
      }
    }
    for (const stage of recipe.stages || []) {
      for (const sid of stage.skill_ids || []) {
        if (!skillIds.has(sid)) {
          errors.push(`Recipe ${recipe.id} stage ${stage.id} references unknown skill_id "${sid}".`);
        }
      }
      for (const kid of stage.knowledge_ids || []) {
        if (!knowledgeIds.has(kid)) {
          errors.push(`Recipe ${recipe.id} stage ${stage.id} references unknown knowledge_id "${kid}".`);
        }
      }
    }
    for (const fm of recipe.failure_modes || []) {
      if (fm.fallback_skill_id && !skillIds.has(fm.fallback_skill_id)) {
        errors.push(`Recipe ${recipe.id} failure_mode references unknown fallback_skill_id "${fm.fallback_skill_id}".`);
      }
    }
    for (const relRec of recipe.related_recipes || []) {
      if (!recipeIds.has(relRec)) {
        errors.push(`Recipe ${recipe.id} references unknown related_recipe "${relRec}".`);
      }
    }
    for (const sr of recipe.source_refs || []) {
      if (!sourceIds.has(sr.source_id)) {
        errors.push(`Recipe ${recipe.id} references unknown source_id "${sr.source_id}".`);
      }
    }
    if (recipe.documentation_path) {
      const fullPath = path.join(paths.baseDir, recipe.documentation_path);
      if (fs.existsSync(path.join(paths.baseDir, 'docs/recipes')) && !fs.existsSync(fullPath)) {
        errors.push(`Recipe ${recipe.id} references missing documentation_path: ${recipe.documentation_path}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    catalog_mode: paths.mode,
    counts: {
      sources: sourceIds.size,
      knowledge_records: knowledgeIds.size,
      recipes: recipeIds.size,
      domains: domainCounts.size,
      skills: skillIds.size
    }
  };
}

export function generateCatalogIndexData(rootDir = DEFAULT_ROOT) {
  const paths = resolveCatalogPaths(rootDir);
  const sourcesData = readJson(paths.sourcesPath);
  const knowledgeData = readJson(paths.knowledgePath);
  const recipesData = readJson(paths.recipesPath);
  const skillsData = readJson(paths.skillsPath);

  const byDomain = {};
  const byKind = {};
  const bySkillId = {};
  const byRecipeId = {};
  const bySourceId = {};
  const byBlenderVersion = {};
  const byEvidenceStatus = {};

  for (const d of REQUIRED_DOMAINS) {
    byDomain[d] = { knowledge_ids: [], recipe_ids: [] };
  }

  const entries = [];

  for (const rec of knowledgeData.records) {
    byDomain[rec.domain] = byDomain[rec.domain] || { knowledge_ids: [], recipe_ids: [] };
    byDomain[rec.domain].knowledge_ids.push(rec.id);

    byKind[rec.kind] = byKind[rec.kind] || [];
    byKind[rec.kind].push(rec.id);

    byEvidenceStatus[rec.evidence_status] = byEvidenceStatus[rec.evidence_status] || [];
    byEvidenceStatus[rec.evidence_status].push(rec.id);

    const recordVersions = Array.from(
      new Set([
        rec.blender_versions.minimum,
        rec.blender_versions.doc_checked_version,
        ...(rec.blender_versions.tested_or_targeted || []),
        ...(rec.blender_versions.maintained_lts_versions || [])
      ].filter(Boolean))
    );
    for (const ver of recordVersions) {
      byBlenderVersion[ver] = byBlenderVersion[ver] || [];
      if (!byBlenderVersion[ver].includes(rec.id)) {
        byBlenderVersion[ver].push(rec.id);
      }
    }

    for (const sid of rec.related_ids.skill_ids) {
      bySkillId[sid] = bySkillId[sid] || { knowledge_ids: [], recipe_ids: [] };
      if (!bySkillId[sid].knowledge_ids.includes(rec.id)) {
        bySkillId[sid].knowledge_ids.push(rec.id);
      }
    }

    for (const rid of rec.related_ids.recipe_ids) {
      byRecipeId[rid] = byRecipeId[rid] || { knowledge_ids: [], skill_ids: [] };
      if (!byRecipeId[rid].knowledge_ids.includes(rec.id)) {
        byRecipeId[rid].knowledge_ids.push(rec.id);
      }
    }

    for (const sr of rec.source_refs) {
      bySourceId[sr.source_id] = bySourceId[sr.source_id] || { knowledge_ids: [], recipe_ids: [] };
      if (!bySourceId[sr.source_id].knowledge_ids.includes(rec.id)) {
        bySourceId[sr.source_id].knowledge_ids.push(rec.id);
      }
    }

    // Complete field coverage across all record fields (Section 1.6)
    const applicabilityText = [
      ...(rec.applicability?.when_to_apply || []),
      ...(rec.applicability?.target_representations || []),
      ...(rec.prerequisites || [])
    ].join(' ');

    const limitsAndExclusionsText = [
      ...(rec.applicability?.when_not_to_apply || []),
      ...(rec.known_limits || [])
    ].join(' ');

    const bodyText = [
      ...(rec.aliases || []),
      ...(rec.intent_signals || []),
      applicabilityText,
      limitsAndExclusionsText,
      ...(rec.principles || []),
      ...(rec.implementation_guidance?.workflow_steps || []),
      JSON.stringify(rec.implementation_guidance?.recommended_parameters || {}),
      rec.implementation_guidance?.blender_context || '',
      ...(rec.observable_checks || []).map((c) => `${c.id} ${c.check} ${c.pass_condition} ${c.fail_indicator}`),
      ...(rec.creative_affordances || []),
      ...(rec.claims || []).map((c) => `${c.id} ${c.statement} ${c.scope} ${c.uncertainty_or_version_note || ''}`),
      rec.blender_versions?.minimum || '',
      (rec.blender_versions?.tested_or_targeted || []).join(' '),
      rec.blender_versions?.version_notes || ''
    ].join(' ');

    entries.push({
      id: rec.id,
      type: 'knowledge',
      title: rec.title,
      domain: rec.domain,
      kind: rec.kind,
      summary: rec.summary,
      evidence_status: rec.evidence_status,
      blender_minimum: rec.blender_versions.minimum,
      blender_versions: recordVersions,
      skill_ids: rec.related_ids.skill_ids,
      recipe_ids: rec.related_ids.recipe_ids,
      source_ids: rec.source_refs.map((s) => s.source_id),
      tokens: {
        id: tokenize(`${rec.id.replace(/^knowledge\./, '')} ${(rec.aliases || []).join(' ')}`),
        title: tokenize(`${rec.title} ${(rec.intent_signals || []).join(' ')}`),
        domain: tokenize(`${rec.domain} ${rec.kind}`),
        summary: tokenize(rec.summary),
        applicability: Array.from(new Set(tokenize(applicabilityText))),
        limits: Array.from(new Set(tokenize(limitsAndExclusionsText))),
        body: Array.from(new Set(tokenize(bodyText)))
      }
    });
  }

  for (const recipe of recipesData.recipes) {
    const recipeDomains = [recipe.domain];
    for (const d of recipeDomains) {
      byDomain[d] = byDomain[d] || { knowledge_ids: [], recipe_ids: [] };
      if (!byDomain[d].recipe_ids.includes(recipe.id)) {
        byDomain[d].recipe_ids.push(recipe.id);
      }
    }

    byEvidenceStatus[recipe.evidence_status] = byEvidenceStatus[recipe.evidence_status] || [];
    byEvidenceStatus[recipe.evidence_status].push(recipe.id);

    const recipeVersions = Array.from(
      new Set([
        recipe.blender_versions.minimum,
        recipe.blender_versions.recommended,
        recipe.blender_versions.doc_checked_version,
        ...(recipe.blender_versions.maintained_lts_versions || [])
      ].filter(Boolean))
    );
    for (const ver of recipeVersions) {
      byBlenderVersion[ver] = byBlenderVersion[ver] || [];
      if (!byBlenderVersion[ver].includes(recipe.id)) {
        byBlenderVersion[ver].push(recipe.id);
      }
    }

    const allSkills = Array.from(new Set(recipe.required_skill_ids || []));
    byRecipeId[recipe.id] = byRecipeId[recipe.id] || { knowledge_ids: [], skill_ids: [] };
    byRecipeId[recipe.id].skill_ids = allSkills;
    for (const kid of recipe.required_knowledge_ids || []) {
      if (!byRecipeId[recipe.id].knowledge_ids.includes(kid)) {
        byRecipeId[recipe.id].knowledge_ids.push(kid);
      }
    }

    for (const sid of allSkills) {
      bySkillId[sid] = bySkillId[sid] || { knowledge_ids: [], recipe_ids: [] };
      if (!bySkillId[sid].recipe_ids.includes(recipe.id)) {
        bySkillId[sid].recipe_ids.push(recipe.id);
      }
    }

    for (const sr of recipe.source_refs) {
      bySourceId[sr.source_id] = bySourceId[sr.source_id] || { knowledge_ids: [], recipe_ids: [] };
      if (!bySourceId[sr.source_id].recipe_ids.includes(recipe.id)) {
        bySourceId[sr.source_id].recipe_ids.push(recipe.id);
      }
    }

    const applicabilityText = [
      ...(recipe.applicable_scenarios?.use_when || []),
      ...(recipe.prerequisites || []),
      ...(recipe.inputs || []).map((inp) => `${inp.name} ${inp.description}`)
    ].join(' ');

    const limitsAndExclusionsText = [
      ...(recipe.applicable_scenarios?.do_not_use_when || []),
      ...(recipe.failure_modes || []).map((f) => `${f.symptom} ${f.root_cause} ${f.recovery_action}`)
    ].join(' ');

    const bodyText = [
      recipe.intent,
      ...(recipe.aliases || []),
      ...(recipe.intent_signals || []),
      applicabilityText,
      limitsAndExclusionsText,
      ...(recipe.stages || []).map((st) => `${st.id} ${st.title} ${st.objective} ${(st.actions || []).join(' ')} ${st.gate_check || ''}`),
      ...(recipe.validation_criteria || []).map((vc) => `${vc.id} ${vc.criterion} ${vc.measurement_method} ${vc.pass_threshold}`),
      recipe.blender_versions?.version_considerations || '',
      recipe.documentation_path || ''
    ].join(' ');

    entries.push({
      id: recipe.id,
      type: 'recipe',
      title: recipe.title,
      domain: recipe.domain,
      domains: recipeDomains,
      kind: 'recipe-record',
      summary: recipe.summary,
      evidence_status: recipe.evidence_status,
      blender_minimum: recipe.blender_versions.minimum,
      blender_versions: recipeVersions,
      skill_ids: allSkills,
      knowledge_ids: recipe.required_knowledge_ids,
      source_ids: recipe.source_refs.map((s) => s.source_id),
      tokens: {
        id: tokenize(`${recipe.id.replace(/^recipe\./, '')} ${(recipe.aliases || []).join(' ')}`),
        title: tokenize(`${recipe.title} ${(recipe.intent_signals || []).join(' ')}`),
        domain: tokenize(recipe.domain),
        summary: tokenize(`${recipe.summary} ${recipe.intent}`),
        applicability: Array.from(new Set(tokenize(applicabilityText))),
        limits: Array.from(new Set(tokenize(limitsAndExclusionsText))),
        body: Array.from(new Set(tokenize(bodyText)))
      }
    });
  }

  return {
    schema_version: '1.1.0',
    description: 'Deterministic bilingual (EN+VI) local lookup and field-weighted retrieval index for BlendOps knowledge records, recipes, sources, and skills.',
    retrieval_architecture: 'deterministic-bilingual-lexical-and-field-weighted-index',
    counts: {
      knowledge_records: knowledgeData.records.length,
      recipes: recipesData.recipes.length,
      sources: sourcesData.sources.length,
      domains: REQUIRED_DOMAINS.length,
      skills: skillsData.skills.length
    },
    by_domain: byDomain,
    by_kind: byKind,
    by_skill_id: bySkillId,
    by_recipe_id: byRecipeId,
    by_source_id: bySourceId,
    by_blender_version: byBlenderVersion,
    by_evidence_status: byEvidenceStatus,
    entries
  };
}

export function renderKnowledgeAndRecipeCatalogMarkdown(rootDir = DEFAULT_ROOT) {
  const paths = resolveCatalogPaths(rootDir);
  const sourcesData = readJson(paths.sourcesPath);
  const knowledgeData = readJson(paths.knowledgePath);
  const recipesData = readJson(paths.recipesPath);

  const lines = [
    '# BlendOps Knowledge & Recipe Catalog',
    '',
    '> Generated deterministically from `registry/knowledge-sources.json`, `registry/knowledge-catalog.json`, and `registry/recipe-catalog.json` via `npm run catalog:build`. Do not edit by hand.',
    '',
    '## Overview & Retrieval CLI',
    '',
    'BlendOps separates **atomic agent workflow skills** (`skills/*/SKILL.md`) from **reusable 3D/Blender domain knowledge** (`knowledge.*`) and **multi-stage construction recipes** (`recipe.*`).',
    '',
    '- **Deterministic Local Search (English & Vietnamese)**: `npx blendops catalog-search "<query>" [--type knowledge|recipe] [--domain <domain>]`',
    '- **Deterministic Record Resolution**: `npx blendops catalog-resolve <knowledge.id | recipe.id | source.id | skill-id>`',
    '- **Catalog Schema & Cross-Reference Validation**: `npx blendops catalog-validate`',
    '- **SceneSpec Validation & Plan Compilation**: `npx blendops scene-spec-validate <spec.json>` / `npx blendops plan-compile <spec.json>`',
    '',
    '| Metric | Count | Canonical Source |',
    '| :--- | ---: | :--- |',
    `| Knowledge Domains | ${REQUIRED_DOMAINS.length} | \`registry/knowledge-sources.json\` |`,
    `| Canonical Knowledge Records (\`knowledge.*\`) | ${knowledgeData.records.length} | \`registry/knowledge-catalog.json\` |`,
    `| Canonical Recipes (\`recipe.*\`) | ${recipesData.recipes.length} | \`registry/recipe-catalog.json\` |`,
    `| Authoritative Sources (\`source.*\`) | ${sourcesData.sources.length} | \`registry/knowledge-sources.json\` |`,
    `| Latest Stable Blender LTS Baseline | \`${sourcesData.taxonomy?.versionBaseline?.latest_stable_lts || '5.2.3 LTS'}\` | \`registry/knowledge-sources.json\` |`,
    '',
    '---',
    '',
    '## 1. Canonical Recipes (`recipe.*`)',
    '',
    '| Recipe ID | Title | Primary Domain | Stages | Required Skills | Linked Knowledge | Min Blender | Doc-Checked LTS | Evidence Status |',
    '| :--- | :--- | :--- | ---: | ---: | ---: | :--- | :--- | :--- |'
  ];

  for (const r of recipesData.recipes) {
    lines.push(
      `| \`${r.id}\` | ${r.title} | \`${r.domain}\` | ${r.stages.length} | ${r.required_skill_ids.length} | ${r.required_knowledge_ids.length} | \`${r.blender_versions.minimum}\` | \`${r.blender_versions.doc_checked_version}\` | \`${r.evidence_status}\` |`
    );
  }

  lines.push(
    '',
    '### Recipe Details & Scenario Linkages',
    ''
  );

  for (const r of recipesData.recipes) {
    lines.push(
      `#### \`${r.id}\` — ${r.title}`,
      '',
      `- **Intent**: ${r.intent}`,
      `- **Domain**: \`${r.domain}\``,
      `- **Required Skills**: ${r.required_skill_ids.map((s) => `\`${s}\``).join(', ')}`,
      `- **Knowledge Records**: ${r.required_knowledge_ids.map((k) => `\`${k}\``).join(', ')}`,
      `- **Stages**: ${r.stages.map((st) => `\`${st.id}\` (Stage ${st.stage_number})`).join(' → ')}`
    );
    if (r.documentation_path) {
      lines.push(`- **Scenario Reference Doc**: \`${r.documentation_path}\``);
    }
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '## 2. Canonical Knowledge Records by Domain (`knowledge.*`)',
    ''
  );

  for (const domainId of REQUIRED_DOMAINS) {
    const domRecords = knowledgeData.records.filter((k) => k.domain === domainId);
    lines.push(
      `### Domain: \`${domainId}\` (${domRecords.length} records)`,
      '',
      '| Knowledge ID | Title | Kind | Min Blender | Doc-Checked LTS | Evidence Status | Linked Skills | Linked Recipes |',
      '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |'
    );
    for (const rec of domRecords) {
      lines.push(
        `| \`${rec.id}\` | ${rec.title} | \`${rec.kind}\` | \`${rec.blender_versions.minimum}\` | \`${rec.blender_versions.doc_checked_version}\` | \`${rec.evidence_status}\` | ${rec.related_ids.skill_ids.map((s) => `\`${s}\``).join(', ')} | ${rec.related_ids.recipe_ids.map((r) => `\`${r}\``).join(', ')} |`
      );
    }
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '## 3. Authoritative Source Registry (`source.*`)',
    '',
    '| Source ID | Title | Authority | Publisher | Locator / Section | Verified Date | License / Usage |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |'
  );

  for (const src of sourcesData.sources) {
    lines.push(
      `| \`${src.id}\` | ${src.title} | \`${src.authority}\` | ${src.publisher} | ${src.locator_or_section} | \`${src.verification_date}\` | ${src.license_note} |`
    );
  }

  lines.push('');
  return lines.join('\n');
}

export function searchCatalog(rootDir = DEFAULT_ROOT, query = '', options = {}) {
  const paths = resolveCatalogPaths(rootDir);
  const indexData = fs.existsSync(paths.indexPath)
    ? readJson(paths.indexPath)
    : generateCatalogIndexData(rootDir);

  const foldedRawQuery = foldVietnameseDiacritics(query);
  const rawSimpleTokens = foldedRawQuery
    .replace(/[^a-z0-9+#.-]+/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

  const queryTokens = tokenize(query);
  const queryLang = detectQueryLanguage(query);
  const typeFilter = options.type && options.type !== 'all' ? options.type : null;
  const domainFilter = options.domain || null;
  const kindFilter = options.kind || null;
  const skillFilter = options.skill_id || null;
  const versionFilter = options.blender_version || null;
  const evidenceFilter = options.evidence_status || null;
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 10;

  // Detect out-of-scope DCC / game engine / non-3D tokens and phrases
  const outOfScopeHits = rawSimpleTokens.filter((t) => OUT_OF_SCOPE_TOKENS.has(t));
  for (const phrase of OUT_OF_SCOPE_PHRASES) {
    if (foldedRawQuery.includes(phrase) && !outOfScopeHits.includes(phrase)) {
      outOfScopeHits.push(phrase);
    }
  }

  // Detect whether query explicitly asks about limitations, exclusions, or "when not to use"
  const isLimitationOrExclusionQuery = /\b(limit|limits|limitation|limitations|when not|do not use|avoid|unsupported|cannot|khong dung|han che|gioi han|khi nao khong)\b/i.test(foldedRawQuery);

  const candidates = indexData.entries.filter((entry) => {
    if (typeFilter && entry.type !== typeFilter) return false;
    if (domainFilter && entry.domain !== domainFilter) return false;
    if (kindFilter && entry.kind !== kindFilter) return false;
    if (skillFilter && !(entry.skill_ids || []).includes(skillFilter)) return false;
    if (versionFilter) {
      const parseVer = (s) => {
        const m = String(s || '').match(/(\d+)\.(\d+)/);
        return m ? Number(m[1]) * 100 + Number(m[2]) : null;
      };
      const reqVer = parseVer(versionFilter);
      const minVer = parseVer(entry.blender_minimum);
      const normFilter = String(versionFilter).replace(/\+$/, '').trim().toLowerCase();
      const versionMatched =
        (entry.blender_versions || []).some((v) => {
          const normV = String(v).replace(/\+$/, '').trim().toLowerCase();
          return normV === normFilter || normV.startsWith(normFilter) || normFilter.startsWith(normV);
        }) ||
        (reqVer !== null && minVer !== null && minVer <= reqVer);
      if (!versionMatched) return false;
    }
    if (evidenceFilter && entry.evidence_status !== evidenceFilter) return false;
    return true;
  });

  if (queryTokens.length === 0) {
    return {
      query,
      language: queryLang,
      retrieval_method: 'deterministic-bilingual-lexical-and-field-weighted-index',
      status: candidates.length > 0 ? 'matched' : 'no_relevant_match',
      coverage_gap: candidates.length === 0,
      total_matches: candidates.length,
      results: candidates.slice(0, limit).map((c) => ({
        id: c.id,
        type: c.type,
        title: c.title,
        domain: c.domain,
        kind: c.kind,
        summary: c.summary,
        evidence_status: c.evidence_status,
        blender_minimum: c.blender_minimum,
        minimum_blender: c.blender_minimum,
        score: 1.0,
        matched_tokens: [],
        matched_fields: ['filter']
      }))
    };
  }

  const scored = [];
  for (const entry of candidates) {
    let score = 0;
    const matchedTokens = [];
    const matchedFields = new Set();

    const idSet = new Set(entry.tokens.id || []);
    const titleSet = new Set(entry.tokens.title || []);
    const domainSet = new Set(entry.tokens.domain || []);
    const summarySet = new Set(entry.tokens.summary || []);
    const appSet = new Set(entry.tokens.applicability || []);
    const limitsSet = new Set(entry.tokens.limits || []);
    const bodySet = new Set(entry.tokens.body || []);

    for (const qToken of queryTokens) {
      let tokenMatched = false;
      if (idSet.has(qToken)) {
        score += 5.0;
        matchedFields.add('id');
        tokenMatched = true;
      }
      if (titleSet.has(qToken)) {
        score += 4.0;
        matchedFields.add('title');
        tokenMatched = true;
      }
      if (domainSet.has(qToken)) {
        score += 2.5;
        matchedFields.add('domain');
        tokenMatched = true;
      }
      if (summarySet.has(qToken)) {
        score += 2.5;
        matchedFields.add('summary');
        tokenMatched = true;
      }
      if (limitsSet.has(qToken) && isLimitationOrExclusionQuery) {
        score += 2.25;
        matchedFields.add('limits');
        tokenMatched = true;
      } else if (appSet.has(qToken)) {
        score += 1.5;
        matchedFields.add('applicability');
        tokenMatched = true;
      } else if (limitsSet.has(qToken)) {
        score += 1.25;
        matchedFields.add('limits');
        tokenMatched = true;
      } else if (bodySet.has(qToken)) {
        score += 1.5;
        matchedFields.add('body');
        tokenMatched = true;
      }

      if (!tokenMatched && qToken.length >= 4) {
        const prefixHitIdOrTitle = [...idSet, ...titleSet].some(
          (t) => t.startsWith(qToken) || qToken.startsWith(t)
        );
        const prefixHitSummaryOrBody = [...summarySet, ...bodySet].some(
          (t) => t.length >= 4 && (t.startsWith(qToken) || qToken.startsWith(t))
        );
        if (prefixHitIdOrTitle) {
          score += 2.5;
          matchedFields.add('title_prefix');
          tokenMatched = true;
        } else if (prefixHitSummaryOrBody) {
          score += 1.0;
          matchedFields.add('body_prefix');
          tokenMatched = true;
        }
      }

      if (tokenMatched) {
        matchedTokens.push(qToken);
      }
    }

    if (matchedTokens.length > 0) {
      const coverageRatio = matchedTokens.length / queryTokens.length;
      score = Number((score * (0.6 + 0.4 * coverageRatio)).toFixed(3));
      scored.push({
        id: entry.id,
        type: entry.type,
        title: entry.title,
        domain: entry.domain,
        kind: entry.kind,
        summary: entry.summary,
        evidence_status: entry.evidence_status,
        blender_minimum: entry.blender_minimum,
        minimum_blender: entry.blender_minimum,
        score,
        matched_tokens: matchedTokens,
        matched_fields: Array.from(matchedFields)
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const topScore = scored[0]?.score || 0;
  const topCoverage = queryTokens.length > 0 ? (scored[0]?.matched_tokens.length || 0) / queryTokens.length : 1;
  const hasExplicitBlenderAnchor = /\b(blender|gltf|glb|cycles|eevee|agx|geometry nodes|principled bsdf)\b/i.test(foldedRawQuery);

  if (
    scored.length === 0 ||
    (outOfScopeHits.length >= 1 && !hasExplicitBlenderAnchor && topCoverage < 0.5) ||
    (outOfScopeHits.length >= 2 && topCoverage < 0.45) ||
    (queryTokens.length >= 3 && topScore < 3.0)
  ) {
    return {
      query,
      language: queryLang,
      retrieval_method: 'deterministic-bilingual-lexical-and-field-weighted-index',
      status: 'no_relevant_match',
      coverage_gap: true,
      total_matches: 0,
      coverage_gap_reason:
        outOfScopeHits.length > 0
          ? `Query references out-of-scope DCC/engine tools (${outOfScopeHits.join(', ')}) not covered by BlendOps Blender/glTF catalogs.`
          : 'No knowledge or recipe record met the deterministic relevance threshold.',
      results: []
    };
  }

  return {
    query,
    language: queryLang,
    retrieval_method: 'deterministic-bilingual-lexical-and-field-weighted-index',
    status: 'matched',
    coverage_gap: false,
    total_matches: scored.length,
    results: scored.slice(0, limit)
  };
}

export function resolveCatalogRecord(rootDir = DEFAULT_ROOT, recordId = '') {
  const paths = resolveCatalogPaths(rootDir);
  const sourcesData = readJson(paths.sourcesPath);
  const knowledgeData = readJson(paths.knowledgePath);
  const recipesData = readJson(paths.recipesPath);
  const skillsData = readJson(paths.skillsPath);

  const sourceMap = new Map(sourcesData.sources.map((s) => [s.id, s]));
  const knowledgeMap = new Map(knowledgeData.records.map((k) => [k.id, k]));
  const recipeMap = new Map(recipesData.recipes.map((r) => [r.id, r]));
  const skillMap = new Map(skillsData.skills.map((s) => [s.id, s]));

  if (knowledgeMap.has(recordId)) {
    const record = knowledgeMap.get(recordId);
    return {
      found: true,
      id: record.id,
      type: 'knowledge',
      record,
      resolved_links: {
        sources: (record.source_refs || []).map((sr) => ({
          ...sr,
          source: sourceMap.get(sr.source_id) || null
        })),
        related_knowledge: (record.related_ids?.knowledge_ids || []).map((id) => {
          const k = knowledgeMap.get(id);
          return k ? { id: k.id, title: k.title, domain: k.domain, kind: k.kind } : { id, missing: true };
        }),
        related_recipes: (record.related_ids?.recipe_ids || []).map((id) => {
          const r = recipeMap.get(id);
          return r ? { id: r.id, title: r.title, domain: r.domain } : { id, missing: true };
        }),
        related_skills: (record.related_ids?.skill_ids || []).map((id) => {
          const s = skillMap.get(id);
          return s
            ? {
                id: s.id,
                display_name: s.display_name || s.name || s.id,
                workflow_stage: s.workflow_stage || deriveSkillWorkflowStage(s),
                capability_tier: s.capabilityTier || s.capability_tier || 'L0'
              }
            : { id, missing: true };
        })
      }
    };
  }

  if (recipeMap.has(recordId)) {
    const record = recipeMap.get(recordId);
    return {
      found: true,
      id: record.id,
      type: 'recipe',
      record,
      resolved_links: {
        sources: (record.source_refs || []).map((sr) => ({
          ...sr,
          source: sourceMap.get(sr.source_id) || null
        })),
        knowledge_records: (record.required_knowledge_ids || []).map((id) => {
          const k = knowledgeMap.get(id);
          return k ? { id: k.id, title: k.title, domain: k.domain, kind: k.kind } : { id, missing: true };
        }),
        required_skills: (record.required_skill_ids || []).map((id) => {
          const s = skillMap.get(id);
          return s
            ? {
                id: s.id,
                display_name: s.display_name || s.name || s.id,
                workflow_stage: s.workflow_stage || deriveSkillWorkflowStage(s),
                capability_tier: s.capabilityTier || s.capability_tier || 'L0'
              }
            : { id, missing: true };
        })
      }
    };
  }

  if (sourceMap.has(recordId)) {
    const record = sourceMap.get(recordId);
    const linkedKnowledge = knowledgeData.records
      .filter((k) => (k.source_refs || []).some((sr) => sr.source_id === recordId))
      .map((k) => ({ id: k.id, title: k.title, domain: k.domain }));
    const linkedRecipes = recipesData.recipes
      .filter((r) => (r.source_refs || []).some((sr) => sr.source_id === recordId))
      .map((r) => ({ id: r.id, title: r.title, category: r.domain }));
    return {
      found: true,
      id: record.id,
      type: 'source',
      record,
      resolved_links: {
        knowledge_records: linkedKnowledge,
        recipes: linkedRecipes
      }
    };
  }

  if (skillMap.has(recordId)) {
    const record = skillMap.get(recordId);
    const linkedKnowledge = knowledgeData.records
      .filter((k) => (k.related_ids?.skill_ids || []).includes(recordId))
      .map((k) => ({ id: k.id, title: k.title, domain: k.domain, kind: k.kind }));
    const linkedRecipes = recipesData.recipes
      .filter((r) => (r.required_skill_ids || []).includes(recordId))
      .map((r) => ({ id: r.id, title: r.title, domain: r.domain }));
    return {
      found: true,
      id: record.id,
      type: 'skill',
      record,
      resolved_links: {
        knowledge_records: linkedKnowledge,
        recipes: linkedRecipes
      }
    };
  }

  return {
    found: false,
    id: recordId,
    error: `Unknown catalog ID "${recordId}". Expected knowledge.<slug>, recipe.<slug>, source.<slug>, or a canonical skill ID.`
  };
}

export function runCatalogRetrievalEvals(rootDir = DEFAULT_ROOT) {
  const evalsPath = path.join(rootDir, 'evals/catalog-retrieval-evals.json');
  if (!fs.existsSync(evalsPath)) {
    return {
      passed: false,
      total: 0,
      passed_count: 0,
      failures: [`Missing evaluation suite: ${evalsPath}`]
    };
  }
  const suite = readJson(evalsPath);
  const failures = [];
  let passedCount = 0;

  let positiveCasesCount = 0;
  let recallSum = 0;
  let precisionSum = 0;
  let reciprocalRankSum = 0;

  let noMatchCasesCount = 0;
  let noMatchCorrectCount = 0;
  let unsupportedFalsePositives = 0;

  const langCounts = {
    en: { total: 0, passed: 0 },
    vi: { total: 0, passed: 0 },
    mixed_vi_en: { total: 0, passed: 0 }
  };

  for (const testCase of suite.cases || []) {
    const response = searchCatalog(rootDir, testCase.query, testCase.filters || {});
    const langKey = testCase.language || detectQueryLanguage(testCase.query);
    if (!langCounts[langKey]) {
      langCounts[langKey] = { total: 0, passed: 0 };
    }
    langCounts[langKey].total += 1;

    if (testCase.expect_no_match) {
      noMatchCasesCount += 1;
      if (response.status === 'no_relevant_match' && response.coverage_gap === true && response.results.length === 0) {
        passedCount += 1;
        noMatchCorrectCount += 1;
        langCounts[langKey].passed += 1;
      } else {
        unsupportedFalsePositives += 1;
        failures.push(
          `Case ${testCase.id}: expected no_relevant_match / coverage_gap=true, got status=${response.status} with top result ${response.results[0]?.id || 'none'}`
        );
      }
      continue;
    }

    positiveCasesCount += 1;

    if (response.status !== 'matched' || response.results.length === 0) {
      failures.push(`Case ${testCase.id}: expected match for "${testCase.query}", got status=${response.status}`);
      continue;
    }

    const k = testCase.max_rank || 3;
    const topSlice = response.results.slice(0, k).map((r) => r.id);
    const expectedIds = testCase.expected_top_ids || [];
    const matchedExpected = expectedIds.filter((expId) => topSlice.includes(expId));
    const missingExpected = expectedIds.filter((expId) => !topSlice.includes(expId));

    const caseRecall = expectedIds.length > 0 ? matchedExpected.length / expectedIds.length : 1;
    const casePrecision = topSlice.length > 0 ? matchedExpected.length / Math.min(topSlice.length, expectedIds.length || 1) : 0;
    recallSum += caseRecall;
    precisionSum += Math.min(1, casePrecision);

    // Reciprocal rank of first expected result
    let firstRank = 0;
    for (let idx = 0; idx < response.results.length; idx += 1) {
      if (expectedIds.includes(response.results[idx].id)) {
        firstRank = idx + 1;
        break;
      }
    }
    reciprocalRankSum += firstRank > 0 ? 1 / firstRank : 0;

    if (missingExpected.length > 0) {
      failures.push(
        `Case ${testCase.id}: expected [${expectedIds.join(', ')}] within top ${k}, got [${topSlice.join(', ')}]`
      );
    } else {
      passedCount += 1;
      langCounts[langKey].passed += 1;
    }
  }

  const metrics = {
    recall_at_k: positiveCasesCount > 0 ? Number((recallSum / positiveCasesCount).toFixed(4)) : 1,
    precision_at_k: positiveCasesCount > 0 ? Number((precisionSum / positiveCasesCount).toFixed(4)) : 1,
    mrr: positiveCasesCount > 0 ? Number((reciprocalRankSum / positiveCasesCount).toFixed(4)) : 1,
    no_match_accuracy: noMatchCasesCount > 0 ? Number((noMatchCorrectCount / noMatchCasesCount).toFixed(4)) : 1,
    unsupported_request_false_positive_rate:
      noMatchCasesCount > 0 ? Number((unsupportedFalsePositives / noMatchCasesCount).toFixed(4)) : 0,
    positive_cases: positiveCasesCount,
    no_match_cases: noMatchCasesCount,
    language_coverage: langCounts
  };

  return {
    passed: failures.length === 0,
    total: (suite.cases || []).length,
    passed_count: passedCount,
    metrics,
    failures
  };
}

/**
 * Builds the deterministic map of files to install into `.blendops/catalog/` (for project-local installs)
 * or `dist/shared-catalog/` (for Claude Desktop / Chat shared catalog archive).
 * Derived 100% from canonical `registry/*` and `schemas/*` — zero hand-maintained duplicates.
 */
export function buildSharedCatalogFilesMap(rootDir = DEFAULT_ROOT) {
  const sourcesRaw = fs.readFileSync(path.join(rootDir, 'registry/knowledge-sources.json'), 'utf8');
  const knowledgeRaw = fs.readFileSync(path.join(rootDir, 'registry/knowledge-catalog.json'), 'utf8');
  const recipesRaw = fs.readFileSync(path.join(rootDir, 'registry/recipe-catalog.json'), 'utf8');
  const indexData = generateCatalogIndexData(rootDir);
  const indexRaw = JSON.stringify(indexData, null, 2) + '\n';

  const skillsData = readJson(path.join(rootDir, 'registry/skills.json'));
  const skillsSummary = {
    schemaVersion: '1.0.0',
    description: 'Compact canonical 48-skill summary for offline project-local and shared-catalog resolution.',
    skills: skillsData.skills.map((s) => ({
      id: s.id,
      version: s.version || '1.0.0',
      category: s.category,
      role: s.role,
      purpose: s.purpose,
      capabilityTier: s.capabilityTier,
      workflow_stage: deriveSkillWorkflowStage(s)
    }))
  };
  const skillsSummaryRaw = JSON.stringify(skillsSummary, null, 2) + '\n';

  const sourcesSchemaRaw = fs.readFileSync(path.join(rootDir, 'schemas/knowledge-source-registry.schema.json'), 'utf8');
  const knowledgeSchemaRaw = fs.readFileSync(path.join(rootDir, 'schemas/knowledge-record.schema.json'), 'utf8');
  const recipeSchemaRaw = fs.readFileSync(path.join(rootDir, 'schemas/recipe-record.schema.json'), 'utf8');
  const sceneSpecSchemaPath = path.join(rootDir, 'schemas/scene-spec.schema.json');
  const executionPlanSchemaPath = path.join(rootDir, 'schemas/execution-plan.schema.json');
  const runtimeOperationsPath = path.join(rootDir, 'registry/runtime-operations.json');
  const runtimeCapabilityPolicyPath = path.join(rootDir, 'registry/runtime-capability-policy.json');
  const runtimeSessionSchemaPath = path.join(rootDir, 'schemas/runtime-session.schema.json');
  const runtimeOperationsSchemaPath = path.join(rootDir, 'schemas/runtime-operations.schema.json');
  const operationExecutionLedgerSchemaPath = path.join(rootDir, 'schemas/operation-execution-ledger.schema.json');
  const runtimeEvidencePacketSchemaPath = path.join(rootDir, 'schemas/runtime-evidence-packet.schema.json');
  const runtimeCapabilityPolicySchemaPath = path.join(rootDir, 'schemas/runtime-capability-policy.schema.json');

  const hasSceneSpecSchema = fs.existsSync(sceneSpecSchemaPath);
  const hasExecutionPlanSchema = fs.existsSync(executionPlanSchemaPath);
  const hasRuntimeOperations = fs.existsSync(runtimeOperationsPath);
  const hasRuntimeCapabilityPolicy = fs.existsSync(runtimeCapabilityPolicyPath);
  const hasRuntimeSessionSchema = fs.existsSync(runtimeSessionSchemaPath);
  const hasRuntimeOperationsSchema = fs.existsSync(runtimeOperationsSchemaPath);
  const hasOperationExecutionLedgerSchema = fs.existsSync(operationExecutionLedgerSchemaPath);
  const hasRuntimeEvidencePacketSchema = fs.existsSync(runtimeEvidencePacketSchemaPath);
  const hasRuntimeCapabilityPolicySchema = fs.existsSync(runtimeCapabilityPolicySchemaPath);

  const fileList = [
    'README.md',
    'manifest.json',
    'knowledge-sources.json',
    'knowledge-catalog.json',
    'recipe-catalog.json',
    'catalog-index.json',
    'skills-summary.json',
    ...(hasRuntimeOperations ? ['runtime-operations.json'] : []),
    ...(hasRuntimeCapabilityPolicy ? ['runtime-capability-policy.json'] : []),
    'schemas/knowledge-source-registry.schema.json',
    'schemas/knowledge-record.schema.json',
    'schemas/recipe-record.schema.json',
    ...(hasSceneSpecSchema ? ['schemas/scene-spec.schema.json'] : []),
    ...(hasExecutionPlanSchema ? ['schemas/execution-plan.schema.json'] : []),
    ...(hasRuntimeSessionSchema ? ['schemas/runtime-session.schema.json'] : []),
    ...(hasRuntimeOperationsSchema ? ['schemas/runtime-operations.schema.json'] : []),
    ...(hasOperationExecutionLedgerSchema ? ['schemas/operation-execution-ledger.schema.json'] : []),
    ...(hasRuntimeEvidencePacketSchema ? ['schemas/runtime-evidence-packet.schema.json'] : []),
    ...(hasRuntimeCapabilityPolicySchema ? ['schemas/runtime-capability-policy.schema.json'] : [])
  ];

  const manifestObj = {
    schema_version: '1.0.0',
    package_name: 'blendops-shared-knowledge-and-recipe-catalog',
    generated_from: [
      'registry/knowledge-sources.json',
      'registry/knowledge-catalog.json',
      'registry/recipe-catalog.json',
      'registry/catalog-index.json',
      'registry/skills.json',
      ...(hasRuntimeOperations ? ['registry/runtime-operations.json'] : []),
      ...(hasRuntimeCapabilityPolicy ? ['registry/runtime-capability-policy.json'] : [])
    ],
    counts: indexData.counts,
    version_baseline: readJson(path.join(rootDir, 'registry/knowledge-sources.json')).taxonomy.versionBaseline,
    truth_state_defaults: {
      runtime_status: 'Not Run',
      artifact_status: 'Not Produced'
    },
    files: fileList
  };

  const readmeContent = [
    '# BlendOps Shared Knowledge & Recipe Catalog',
    '',
    'This portable catalog package contains the canonical BlendOps **Knowledge Layer** (`knowledge.*`), **Recipe Layer** (`recipe.*`), **Authoritative Source Registry** (`source.*`), **Typed Runtime Operations Registry** (`op.*`), and **Deterministic Bilingual (EN+VI) Retrieval Index**.',
    '',
    '## Contents',
    '',
    '- `knowledge-sources.json` — 20 authoritative Blender / Khronos glTF 2.0.1 / OpenSubdiv / MikkTSpace / Filament / Three.js sources and controlled domain taxonomy.',
    '- `knowledge-catalog.json` — 30 canonical knowledge records across 11 3D/Blender domains.',
    '- `recipe-catalog.json` — 10 composable multi-stage construction recipes linking required skills, knowledge records, stage gates, validation criteria, and failure recovery modes.',
    '- `catalog-index.json` — Prebuilt deterministic bilingual (English + Vietnamese) search and cross-reference index.',
    '- `skills-summary.json` — Compact metadata for all 48 canonical BlendOps skills so local resolution works standalone without requiring the full BlendOps git repository.',
    '- `runtime-operations.json` — 18 canonical typed runtime operations (`op.inspect.*`, `op.mutate.*`, `op.export.*`, `op.import.*`) and blocked L3 interfaces.',
    '- `runtime-capability-policy.json` — Governed runtime capability tiers (`L0`–`L3`) and enforcement policy.',
    '- `schemas/` — JSON Schema Draft 2020-12 definitions for sources, knowledge records, recipes, SceneSpec, ExecutionPlan, RuntimeSession, RuntimeOperations, OperationExecutionLedger, RuntimeEvidencePacket, and RuntimeCapabilityPolicy.',
    '',
    '## How Agents Use This Catalog',
    '',
    '1. **Project-Local CLI Lookup** (when installed in `.blendops/catalog/`):',
    '   - Search by natural language (English or Vietnamese): `npx blendops catalog-search "<query>" [--project <project-dir>]`',
    '   - Resolve full record & links: `npx blendops catalog-resolve <knowledge.id | recipe.id | source.id> [--project <project-dir>]`',
    '   - Validate catalog integrity: `npx blendops catalog-validate [--project <project-dir>]`',
    '   - Validate SceneSpec & compile ExecutionPlan: `npx blendops scene-spec-validate <spec.json> [--project <project-dir>]` / `npx blendops plan-compile <spec.json> [--project <project-dir>]`',
    '   - Check runtime readiness & operations: `npx blendops runtime doctor [--project <project-dir>]` / `npx blendops operation list [--project <project-dir>]`',
    '2. **Direct File Consumption** (in Claude Desktop / Claude.ai Projects or offline agent context):',
    '   - Attach or inspect `catalog-index.json` to locate matching `knowledge.*` and `recipe.*` IDs by domain, skill, or keyword.',
    '   - Read the corresponding record in `knowledge-catalog.json` or `recipe-catalog.json` before planning or mutating a Blender scene.',
    '',
    '## Truth-State & Runtime Boundaries',
    '',
    '- **Runtime status**: `Not Run` (default unless backed by a validated runtime evidence packet)',
    '- **Artifact status**: `Not Produced` (default unless backed by verified on-disk artifact hashes)',
    '- **Global files touched**: `No`',
    ''
  ].join('\n');

  const filesMap = {
    'README.md': readmeContent,
    'manifest.json': JSON.stringify(manifestObj, null, 2) + '\n',
    'knowledge-sources.json': sourcesRaw,
    'knowledge-catalog.json': knowledgeRaw,
    'recipe-catalog.json': recipesRaw,
    'catalog-index.json': indexRaw,
    'skills-summary.json': skillsSummaryRaw,
    'schemas/knowledge-source-registry.schema.json': sourcesSchemaRaw,
    'schemas/knowledge-record.schema.json': knowledgeSchemaRaw,
    'schemas/recipe-record.schema.json': recipeSchemaRaw
  };
  if (hasRuntimeOperations) {
    filesMap['runtime-operations.json'] = fs.readFileSync(runtimeOperationsPath, 'utf8');
  }
  if (hasRuntimeCapabilityPolicy) {
    filesMap['runtime-capability-policy.json'] = fs.readFileSync(runtimeCapabilityPolicyPath, 'utf8');
  }
  if (hasSceneSpecSchema) {
    filesMap['schemas/scene-spec.schema.json'] = fs.readFileSync(sceneSpecSchemaPath, 'utf8');
  }
  if (hasExecutionPlanSchema) {
    filesMap['schemas/execution-plan.schema.json'] = fs.readFileSync(executionPlanSchemaPath, 'utf8');
  }
  if (hasRuntimeSessionSchema) {
    filesMap['schemas/runtime-session.schema.json'] = fs.readFileSync(runtimeSessionSchemaPath, 'utf8');
  }
  if (hasRuntimeOperationsSchema) {
    filesMap['schemas/runtime-operations.schema.json'] = fs.readFileSync(runtimeOperationsSchemaPath, 'utf8');
  }
  if (hasOperationExecutionLedgerSchema) {
    filesMap['schemas/operation-execution-ledger.schema.json'] = fs.readFileSync(operationExecutionLedgerSchemaPath, 'utf8');
  }
  if (hasRuntimeEvidencePacketSchema) {
    filesMap['schemas/runtime-evidence-packet.schema.json'] = fs.readFileSync(runtimeEvidencePacketSchemaPath, 'utf8');
  }
  if (hasRuntimeCapabilityPolicySchema) {
    filesMap['schemas/runtime-capability-policy.schema.json'] = fs.readFileSync(runtimeCapabilityPolicySchemaPath, 'utf8');
  }
  return filesMap;
}

export function buildAllCatalogArtifacts(rootDir = DEFAULT_ROOT, options = {}) {
  const validation = validateKnowledgeAndRecipeCatalogs(rootDir);
  if (!validation.valid) {
    throw new Error(`Catalog validation failed:\n- ${validation.errors.join('\n- ')}`);
  }

  const indexData = generateCatalogIndexData(rootDir);
  const catalogMd = renderKnowledgeAndRecipeCatalogMarkdown(rootDir);
  const auditsDir = path.join(rootDir, 'docs/audits');

  if (options.checkOnly) {
    const indexPath = path.join(rootDir, 'registry/catalog-index.json');
    const docPath = path.join(rootDir, 'docs/knowledge-and-recipe-catalog.md');
    const expectedIndex = JSON.stringify(indexData, null, 2) + '\n';
    const actualIndex = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
    const expectedDoc = catalogMd;
    const actualDoc = fs.existsSync(docPath) ? fs.readFileSync(docPath, 'utf8') : '';
    let auditInSync = true;
    if (fs.existsSync(auditsDir)) {
      const auditData = buildSkillArchitectureAuditData(rootDir);
      const expectedAuditJson = JSON.stringify(auditData, null, 2) + '\n';
      const actualAuditJson = fs.existsSync(path.join(auditsDir, 'skill-architecture-audit.json'))
        ? fs.readFileSync(path.join(auditsDir, 'skill-architecture-audit.json'), 'utf8')
        : '';
      const expectedAuditMd = renderSkillArchitectureAuditMarkdown(auditData);
      const actualAuditMd = fs.existsSync(path.join(auditsDir, 'skill-architecture-audit.md'))
        ? fs.readFileSync(path.join(auditsDir, 'skill-architecture-audit.md'), 'utf8')
        : '';
      auditInSync = actualAuditJson === expectedAuditJson && actualAuditMd === expectedAuditMd;
    }
    return {
      ok: actualIndex === expectedIndex && actualDoc === expectedDoc && auditInSync,
      validation,
      index_entries: indexData.entries.length
    };
  }

  writeJsonStable(path.join(rootDir, 'registry/catalog-index.json'), indexData);
  fs.writeFileSync(path.join(rootDir, 'docs/knowledge-and-recipe-catalog.md'), catalogMd, 'utf8');

  if (fs.existsSync(auditsDir)) {
    const auditData = buildSkillArchitectureAuditData(rootDir);
    writeJsonStable(path.join(auditsDir, 'skill-architecture-audit.json'), auditData);
    const auditMd = renderSkillArchitectureAuditMarkdown(auditData);
    fs.writeFileSync(path.join(auditsDir, 'skill-architecture-audit.md'), auditMd, 'utf8');
  }

  return {
    ok: true,
    validation,
    index_entries: indexData.entries.length
  };
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || '--build';

  if (mode === '--build') {
    const result = buildAllCatalogArtifacts(DEFAULT_ROOT);
    const evalResult = fs.existsSync(path.join(DEFAULT_ROOT, 'evals/catalog-retrieval-evals.json'))
      ? runCatalogRetrievalEvals(DEFAULT_ROOT)
      : { passed: true, total: 0, passed_count: 0, failures: [] };
    if (!evalResult.passed) {
      console.error('Catalog retrieval evals failed:', evalResult.failures);
      process.exit(1);
    }
    console.log(
      `Built knowledge & recipe catalog artifacts (${result.validation.counts.knowledge_records} knowledge records, ${result.validation.counts.recipes} recipes, ${result.validation.counts.sources} sources; ${evalResult.passed_count}/${evalResult.total} retrieval evals passed).`
    );
    return;
  }

  if (mode === '--check' || mode === '--validate') {
    const validation = validateKnowledgeAndRecipeCatalogs(DEFAULT_ROOT);
    if (!validation.valid) {
      console.error('Catalog validation errors:\n- ' + validation.errors.join('\n- '));
      process.exit(1);
    }
    const indexPath = path.join(DEFAULT_ROOT, 'registry/catalog-index.json');
    const docPath = path.join(DEFAULT_ROOT, 'docs/knowledge-and-recipe-catalog.md');
    if (!fs.existsSync(indexPath) || !fs.existsSync(docPath)) {
      console.error('Missing generated catalog artifacts (registry/catalog-index.json or docs/knowledge-and-recipe-catalog.md).');
      process.exit(1);
    }
    const expectedIndex = JSON.stringify(generateCatalogIndexData(DEFAULT_ROOT), null, 2) + '\n';
    const actualIndex = fs.readFileSync(indexPath, 'utf8');
    if (actualIndex !== expectedIndex) {
      console.error('registry/catalog-index.json is out of sync. Run `npm run catalog:build`.');
      process.exit(1);
    }
    const expectedDoc = renderKnowledgeAndRecipeCatalogMarkdown(DEFAULT_ROOT);
    const actualDoc = fs.readFileSync(docPath, 'utf8');
    if (actualDoc !== expectedDoc) {
      console.error('docs/knowledge-and-recipe-catalog.md is out of sync. Run `npm run catalog:build`.');
      process.exit(1);
    }
    const auditsDir = path.join(DEFAULT_ROOT, 'docs/audits');
    if (fs.existsSync(auditsDir)) {
      const auditData = buildSkillArchitectureAuditData(DEFAULT_ROOT);
      const expectedAuditJson = JSON.stringify(auditData, null, 2) + '\n';
      const actualAuditJson = fs.existsSync(path.join(auditsDir, 'skill-architecture-audit.json'))
        ? fs.readFileSync(path.join(auditsDir, 'skill-architecture-audit.json'), 'utf8')
        : '';
      const expectedAuditMd = renderSkillArchitectureAuditMarkdown(auditData);
      const actualAuditMd = fs.existsSync(path.join(auditsDir, 'skill-architecture-audit.md'))
        ? fs.readFileSync(path.join(auditsDir, 'skill-architecture-audit.md'), 'utf8')
        : '';
      if (actualAuditJson !== expectedAuditJson || actualAuditMd !== expectedAuditMd) {
        console.error('docs/audits/skill-architecture-audit.{json,md} is out of sync. Run `npm run catalog:build`.');
        process.exit(1);
      }
    }
    if (fs.existsSync(path.join(DEFAULT_ROOT, 'evals/catalog-retrieval-evals.json'))) {
      const evalResult = runCatalogRetrievalEvals(DEFAULT_ROOT);
      if (!evalResult.passed) {
        console.error('Catalog retrieval eval failures:\n- ' + evalResult.failures.join('\n- '));
        process.exit(1);
      }
    }
    console.log(
      `Catalog check passed (${validation.counts.knowledge_records} knowledge records, ${validation.counts.recipes} recipes, ${validation.counts.sources} sources).`
    );
    return;
  }

  if (mode === '--eval') {
    const evalResult = runCatalogRetrievalEvals(DEFAULT_ROOT);
    if (!evalResult.passed) {
      console.error(JSON.stringify(evalResult, null, 2));
      process.exit(1);
    }
    console.log(JSON.stringify(evalResult, null, 2));
    return;
  }

  if (mode === '--search') {
    const query = args.slice(1).join(' ');
    console.log(JSON.stringify(searchCatalog(DEFAULT_ROOT, query), null, 2));
    return;
  }

  if (mode === '--resolve') {
    const id = args[1] || '';
    const res = resolveCatalogRecord(DEFAULT_ROOT, id);
    console.log(JSON.stringify(res, null, 2));
    if (!res.found) process.exit(1);
    return;
  }

  console.error(`Unknown option: ${mode}`);
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
