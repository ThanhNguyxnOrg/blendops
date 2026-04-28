#!/usr/bin/env node

import { BridgeClient, getBridgeLogsLifecycle, startBridgeLifecycle, stopBridgeLifecycle } from "@blendops/core";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ColorHexSchema, ExportAssetExtensionByFormat, ExportAssetFormatSchema, LightingPresetSchema, makeResponse, ObjectTypeSchema, ValidationPresetSchema, Vec3Schema } from "@blendops/schemas";

interface GlobalFlags {
  verbose: boolean;
  quiet: boolean;
  commandArgs: string[];
}

const LONG_RUNNING_OPERATIONS = new Set(["render.preview", "validate.scene", "export.asset"]);
const LOG_FILE = process.env.BLENDOPS_LOG_FILE;

function parseGlobalFlags(args: string[]): GlobalFlags {
  let verbose = false;
  let quiet = false;
  const commandArgs: string[] = [];

  for (const arg of args) {
    if (arg === "--verbose" || arg === "-v") {
      verbose = true;
      continue;
    }

    if (arg === "--quiet" || arg === "-q") {
      quiet = true;
      continue;
    }

    commandArgs.push(arg);
  }

  if (quiet) {
    verbose = false;
  }

  return { verbose, quiet, commandArgs };
}

function appendLogFile(message: string): void {
  if (!LOG_FILE) {
    return;
  }

  try {
    const resolvedPath = resolve(LOG_FILE);
    mkdirSync(dirname(resolvedPath), { recursive: true });
    appendFileSync(resolvedPath, `${message}\n`, { encoding: "utf8" });
  } catch {
    return;
  }
}

function nowStamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function humanLog(message: string, flags: GlobalFlags): void {
  if (flags.quiet) {
    return;
  }

  const line = `[BlendOps ${nowStamp()}] ${message}`;
  process.stderr.write(`${line}\n`);
  appendLogFile(line);
}

async function timeOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  flags: GlobalFlags,
  request_id: string
): Promise<T> {
  const start = Date.now();
  const shouldLog = flags.verbose || LONG_RUNNING_OPERATIONS.has(operation);

  if (shouldLog) {
    humanLog(`command: ${operation} request_id=${request_id}`, flags);
  }

  try {
    const result = await fn();
    const duration = Date.now() - start;
    if (shouldLog) {
      let outcome = "done";
      let responseRequestId = request_id;
      if (typeof result === "object" && result !== null) {
        if ("ok" in result) {
          const okValue = (result as { ok?: unknown }).ok;
          outcome = okValue === true ? "ok" : "failed";
        }
        if ("request_id" in result) {
          const maybeRequestId = (result as { request_id?: unknown }).request_id;
          if (typeof maybeRequestId === "string" && maybeRequestId.length > 0) {
            responseRequestId = maybeRequestId;
          }
        }
      }
      humanLog(`completed: ${operation} ${outcome} ${duration}ms request_id=${responseRequestId}`, flags);
    }
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    humanLog(`failed: ${operation} ${duration}ms request_id=${request_id}`, flags);
    throw error;
  }
}

