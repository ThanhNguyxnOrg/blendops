#!/usr/bin/env node

import { BridgeClient } from "@blendops/core";
import { appendFileSync, mkdirSync } from "node:fs";
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
  blendops bridge status
  blendops bridge operations
  blendops scene inspect
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

Options:
  --verbose, -v  Show detailed progress logs (stderr)
  --quiet, -q    Suppress progress logs
  --json         Output JSON (default)
  -h, --help     Show help

Implemented in v0.1:
  - bridge status
  - bridge operations
  - scene inspect
  - object create
  - object transform
  - material create
  - material apply
  - lighting setup
  - camera set
  - render preview
  - validate scene
  - export asset`);
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
      "Use scene/object/material/lighting/camera commands shown in help",
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
