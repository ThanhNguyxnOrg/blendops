import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

export type BridgeStartMode = "gui" | "background";

export interface BridgeLifecycleResult {
  ok: boolean;
  message: string;
  data: Record<string, unknown>;
  warnings: string[];
  next_steps: string[];
}

export interface StartBridgeLifecycleInput {
  mode?: BridgeStartMode;
  blender_path?: string;
  bridge_url?: string;
  timeout_ms?: number;
  poll_interval_ms?: number;
  root_dir?: string;
  logger?: (message: string) => void;
}

export interface StopBridgeLifecycleInput {
  all?: boolean;
  root_dir?: string;
  logger?: (message: string) => void;
}

export interface GetBridgeLogsLifecycleInput {
  tail?: number;
  root_dir?: string;
}

interface BridgeLifecyclePaths {
  state_dir: string;
  process_file: string;
  stdout_log: string;
  stderr_log: string;
  startup_script: string;
}

interface BridgeProcessState {
  pid: number;
  mode: BridgeStartMode;
  blender_path: string;
  bridge_url: string;
  started_at: string;
  root_dir: string;
  stdout_log: string;
  stderr_log: string;
  startup_script: string;
}

const DEFAULT_BRIDGE_URL = "http://127.0.0.1:8765";
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;
const DEFAULT_TAIL = 80;
const MAX_TAIL = 1_000;
const DEFAULT_WINDOWS_BLENDER_PATH = "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe";

function logIfDefined(logger: ((message: string) => void) | undefined, message: string): void {
  if (logger) {
    logger(message);
  }
}

function resolveLifecyclePaths(root_dir: string): BridgeLifecyclePaths {
  const state_dir = path.resolve(root_dir, ".tmp", "blendops");
  return {
    state_dir,
    process_file: path.join(state_dir, "bridge-process.json"),
    stdout_log: path.join(state_dir, "bridge.stdout.log"),
    stderr_log: path.join(state_dir, "bridge.stderr.log"),
    startup_script: path.join(state_dir, "start_bridge_gui.py"),
  };
}

function ensureLifecycleDirectory(paths: BridgeLifecyclePaths): void {
  mkdirSync(paths.state_dir, { recursive: true });
}