function printHelp(): void {
  console.log(`BlendOps CLI

Usage:
  blendops bridge start --mode gui [--blender "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe"] [--verbose]
  blendops bridge stop [--all]
  blendops bridge logs [--tail 120]
  blendops bridge status
  blendops bridge operations
  blendops scene inspect
  blendops scene clear --confirm CLEAR_SCENE [--dry-run]
  blendops object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
  blendops object transform --name test_cube --location 1,0,1
  blendops object transform --name test_cube --rotation 0,0,1.5708
  blendops object transform --name test_cube --scale 2,2,2
  blendops material create --name red_plastic --color "#ff0000" --roughness 0.5 --metallic 0
  blendops material apply --object test_cube --material red_plastic
  blendops lighting setup --preset studio
  blendops lighting setup --preset three_point --target test_cube
  blendops camera set --target test_cube --distance 5
  blendops camera set --target test_cube --location 4,-5,3 --focal-length 50
  blendops camera set --location 4,-5,3 --rotation 1.1,0,0.7 --focal-length 35
  blendops render preview
  blendops render preview --output renders/preview.png --width 512 --height 512 --samples 16
  blendops validate scene
  blendops validate scene --preset basic
  blendops validate scene --preset game_asset
  blendops validate scene --preset render_ready
  blendops export asset --format glb --output exports/test_scene.glb
  blendops export asset --format gltf --output exports/test_scene.gltf
  blendops export asset --format fbx --output exports/test_scene.fbx
  blendops export asset --format glb --output exports/test_scene.glb --selected-only --no-apply-modifiers
  blendops undo last --verbose
  blendops batch plan --file examples/batch/basic-scene.json --verbose
  blendops batch execute --file examples/batch/basic-scene.json --dry-run --verbose
  blendops batch execute --file examples/batch/basic-scene.json --confirm EXECUTE_BATCH --dry-run-id <id> --plan-fingerprint <sha256:...> --verbose

Options:
  --verbose, -v  Show detailed progress logs (stderr)
  --quiet, -q    Suppress progress logs
  --json         Output JSON (default)
  -h, --help     Show help

Implemented in v0.1:
  - bridge start
  - bridge stop
  - bridge logs
  - bridge status
  - bridge operations
  - undo last
  - scene inspect
  - scene clear
  - object create
  - object transform
  - material create
  - material apply
  - lighting setup
  - camera set
  - render preview
  - validate scene
  - export asset
  - batch plan
  - batch execute (dry-run + guarded real execution)`);
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function parseVec3(value: string | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!value) {
    return fallback;
  }

  const parts = value.split(",").map((entry) => Number(entry.trim()));
  if (parts.length !== 3 || parts.some((entry) => Number.isNaN(entry))) {
    throw new Error(`Invalid vec3 format: ${value}. Expected 3 comma-separated numbers like 0,0,1`);
  }

  return Vec3Schema.parse([parts[0], parts[1], parts[2]]);
}

