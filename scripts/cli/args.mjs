import fs from 'node:fs';
import path from 'node:path';
import { SUPPORTED_TARGETS, TARGET_DETECTION_MARKERS } from './constants.mjs';

export function parseInstallerArgs(argv = []) {
  let subcommand = null;
  let target = null;
  let project = null;
  let out = null;
  let doctor = false;
  let dryRun = false;
  let write = false;
  let rollback = false;
  let forceRollback = false;
  let allowGlobal = false;
  let confirmTargetPath = false;
  let patchAgentsMd = false;
  let patchClaudeMd = false;
  let withSkillsDir = false;
  const skillsFilterRaw = [];
  let help = false;
  let version = false;

  const takeValue = (flagName, currentVal, args, index) => {
    if (currentVal !== null) {
      throw new Error(`Duplicate ${flagName} argument`);
    }
    if (index + 1 >= args.length) {
      throw new Error(`Missing value for ${flagName}`);
    }
    const next = args[index + 1];
    if (typeof next !== 'string' || next.trim() === '' || next.startsWith('-')) {
      throw new Error(`Invalid value for ${flagName}: ${String(next)}`);
    }
    return next.trim();
  };

  const takeEqValue = (flagName, currentVal, rawArg) => {
    if (currentVal !== null) {
      throw new Error(`Duplicate ${flagName} argument`);
    }
    const val = rawArg.slice(`${flagName}=`.length).trim();
    if (!val || val.startsWith('-')) {
      throw new Error(`Invalid value for ${flagName}: ${rawArg}`);
    }
    return val;
  };

  const KNOWN_SUBCOMMANDS = new Set(['doctor', 'install', 'rollback', 'version', 'help']);

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (i === 0 && typeof arg === 'string' && !arg.startsWith('-') && KNOWN_SUBCOMMANDS.has(arg)) {
      subcommand = arg;
      if (arg === 'doctor') {
        doctor = true;
      } else if (arg === 'rollback') {
        rollback = true;
      } else if (arg === 'version') {
        version = true;
      } else if (arg === 'help') {
        help = true;
      }
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--version' || arg === '-v') {
      version = true;
    } else if (arg === '--target') {
      target = takeValue('--target', target, argv, i);
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--target=')) {
      target = takeEqValue('--target', target, arg);
    } else if (arg === '--project') {
      project = takeValue('--project', project, argv, i);
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--project=')) {
      project = takeEqValue('--project', project, arg);
    } else if (arg === '--out' || arg === '--output') {
      out = takeValue('--out', out, argv, i);
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--out=')) {
      out = takeEqValue('--out', out, arg);
    } else if (typeof arg === 'string' && arg.startsWith('--output=')) {
      out = takeEqValue('--output', out, arg);
    } else if (arg === '--doctor') {
      doctor = true;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--write') {
      write = true;
    } else if (arg === '--rollback') {
      rollback = true;
    } else if (arg === '--force-rollback' || arg === '--force') {
      forceRollback = true;
    } else if (arg === '--allow-global') {
      allowGlobal = true;
    } else if (typeof arg === 'string' && arg.startsWith('--allow-global=')) {
      allowGlobal = true;
    } else if (arg === '--confirm-target-path') {
      confirmTargetPath = true;
    } else if (arg === '--patch-agents-md') {
      patchAgentsMd = true;
    } else if (arg === '--patch-claude-md') {
      patchClaudeMd = true;
    } else if (arg === '--with-skills-dir' || arg === '--skills-sh') {
      withSkillsDir = true;
    } else if (arg === '--skill') {
      const val = takeValue('--skill', null, argv, i);
      for (const s of val.split(',')) {
        const clean = s.trim();
        if (clean) skillsFilterRaw.push(clean);
      }
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--skill=')) {
      const val = takeEqValue('--skill', null, arg);
      for (const s of val.split(',')) {
        const clean = s.trim();
        if (clean) skillsFilterRaw.push(clean);
      }
    } else {
      throw new Error(`Unknown or malformed CLI argument: ${String(arg)}`);
    }
  }

  const skillsFilter =
    skillsFilterRaw.length > 0
      ? [...new Set(skillsFilterRaw)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      : null;

  if (allowGlobal) {
    throw new Error(
      'Global installation (--allow-global) is disabled in BlendOps CLI; BlendOps installer only supports project-local (--project) or bundle-output (--out) scopes.',
    );
  }

  if (help) {
    return {
      mode: 'help',
      subcommand,
      target,
      project,
      out,
      forceRollback,
      confirmTargetPath,
      patchAgentsMd,
      patchClaudeMd,
      ...(withSkillsDir ? { withSkillsDir: true } : {}),
      ...(skillsFilter ? { skillsFilter } : {}),
    };
  }

  const activeModes = [
    version ? 'version' : null,
    doctor ? 'doctor' : null,
    dryRun ? 'dry-run' : null,
    write ? 'write' : null,
    rollback ? 'rollback' : null,
  ].filter(Boolean);

  if (subcommand === 'install' && (doctor || rollback || version)) {
    throw new Error(
      `Conflicting operation modes (install, ${activeModes.join(', ')}): specify exactly one mode per invocation.`,
    );
  }

  if (activeModes.length === 0) {
    if (subcommand === 'install') {
      throw new Error(
        "Missing operation mode for 'install': specify either --dry-run or --write.",
      );
    }
    throw new Error(
      'Missing operation mode: specify a command (doctor, install, rollback) or one of --doctor, --dry-run, --write, --rollback, --version, or --help.',
    );
  }
  if (activeModes.length > 1) {
    throw new Error(
      `Conflicting operation modes (${activeModes.join(', ')}): specify exactly one mode per invocation.`,
    );
  }

  const mode = activeModes[0];

  if (mode === 'version') {
    return {
      mode: 'version',
      subcommand,
      target,
      project,
      out,
      forceRollback,
      confirmTargetPath,
      patchAgentsMd,
      patchClaudeMd,
      ...(withSkillsDir ? { withSkillsDir: true } : {}),
      ...(skillsFilter ? { skillsFilter } : {}),
    };
  }

  if (forceRollback && mode !== 'rollback') {
    throw new Error('--force / --force-rollback is only valid with --rollback.');
  }

  if (mode === 'dry-run' || mode === 'write') {
    if (!target && subcommand === 'install' && project && !out) {
      target = 'auto';
    }
    if (!target) {
      throw new Error(`Missing required --target <name> for --${mode}.`);
    }
    if (!Object.hasOwn(SUPPORTED_TARGETS, target)) {
      throw new Error(
        `Unsupported --target '${target}'. Supported targets: ${Object.keys(SUPPORTED_TARGETS).join(', ')}`,
      );
    }
    const targetSpec = SUPPORTED_TARGETS[target];
    if (targetSpec.requiresOut) {
      if (!out) {
        throw new Error(`Target '${target}' requires --out <path>.`);
      }
      if (project) {
        throw new Error(`Target '${target}' uses --out <path> and does not accept --project.`);
      }
    }
    if (targetSpec.requiresProject) {
      if (!project) {
        throw new Error(`Target '${target}' requires --project <path>.`);
      }
      if (out) {
        throw new Error(`Target '${target}' uses --project <path> and does not accept --out.`);
      }
    }
  } else if (mode === 'rollback') {
    if (!project && !out) {
      throw new Error('--rollback requires --project <path> (or --out <path>).');
    }
    if (project && out) {
      throw new Error('--rollback accepts either --project <path> or --out <path>, not both.');
    }
  } else if (mode === 'doctor') {
    if (target && !Object.hasOwn(SUPPORTED_TARGETS, target)) {
      throw new Error(
        `Unsupported --target '${target}'. Supported targets: ${Object.keys(SUPPORTED_TARGETS).join(', ')}`,
      );
    }
  }

  return {
    mode,
    subcommand,
    target,
    project,
    out,
    forceRollback,
    confirmTargetPath,
    patchAgentsMd,
    patchClaudeMd,
    ...(withSkillsDir ? { withSkillsDir: true } : {}),
    ...(skillsFilter ? { skillsFilter } : {}),
  };
}

export function detectProjectTargetMarkers(projectRoot) {
  const realProject = fs.realpathSync(projectRoot);
  const detectedByTarget = [];

  for (const entry of TARGET_DETECTION_MARKERS) {
    const matchedMarkers = [];
    for (const relMarker of entry.markers) {
      const absMarker = path.join(realProject, relMarker);
      try {
        const lstat = fs.lstatSync(absMarker);
        if (lstat.isSymbolicLink()) {
          throw new Error(
            `Refusing symbolic link project marker inside target project: ${relMarker}`,
          );
        }
        matchedMarkers.push(relMarker);
      } catch (err) {
        if (err && err.code === 'ENOENT') {
          continue;
        }
        throw err;
      }
    }
    if (matchedMarkers.length > 0) {
      detectedByTarget.push({
        target: entry.target,
        confidence: SUPPORTED_TARGETS[entry.target].confidence,
        markers: matchedMarkers,
      });
    }
  }

  return detectedByTarget;
}