function readProcessState(paths: BridgeLifecyclePaths): BridgeProcessState | null {
  if (!existsSync(paths.process_file)) {
    return null;
  }

  try {
    const raw = readFileSync(paths.process_file, "utf8");
    const parsed = JSON.parse(raw) as BridgeProcessState;
    if (typeof parsed.pid !== "number" || Number.isNaN(parsed.pid)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeProcessState(paths: BridgeLifecyclePaths, state: BridgeProcessState): void {
  writeFileSync(paths.process_file, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function removeProcessState(paths: BridgeLifecyclePaths): void {
  if (existsSync(paths.process_file)) {
    rmSync(paths.process_file, { force: true });
  }
}

function isPidRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isBlenderProcess(pid: number): boolean {
  if (!isPidRunning(pid)) {
    return false;
  }

  if (process.platform === "win32") {
    const result = spawnSync("tasklist", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"], {
      shell: false,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      return false;
    }

    const output = (result.stdout ?? "").toLowerCase();
    if (output.includes("no tasks are running")) {
      return false;
    }

    return output.includes("blender");
  }

  const result = spawnSync("ps", ["-p", `${pid}`, "-o", "comm="], {
    shell: false,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return false;
  }

  return (result.stdout ?? "").toLowerCase().includes("blender");
}

function resolveBlenderPath(requested: string | undefined): string | null {
  const candidates: string[] = [];

  if (typeof requested === "string" && requested.trim().length > 0) {
    candidates.push(requested.trim());
  }

  if (typeof process.env.BLENDOPS_BLENDER_PATH === "string" && process.env.BLENDOPS_BLENDER_PATH.trim().length > 0) {
    candidates.push(process.env.BLENDOPS_BLENDER_PATH.trim());
  }

  if (process.platform === "win32") {
    candidates.push(DEFAULT_WINDOWS_BLENDER_PATH);
  }

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (existsSync(resolved)) {
      return resolved;
    }
  }

  return null;
}

function sanitizeMode(mode: BridgeStartMode | undefined): BridgeStartMode {
  if (mode === "background") {
    return "background";
  }
  return "gui";
}

function sanitizeTail(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isInteger(value) || value <= 0) {
    return DEFAULT_TAIL;
  }
  return Math.min(value, MAX_TAIL);
}

function toPythonRawPath(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function writeStartupScript(paths: BridgeLifecyclePaths, root_dir: string): void {
  const addon_parent = path.resolve(root_dir, "apps", "blender-addon");
  const script = [
    "import sys",
    "import bpy",
    `sys.path.insert(0, r'${toPythonRawPath(addon_parent)}')`,
    "import blendops_addon",
    "blendops_addon.register()",
    "print(\"BRIDGE_READY\", flush=True)",
    "bpy.app.timers.register(lambda: 1.0, persistent=True)",
  ].join("\n");

  writeFileSync(paths.startup_script, `${script}\n`, "utf8");
}

function tailFileLines(file_path: string, tail_count: number): string[] {
  if (!existsSync(file_path)) {
    return [];
  }

  try {
    const content = readFileSync(file_path, "utf8");
    const lines = content.split(/\r?\n/).filter((line) => line.length > 0);
    if (lines.length <= tail_count) {
      return lines;
    }
    return lines.slice(lines.length - tail_count);
  } catch {
    return [];
  }
}

async function waitForBridgeReady(bridge_url: string, timeout_ms: number, poll_interval_ms: number): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start <= timeout_ms) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2_000);
      const response = await fetch(`${bridge_url}/status`, { method: "GET", signal: controller.signal });
      clearTimeout(timer);

      if (response.ok) {
        const parsed = (await response.json()) as { ok?: unknown };
        if (parsed && typeof parsed === "object" && parsed.ok === true) {
          return true;
        }
      }
    } catch {
    }

    await new Promise<void>((resolvePromise) => {
      setTimeout(() => resolvePromise(), poll_interval_ms);
    });
  }

  return false;
}

function stopSinglePid(pid: number): boolean {
  if (process.platform === "win32") {
    const result = spawnSync("taskkill", ["/PID", `${pid}`, "/T", "/F"], {
      shell: false,
      encoding: "utf8",
    });
    return result.status === 0;
  }

  try {
    process.kill(pid, "SIGTERM");
    return true;
  } catch {
    return false;
  }
}

function stopAllBlenderProcesses(): { ok: boolean; message: string } {
  if (process.platform === "win32") {
    const result = spawnSync("taskkill", ["/IM", "blender.exe", "/T", "/F"], {
      shell: false,
      encoding: "utf8",
    });

    if (result.status === 0) {
      return { ok: true, message: "Stopped all Blender processes via taskkill /IM blender.exe" };
    }

    const stderr = (result.stderr ?? "").toString();
    const stdout = (result.stdout ?? "").toString();
    const output = `${stdout}\n${stderr}`.toLowerCase();
    if (output.includes("no running instance") || output.includes("not found") || output.includes("no tasks are running")) {
      return { ok: true, message: "No running Blender processes found" };
    }

    return { ok: false, message: `Failed to stop all Blender processes: ${(result.stderr ?? result.stdout ?? "unknown error").toString().trim()}` };
  }

  const result = spawnSync("pkill", ["-f", "blender"], {
    shell: false,
    encoding: "utf8",
  });

  if (result.status === 0 || result.status === 1) {
    return { ok: true, message: "Stopped matching Blender processes (or none were running)" };
  }

  return { ok: false, message: `Failed to stop Blender processes: ${(result.stderr ?? result.stdout ?? "unknown error").toString().trim()}` };
}