function parseNumericFlag(value: string | undefined, flagName: string, fallback: number): number {
  if (typeof value === "undefined") {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid ${flagName}: expected a number`);
  }

  return parsed;
}

function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function withRequestId(value: unknown, request_id: string): unknown {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  const typed = value as Record<string, unknown>;
  if (typeof typed.request_id === "string" && typed.request_id.length > 0) {
    return value;
  }

  return {
    ...typed,
    request_id,
  };
}

async function main(): Promise<number> {
  const rawArgs = process.argv.slice(2);
  const flags = parseGlobalFlags(rawArgs);
  const commandArgs = flags.commandArgs;
  const commandRequestId = createRequestId();

  if (commandArgs.length === 0 || commandArgs.includes("-h") || commandArgs.includes("--help")) {
    printHelp();
    return 0;
  }

  const logger = (message: string) => humanLog(message, flags);
  const client = new BridgeClient({ verbose: flags.verbose, quiet: flags.quiet, logger });
  const [group, action] = commandArgs;

  if (group === "bridge" && action === "start") {
    const modeRaw = readFlag(commandArgs, "--mode");
    const blenderPath = readFlag(commandArgs, "--blender");
    const mode = typeof modeRaw === "undefined" ? "gui" : modeRaw;

    if (mode !== "gui" && mode !== "background") {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "bridge start --mode must be either gui or background",
        warnings: ["Unsupported bridge start mode"],
        next_steps: [
          "Use --mode gui (default) or --mode background",
          "Example: blendops bridge start --mode gui --blender \"C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe\"",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }

    const started = Date.now();
    const lifecycle = await timeOperation("bridge.start", () => startBridgeLifecycle({
      mode,
      root_dir: process.cwd(),
      logger: (message: string) => humanLog(message, flags),
      ...(typeof blenderPath === "string" ? { blender_path: blenderPath } : {}),
    }), flags, commandRequestId);

    const response = makeResponse({
      ok: lifecycle.ok,
      operation: "bridge.start",
      message: lifecycle.message,
      data: lifecycle.data,
      warnings: lifecycle.warnings,
      next_steps: lifecycle.next_steps,
      request_id: commandRequestId,
      receipt: {
        request_id: commandRequestId,
        operation: "bridge.start",
        ok: lifecycle.ok,
        duration_ms: Date.now() - started,
      },
    });

    console.log(JSON.stringify(response, null, 2));
    return lifecycle.ok ? 0 : 1;
  }

  if (group === "bridge" && action === "stop") {
    const all = commandArgs.includes("--all");
    const started = Date.now();

    const lifecycle = await timeOperation("bridge.stop", async () => stopBridgeLifecycle({
      all,
      root_dir: process.cwd(),
      logger: (message: string) => humanLog(message, flags),
    }), flags, commandRequestId);

    const response = makeResponse({
      ok: lifecycle.ok,
      operation: "bridge.stop",
      message: lifecycle.message,
      data: lifecycle.data,
      warnings: lifecycle.warnings,
      next_steps: lifecycle.next_steps,
      request_id: commandRequestId,
      receipt: {
        request_id: commandRequestId,
        operation: "bridge.stop",
        ok: lifecycle.ok,
        duration_ms: Date.now() - started,
      },
    });

    console.log(JSON.stringify(response, null, 2));
    return lifecycle.ok ? 0 : 1;
  }

  if (group === "bridge" && action === "logs") {
    const tailRaw = readFlag(commandArgs, "--tail");
    let tail: number | undefined;
    if (typeof tailRaw !== "undefined") {
      const parsed = Number(tailRaw);
      if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
        const invalid = makeResponse({
          ok: false,
          operation: "cli.invalid_arguments",
          message: "bridge logs --tail must be a positive integer",
          warnings: ["Invalid --tail value"],
          next_steps: ["Example: blendops bridge logs --tail 120"],
          request_id: commandRequestId,
        });
        console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
        return 1;
      }
      tail = parsed;
    }

    const started = Date.now();
    const lifecycle = await timeOperation("bridge.logs", async () => getBridgeLogsLifecycle({
      root_dir: process.cwd(),
      ...(typeof tail === "number" ? { tail } : {}),
    }), flags, commandRequestId);

    const response = makeResponse({
      ok: lifecycle.ok,
      operation: "bridge.logs",
      message: lifecycle.message,
      data: lifecycle.data,
      warnings: lifecycle.warnings,
      next_steps: lifecycle.next_steps,
      request_id: commandRequestId,
      receipt: {
        request_id: commandRequestId,
        operation: "bridge.logs",
        ok: lifecycle.ok,
        duration_ms: Date.now() - started,
      },
    });

    console.log(JSON.stringify(response, null, 2));
    return lifecycle.ok ? 0 : 1;
  }

  if (group === "bridge" && action === "status") {
    const res = await timeOperation("bridge.status", () => client.status(commandRequestId), flags, commandRequestId);
    console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
    return res.ok ? 0 : 1;
  }

  if (group === "bridge" && action === "operations") {
    const res = await timeOperation("bridge.operations", () => client.operations(commandRequestId), flags, commandRequestId);
    console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
    return res.ok ? 0 : 1;
  }

  if (group === "scene" && action === "inspect") {
    const res = await timeOperation("scene.inspect", () => client.inspectScene(commandRequestId), flags, commandRequestId);
    console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
    return res.ok ? 0 : 1;
  }

  if (group === "scene" && action === "clear") {
    const confirm = readFlag(commandArgs, "--confirm");
    const dry_run = commandArgs.includes("--dry-run");

    if (confirm !== "CLEAR_SCENE") {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "scene clear requires --confirm CLEAR_SCENE",
        warnings: ["Missing or invalid confirmation token for destructive operation"],
        next_steps: [
          "Run scene inspect before clearing to verify current scene state",
          "Use: blendops scene clear --confirm CLEAR_SCENE [--dry-run]",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }

    const res = await timeOperation("scene.clear", () => client.clearScene({
      confirm,
      dry_run,
      request_id: commandRequestId,
    }), flags, commandRequestId);
    console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
    return res.ok ? 0 : 1;
  }

  if (group === "undo" && action === "last") {
    const res = await timeOperation("undo.last", () => client.undoLast({ request_id: commandRequestId }), flags, commandRequestId);
    console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
    return res.ok ? 0 : 1;
  }

  if (group === "batch" && action === "plan") {
    const filePath = readFlag(commandArgs, "--file");

    if (!filePath) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "batch plan requires --file",
        warnings: ["Missing required --file argument"],
        next_steps: ["Example: blendops batch plan --file examples/batch/basic-scene.json --verbose"],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }

    let rawText = "";
    let parsedJson: unknown;
    try {
      rawText = readFileSync(filePath, "utf8");
      parsedJson = JSON.parse(rawText) as unknown;
    } catch (error) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: error instanceof Error ? `Failed to read/parse batch file: ${error.message}` : "Failed to read/parse batch file",
        warnings: ["Invalid or unreadable batch plan file"],
        next_steps: [
          "Provide a valid JSON file path with --file",
          "File must contain either { \"steps\": [...] } or a direct steps array",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }

    let stepsSource: unknown;
    if (Array.isArray(parsedJson)) {
      stepsSource = parsedJson;
    } else if (typeof parsedJson === "object" && parsedJson !== null && Array.isArray((parsedJson as { steps?: unknown }).steps)) {
      stepsSource = (parsedJson as { steps: unknown[] }).steps;
    }

    if (!Array.isArray(stepsSource)) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "batch plan file must be an array or object containing steps array",
        warnings: ["Invalid batch plan JSON shape"],
        next_steps: [
          "Use { \"steps\": [ ... ] } or [ ... ] as file root",
          "Each step must include an operation string",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }

    const steps: Array<{ operation: string } & Record<string, unknown>> = [];
    for (let index = 0; index < stepsSource.length; index += 1) {
      const step = stepsSource[index];
      if (typeof step !== "object" || step === null || Array.isArray(step)) {
        const invalid = makeResponse({
          ok: false,
          operation: "cli.invalid_arguments",
          message: `batch plan step ${index + 1} must be an object`,
          warnings: ["Invalid step shape"],
          next_steps: ["Each step must be a JSON object containing operation string"],
          request_id: commandRequestId,
        });
        console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
        return 1;
      }

      const operation = (step as { operation?: unknown }).operation;
      if (typeof operation !== "string" || operation.trim().length === 0) {
        const invalid = makeResponse({
          ok: false,
          operation: "cli.invalid_arguments",
          message: `batch plan step ${index + 1} is missing a valid operation string`,
          warnings: ["Invalid step operation"],
          next_steps: ["Set step.operation to a non-empty string"],
          request_id: commandRequestId,
        });
        console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
        return 1;
      }

      steps.push({ ...(step as Record<string, unknown>), operation: operation.trim() });
    }

    const res = await timeOperation("batch.plan", () => client.planBatch({
      steps,
      request_id: commandRequestId,
    }), flags, commandRequestId);
    console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
    return res.ok ? 0 : 1;
  }

  if (group === "batch" && action === "execute") {
    const filePath = readFlag(commandArgs, "--file");
    const hasDryRun = commandArgs.includes("--dry-run");
    const hasConfirm = commandArgs.includes("--confirm");
    const confirmValue = hasConfirm ? readFlag(commandArgs, "--confirm") : undefined;
    const dryRunId = readFlag(commandArgs, "--dry-run-id");
    const planFingerprint = readFlag(commandArgs, "--plan-fingerprint");

    if (!filePath) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "batch execute requires --file",
        warnings: ["Missing required --file argument"],
        next_steps: [
          "Example (dry-run): blendops batch execute --file examples/batch/basic-scene.json --dry-run --verbose",
          "Example (real): blendops batch execute --file examples/batch/basic-scene.json --confirm EXECUTE_BATCH --verbose",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }

    let rawText = "";
    let parsedJson: unknown;
    try {
      rawText = readFileSync(filePath, "utf8");
      parsedJson = JSON.parse(rawText) as unknown;
    } catch (error) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: error instanceof Error ? `Failed to read/parse batch file: ${error.message}` : "Failed to read/parse batch file",
        warnings: ["Invalid or unreadable batch execute file"],
        next_steps: [
          "Provide a valid JSON file path with --file",
          "File must contain either { \"steps\": [...] } or a direct steps array",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }

    let stepsSource: unknown;
    if (Array.isArray(parsedJson)) {
      stepsSource = parsedJson;
    } else if (typeof parsedJson === "object" && parsedJson !== null && Array.isArray((parsedJson as { steps?: unknown }).steps)) {
      stepsSource = (parsedJson as { steps: unknown[] }).steps;
    }

    if (!Array.isArray(stepsSource)) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "batch execute file must be an array or object containing steps array",
        warnings: ["Invalid batch execute JSON shape"],
        next_steps: [
          "Use { \"steps\": [ ... ] } or [ ... ] as file root",
          "Each step must include an operation string",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }

    const steps: Array<{ operation: string } & Record<string, unknown>> = [];
    for (let index = 0; index < stepsSource.length; index += 1) {
      const step = stepsSource[index];
      if (typeof step !== "object" || step === null || Array.isArray(step)) {
        const invalid = makeResponse({
          ok: false,
          operation: "cli.invalid_arguments",
          message: `batch execute step ${index + 1} must be an object`,
          warnings: ["Invalid step shape"],
          next_steps: ["Each step must be a JSON object containing operation string"],
          request_id: commandRequestId,
        });
        console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
        return 1;
      }

      const operation = (step as { operation?: unknown }).operation;
      if (typeof operation !== "string" || operation.trim().length === 0) {
        const invalid = makeResponse({
          ok: false,
          operation: "cli.invalid_arguments",
          message: `batch execute step ${index + 1} is missing a valid operation string`,
          warnings: ["Invalid step operation"],
          next_steps: ["Set step.operation to a non-empty string"],
          request_id: commandRequestId,
        });
        console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
        return 1;
      }

      steps.push({ ...(step as Record<string, unknown>), operation: operation.trim() });
    }

    if (hasDryRun) {
      if (hasConfirm || typeof dryRunId === "string" || typeof planFingerprint === "string") {
        const invalid = makeResponse({
          ok: false,
          operation: "cli.invalid_arguments",
          message: "batch execute dry-run must not include --confirm, --dry-run-id, or --plan-fingerprint",
          warnings: ["Dry-run arguments conflict with real execution arguments"],
          next_steps: [
            "Use dry-run only: blendops batch execute --file <path> --dry-run --verbose",
            "Or remove --dry-run and provide real execution gates",
          ],
          request_id: commandRequestId,
        });
        console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
        return 1;
      }

      const res = await timeOperation(
        "batch.execute",
        () =>
          client.executeBatch({
            dry_run: true,
            steps,
            request_id: commandRequestId,
          }),
        flags,
        commandRequestId,
      );
      console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
      return res.ok ? 0 : 1;
    }

    if (confirmValue !== "EXECUTE_BATCH") {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "batch execute real mode requires --confirm EXECUTE_BATCH",
        warnings: ["Missing or invalid --confirm value"],
        next_steps: [
          "Run dry-run first: blendops batch execute --file <path> --dry-run --verbose",
          "Then run real: blendops batch execute --file <path> --confirm EXECUTE_BATCH --dry-run-id <id> --plan-fingerprint <sha256:...> --verbose",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }

    if (typeof dryRunId !== "string" || dryRunId.trim().length === 0) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "batch execute real mode requires --dry-run-id",
        warnings: ["Missing --dry-run-id"],
        next_steps: [
          "Run dry-run first and copy data.dry_run_id",
          "Retry with --dry-run-id <id>",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }

    if (typeof planFingerprint !== "string" || planFingerprint.trim().length === 0) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "batch execute real mode requires --plan-fingerprint",
        warnings: ["Missing --plan-fingerprint"],
        next_steps: [
          "Run dry-run first and copy data.plan_fingerprint",
          "Retry with --plan-fingerprint <sha256:...>",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }

    const res = await timeOperation(
      "batch.execute",
      () =>
        client.executeBatch({
          confirm: "EXECUTE_BATCH",
          dry_run_id: dryRunId.trim(),
          plan_fingerprint: planFingerprint.trim(),
          steps,
          request_id: commandRequestId,
        }),
      flags,
      commandRequestId,
    );
    console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
    return res.ok ? 0 : 1;
  }

  if (group === "object" && action === "create") {
    const typeRaw = readFlag(commandArgs, "--type");
    const name = readFlag(commandArgs, "--name");

    if (!typeRaw || !name) {
      const error = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "object create requires --type and --name",
        warnings: ["Missing required flags"],
        next_steps: [
          "Example: blendops object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(error, commandRequestId), null, 2));
      return 1;
    }

    try {
      const type = ObjectTypeSchema.parse(typeRaw);
      const location = parseVec3(readFlag(commandArgs, "--location"), [0, 0, 0]);
      const rotation = parseVec3(readFlag(commandArgs, "--rotation"), [0, 0, 0]);
      const scale = parseVec3(readFlag(commandArgs, "--scale"), [1, 1, 1]);

      const res = await timeOperation("object.create", () => client.createObject({
        type,
        name,
        location,
        rotation,
        scale,
        request_id: commandRequestId,
      }), flags, commandRequestId);

      console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
      return res.ok ? 0 : 1;
    } catch (error) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: error instanceof Error ? error.message : "Invalid object create arguments",
        warnings: ["Invalid --type or vec3 input"],
        next_steps: [
          "Allowed --type: cube, uv_sphere, ico_sphere, cylinder, cone, torus, plane",
          "Use vec3 format like --location 0,0,1",
        ],
        request_id: commandRequestId,
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }
  }

  if (group === "object" && action === "transform") {
    const name = readFlag(commandArgs, "--name");

    if (!name) {
      const error = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "object transform requires --name",
        warnings: ["Missing required flags"],
        next_steps: [
          "Example: blendops object transform --name test_cube --location 1,0,1",
        ],
      });
      console.log(JSON.stringify(withRequestId(error, commandRequestId), null, 2));
      return 1;
    }

    try {
      const hasLocation = commandArgs.includes("--location");
      const hasRotation = commandArgs.includes("--rotation");
      const hasScale = commandArgs.includes("--scale");

      if (!hasLocation && !hasRotation && !hasScale) {
        throw new Error("object transform requires at least one of --location, --rotation, or --scale");
      }

      const location = hasLocation ? parseVec3(readFlag(commandArgs, "--location"), [0, 0, 0]) : undefined;
      const rotation = hasRotation ? parseVec3(readFlag(commandArgs, "--rotation"), [0, 0, 0]) : undefined;
      const scale = hasScale ? parseVec3(readFlag(commandArgs, "--scale"), [1, 1, 1]) : undefined;

      const res = await timeOperation("object.transform", () => client.transformObject({
        name,
        location,
        rotation,
        scale,
        request_id: commandRequestId,
      }), flags, commandRequestId);

      console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
      return res.ok ? 0 : 1;
    } catch (error) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: error instanceof Error ? error.message : "Invalid object transform arguments",
        warnings: ["Invalid --name or vec3 input"],
        next_steps: [
          "Use --name plus at least one transform flag (--location, --rotation, --scale)",
          "Use vec3 format like --location 1,0,1",
        ],
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }
  }

  if (group === "material" && action === "create") {
    const name = readFlag(commandArgs, "--name");
    const colorRaw = readFlag(commandArgs, "--color");

    if (!name || !colorRaw) {
      const error = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "material create requires --name and --color",
        warnings: ["Missing required flags"],
        next_steps: [
          "Example: blendops material create --name red_plastic --color \"#ff0000\" --roughness 0.5 --metallic 0",
        ],
      });
      console.log(JSON.stringify(withRequestId(error, commandRequestId), null, 2));
      return 1;
    }

    try {
      const color = ColorHexSchema.parse(colorRaw);
      const roughness = parseNumericFlag(readFlag(commandArgs, "--roughness"), "--roughness", 0.5);
      const metallic = parseNumericFlag(readFlag(commandArgs, "--metallic"), "--metallic", 0);

      if (roughness < 0 || roughness > 1 || metallic < 0 || metallic > 1) {
        throw new Error("roughness and metallic must be between 0 and 1");
      }

      const res = await timeOperation("material.create", () => client.createMaterial({
        name,
        color,
        roughness,
        metallic,
        request_id: commandRequestId,
      }), flags, commandRequestId);

      console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
      return res.ok ? 0 : 1;
    } catch (error) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: error instanceof Error ? error.message : "Invalid material create arguments",
        warnings: ["Invalid material create input"],
        next_steps: [
          "Use --name and --color with hex format like #ff0000",
          "Use --roughness/--metallic values between 0 and 1",
        ],
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }
  }

  if (group === "material" && action === "apply") {
    const objectName = readFlag(commandArgs, "--object");
    const materialName = readFlag(commandArgs, "--material");

    if (!objectName || !materialName) {
      const error = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "material apply requires --object and --material",
        warnings: ["Missing required flags"],
        next_steps: [
          "Example: blendops material apply --object test_cube --material red_plastic",
        ],
      });
      console.log(JSON.stringify(withRequestId(error, commandRequestId), null, 2));
      return 1;
    }

    const res = await timeOperation("material.apply", () => client.applyMaterial({
      object_name: objectName,
      material_name: materialName,
      request_id: commandRequestId,
    }), flags, commandRequestId);

    console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
    return res.ok ? 0 : 1;
  }

  if (group === "lighting" && action === "setup") {
    const presetRaw = readFlag(commandArgs, "--preset");
    const target = readFlag(commandArgs, "--target");

    if (!presetRaw) {
      const error = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "lighting setup requires --preset",
        warnings: ["Missing required flags"],
        next_steps: [
          "Example: blendops lighting setup --preset studio",
          "Allowed presets: studio, three_point, soft_key",
        ],
      });
      console.log(JSON.stringify(withRequestId(error, commandRequestId), null, 2));
      return 1;
    }

    try {
      const preset = LightingPresetSchema.parse(presetRaw);
      const res = await timeOperation("lighting.setup", () => client.setupLighting({
        preset,
        target,
        request_id: commandRequestId,
      }), flags, commandRequestId);

      console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
      return res.ok ? 0 : 1;
    } catch (error) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: error instanceof Error ? error.message : "Invalid lighting setup arguments",
        warnings: ["Invalid preset or target"],
        next_steps: [
          "Allowed presets: studio, three_point, soft_key",
          "Use: blendops lighting setup --preset studio",
        ],
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }
  }

  if (group === "camera" && action === "set") {
    const target = readFlag(commandArgs, "--target");
    const hasLocation = commandArgs.includes("--location");
    const hasRotation = commandArgs.includes("--rotation");
    const hasDistance = commandArgs.includes("--distance");
    const hasFocalLength = commandArgs.includes("--focal-length");

    try {
      if (!target && !hasLocation) {
        throw new Error("camera set requires at least --target or --location");
      }

      const location = hasLocation ? parseVec3(readFlag(commandArgs, "--location"), [0, 0, 0]) : undefined;
      const rotation = hasRotation ? parseVec3(readFlag(commandArgs, "--rotation"), [0, 0, 0]) : undefined;

      if (hasLocation && !target && !hasRotation) {
        throw new Error("camera set requires --rotation when --location is provided without --target");
      }

      const distance = hasDistance ? parseNumericFlag(readFlag(commandArgs, "--distance"), "--distance", 0) : undefined;
      if (typeof distance !== "undefined" && distance <= 0) {
        throw new Error("--distance must be a positive number");
      }

      const focal_length = hasFocalLength ? parseNumericFlag(readFlag(commandArgs, "--focal-length"), "--focal-length", 0) : undefined;
      if (typeof focal_length !== "undefined" && focal_length <= 0) {
        throw new Error("--focal-length must be a positive number");
      }

      const res = await timeOperation("camera.set", () => client.setCamera({
        target,
        location,
        rotation,
        distance,
        focal_length,
        request_id: commandRequestId,
      }), flags, commandRequestId);

      console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
      return res.ok ? 0 : 1;
    } catch (error) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: error instanceof Error ? error.message : "Invalid camera set arguments",
        warnings: ["Invalid camera set input"],
        next_steps: [
          "Provide --target or --location",
          "If --location is provided without --target, include --rotation",
          "Use positive values for --distance and --focal-length",
          "Example: blendops camera set --target test_cube --distance 5 --focal-length 50",
        ],
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }
  }

  if (group === "render" && action === "preview") {
    try {
      const hasOutput = commandArgs.includes("--output");
      const hasWidth = commandArgs.includes("--width");
      const hasHeight = commandArgs.includes("--height");
      const hasSamples = commandArgs.includes("--samples");

      const output = hasOutput ? readFlag(commandArgs, "--output") : undefined;
      const width = hasWidth ? parseNumericFlag(readFlag(commandArgs, "--width"), "--width", 0) : undefined;
      const height = hasHeight ? parseNumericFlag(readFlag(commandArgs, "--height"), "--height", 0) : undefined;
      const samples = hasSamples ? parseNumericFlag(readFlag(commandArgs, "--samples"), "--samples", 0) : undefined;

      if (typeof width !== "undefined" && (width <= 0 || !Number.isInteger(width))) {
        throw new Error("--width must be a positive integer");
      }

      if (typeof height !== "undefined" && (height <= 0 || !Number.isInteger(height))) {
        throw new Error("--height must be a positive integer");
      }

      if (typeof samples !== "undefined" && (samples <= 0 || !Number.isInteger(samples))) {
        throw new Error("--samples must be a positive integer");
      }

      if (typeof output !== "undefined" && (!output.endsWith(".png"))) {
        throw new Error("--output must end with .png");
      }

      const res = await timeOperation("render.preview", () => client.renderPreview({
        output,
        width,
        height,
        samples,
        request_id: commandRequestId,
      }), flags, commandRequestId);

      console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
      return res.ok ? 0 : 1;
    } catch (error) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: error instanceof Error ? error.message : "Invalid render preview arguments",
        warnings: ["Invalid render preview input"],
        next_steps: [
          "Use positive integer values for --width, --height, and --samples",
          "Use .png extension for --output",
          "Example: blendops render preview --output renders/preview.png --width 512 --height 512 --samples 16",
        ],
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }
  }

  if (group === "validate" && action === "scene") {
    try {
      const hasPreset = commandArgs.includes("--preset");
      const presetRaw = hasPreset ? readFlag(commandArgs, "--preset") : undefined;
      const preset = typeof presetRaw === "undefined" ? "basic" : ValidationPresetSchema.parse(presetRaw);

      const res = await timeOperation("validate.scene", () => client.validateScene({
        preset,
        request_id: commandRequestId,
      }), flags, commandRequestId);

      console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
      return res.ok ? 0 : 1;
    } catch (error) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: error instanceof Error ? error.message : "Invalid validate scene arguments",
        warnings: ["Invalid validate scene input"],
        next_steps: [
          "Allowed presets: basic, game_asset, render_ready",
          "Example: blendops validate scene --preset game_asset",
        ],
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }
  }

  if (group === "export" && action === "asset") {
    try {
      const formatRaw = readFlag(commandArgs, "--format");
      const output = readFlag(commandArgs, "--output");
      const selected_only = commandArgs.includes("--selected-only");
      const apply_modifiers = !commandArgs.includes("--no-apply-modifiers");

      if (!formatRaw || !output) {
        throw new Error("export asset requires --format and --output");
      }

      const format = ExportAssetFormatSchema.parse(formatRaw);
      const expectedExtension = ExportAssetExtensionByFormat[format];
      if (!output.toLowerCase().endsWith(expectedExtension)) {
        throw new Error(`--output must end with ${expectedExtension} for format ${format}`);
      }

      const res = await timeOperation("export.asset", () => client.exportAsset({
        format,
        output,
        selected_only,
        apply_modifiers,
        request_id: commandRequestId,
      }), flags, commandRequestId);

      console.log(JSON.stringify(withRequestId(res, commandRequestId), null, 2));
      return res.ok ? 0 : 1;
    } catch (error) {
      const invalid = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: error instanceof Error ? error.message : "Invalid export asset arguments",
        warnings: ["Invalid export asset input"],
        next_steps: [
          "Allowed formats: glb, gltf, fbx",
          "Ensure --output extension matches --format",
          "Example: blendops export asset --format glb --output exports/test_scene.glb",
        ],
      });
      console.log(JSON.stringify(withRequestId(invalid, commandRequestId), null, 2));
      return 1;
    }
  }

  const error = makeResponse({
    ok: false,
    operation: "cli.command_not_found",
    message: `Unknown command: ${commandArgs.join(" ")}`,
    warnings: ["Unsupported command in MVP"],
    next_steps: [
      "Run `blendops --help` to see available commands",
      "Use bridge/undo/scene/object/material/lighting/camera/render/validate/export commands shown in help",
    ],
  });

  console.log(JSON.stringify(withRequestId(error, commandRequestId), null, 2));
  return 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    const res = makeResponse({
      ok: false,
      operation: "cli.unhandled_error",
      message: error instanceof Error ? error.message : "Unknown CLI error",
      warnings: ["Unhandled exception in CLI"],
      next_steps: ["Run `blendops bridge status` to verify bridge connectivity"],
      request_id: createRequestId(),
    });
    console.log(JSON.stringify(withRequestId(res, createRequestId()), null, 2));
    process.exitCode = 1;
  });