export async function startBridgeLifecycle(input: StartBridgeLifecycleInput = {}): Promise<BridgeLifecycleResult> {
  const root_dir = input.root_dir ?? process.cwd();
  const mode = sanitizeMode(input.mode);
  const bridge_url = input.bridge_url ?? DEFAULT_BRIDGE_URL;
  const timeout_ms = typeof input.timeout_ms === "number" && input.timeout_ms > 0 ? Math.floor(input.timeout_ms) : DEFAULT_TIMEOUT_MS;
  const poll_interval_ms = typeof input.poll_interval_ms === "number" && input.poll_interval_ms > 0 ? Math.floor(input.poll_interval_ms) : DEFAULT_POLL_INTERVAL_MS;
  const paths = resolveLifecyclePaths(root_dir);

  ensureLifecycleDirectory(paths);

  const existing = readProcessState(paths);
  if (existing && isPidRunning(existing.pid)) {
    logIfDefined(input.logger, `bridge lifecycle: existing tracked process pid=${existing.pid}`);
    const ready = await waitForBridgeReady(existing.bridge_url, 5_000, 500);
    if (ready) {
      return {
        ok: true,
        message: "BlendOps bridge is already running",
        data: {
          mode: existing.mode,
          blender_path: existing.blender_path,
          pid: existing.pid,
          bridge_url: existing.bridge_url,
          process_file: paths.process_file,
          stdout_log: existing.stdout_log,
          stderr_log: existing.stderr_log,
          startup_script: existing.startup_script,
          already_running: true,
        },
        warnings: [],
        next_steps: [
          "Run `blendops bridge status --verbose` to verify bridge metadata",
          "Run `blendops bridge logs --tail 120` to inspect lifecycle logs",
        ],
      };
    }
  }

  if (existing && !isPidRunning(existing.pid)) {
    removeProcessState(paths);
  }

  const blender_path = resolveBlenderPath(input.blender_path);
  if (!blender_path) {
    return {
      ok: false,
      message: "Unable to resolve Blender executable path",
      data: {
        requested_blender_path: input.blender_path ?? null,
        env_blender_path: process.env.BLENDOPS_BLENDER_PATH ?? null,
        default_windows_path: process.platform === "win32" ? DEFAULT_WINDOWS_BLENDER_PATH : null,
      },
      warnings: ["Set --blender or BLENDOPS_BLENDER_PATH to a valid Blender executable path"],
      next_steps: [
        "Example: blendops bridge start --mode gui --blender \"C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe\"",
      ],
    };
  }

  writeStartupScript(paths, root_dir);
  logIfDefined(input.logger, `bridge lifecycle: startup script generated at ${paths.startup_script}`);

  const args = mode === "background"
    ? ["--background", "--python", paths.startup_script]
    : ["--python", paths.startup_script];

  const stdout_fd = openSync(paths.stdout_log, "a");
  const stderr_fd = openSync(paths.stderr_log, "a");

  const child = spawn(blender_path, args, {
    cwd: root_dir,
    shell: false,
    detached: true,
    windowsHide: false,
    stdio: ["ignore", stdout_fd, stderr_fd],
  });

  closeSync(stdout_fd);
  closeSync(stderr_fd);

  if (!child.pid) {
    return {
      ok: false,
      message: "Failed to launch Blender bridge process",
      data: {
        blender_path,
        mode,
        startup_script: paths.startup_script,
        stdout_log: paths.stdout_log,
        stderr_log: paths.stderr_log,
      },
      warnings: ["Spawn returned no PID"],
      next_steps: ["Inspect bridge stderr log and Blender installation path"],
    };
  }

  child.unref();

  const state: BridgeProcessState = {
    pid: child.pid,
    mode,
    blender_path,
    bridge_url,
    started_at: new Date().toISOString(),
    root_dir,
    stdout_log: paths.stdout_log,
    stderr_log: paths.stderr_log,
    startup_script: paths.startup_script,
  };
  writeProcessState(paths, state);

  logIfDefined(input.logger, `bridge lifecycle: launched pid=${child.pid} mode=${mode}`);

  const ready = await waitForBridgeReady(bridge_url, timeout_ms, poll_interval_ms);

  if (!ready) {
    return {
      ok: false,
      message: `Bridge did not become ready within ${timeout_ms}ms`,
      data: {
        mode,
        blender_path,
        pid: child.pid,
        bridge_url,
        process_file: paths.process_file,
        startup_script: paths.startup_script,
        stdout_log: paths.stdout_log,
        stderr_log: paths.stderr_log,
      },
      warnings: [
        "Bridge process may still be starting or may have failed startup",
        mode === "background" ? "Background mode is limited/unvalidated for persistent bridge runtime" : "Verify addon import path and Blender GUI startup",
      ],
      next_steps: [
        "Run `blendops bridge logs --tail 120` to inspect bridge output",
        "Run `blendops bridge status --verbose` to check bridge connectivity",
      ],
    };
  }

  return {
    ok: true,
    message: "BlendOps bridge started successfully",
    data: {
      mode,
      blender_path,
      pid: child.pid,
      bridge_url,
      process_file: paths.process_file,
      startup_script: paths.startup_script,
      stdout_log: paths.stdout_log,
      stderr_log: paths.stderr_log,
      timeout_ms,
      poll_interval_ms,
    },
    warnings: mode === "background" ? ["Background mode is limited/unvalidated for persistent bridge runtime"] : [],
    next_steps: [
      "Run `blendops bridge status --verbose`",
      "Run `blendops bridge operations --verbose`",
      "Run `blendops scene inspect --verbose`",
    ],
  };
}

export function stopBridgeLifecycle(input: StopBridgeLifecycleInput = {}): BridgeLifecycleResult {
  const root_dir = input.root_dir ?? process.cwd();
  const paths = resolveLifecyclePaths(root_dir);
  ensureLifecycleDirectory(paths);

  if (input.all === true) {
    const result = stopAllBlenderProcesses();
    removeProcessState(paths);

    return {
      ok: result.ok,
      message: result.message,
      data: {
        all: true,
      },
      warnings: ["--all can terminate unrelated Blender sessions"],
      next_steps: ["Run `blendops bridge status --verbose` to verify bridge state"],
    };
  }

  const state = readProcessState(paths);
  if (!state) {
    return {
      ok: false,
      message: "No tracked bridge process found",
      data: {
        process_file: paths.process_file,
      },
      warnings: ["Bridge may have been started manually or process state was removed"],
      next_steps: ["Run `blendops bridge start --mode gui` to start a managed bridge process"],
    };
  }

  if (!isPidRunning(state.pid)) {
    removeProcessState(paths);
    return {
      ok: true,
      message: "Tracked bridge process is already stopped",
      data: {
        pid: state.pid,
        blender_path: state.blender_path,
      },
      warnings: ["Removed stale bridge process state file"],
      next_steps: [],
    };
  }

  if (!isBlenderProcess(state.pid)) {
    return {
      ok: false,
      message: `Refusing to stop pid ${state.pid} because it is not a Blender process`,
      data: {
        pid: state.pid,
      },
      warnings: ["Process name validation failed"],
      next_steps: ["Inspect process state file and remove it manually if stale"],
    };
  }

  const killed = stopSinglePid(state.pid);
  if (!killed) {
    return {
      ok: false,
      message: `Failed to stop Blender process pid=${state.pid}`,
      data: {
        pid: state.pid,
      },
      warnings: ["Process termination command failed"],
      next_steps: ["Stop Blender manually and rerun bridge stop"],
    };
  }

  removeProcessState(paths);

  return {
    ok: true,
    message: `Stopped Blender bridge process pid=${state.pid}`,
    data: {
      pid: state.pid,
      blender_path: state.blender_path,
      all: false,
    },
    warnings: [],
    next_steps: [],
  };
}

export function getBridgeLogsLifecycle(input: GetBridgeLogsLifecycleInput = {}): BridgeLifecycleResult {
  const root_dir = input.root_dir ?? process.cwd();
  const tail = sanitizeTail(input.tail);
  const paths = resolveLifecyclePaths(root_dir);
  ensureLifecycleDirectory(paths);

  const state = readProcessState(paths);
  const stdout_log = state?.stdout_log ?? paths.stdout_log;
  const stderr_log = state?.stderr_log ?? paths.stderr_log;

  const stdout_tail = tailFileLines(stdout_log, tail);
  const stderr_tail = tailFileLines(stderr_log, tail);

  return {
    ok: true,
    message: "Bridge logs retrieved",
    data: {
      tail,
      stdout_log,
      stderr_log,
      stdout_tail,
      stderr_tail,
      tracked_pid: state?.pid ?? null,
      tracked_mode: state?.mode ?? null,
    },
    warnings: [],
    next_steps: [],
  };
}
