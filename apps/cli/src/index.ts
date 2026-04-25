#!/usr/bin/env node

import { BridgeClient } from "@blendops/core";
import { ColorHexSchema, LightingPresetSchema, makeResponse, ObjectTypeSchema, Vec3Schema } from "@blendops/schemas";

function printHelp(): void {
  console.log(`BlendOps CLI

Usage:
  blendops bridge status
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

Options:
  --json        Output JSON (default)
  -h, --help    Show help

Implemented in v0.1:
  - bridge status
  - scene inspect
  - object create
  - object transform
  - material create
  - material apply
  - lighting setup
  - camera set
  - render preview`);
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

async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    printHelp();
    return 0;
  }

  const client = new BridgeClient();
  const [group, action] = args;

  if (group === "bridge" && action === "status") {
    const res = await client.status();
    console.log(JSON.stringify(res, null, 2));
    return res.ok ? 0 : 1;
  }

  if (group === "scene" && action === "inspect") {
    const res = await client.inspectScene();
    console.log(JSON.stringify(res, null, 2));
    return res.ok ? 0 : 1;
  }

  if (group === "object" && action === "create") {
    const typeRaw = readFlag(args, "--type");
    const name = readFlag(args, "--name");

    if (!typeRaw || !name) {
      const error = makeResponse({
        ok: false,
        operation: "cli.invalid_arguments",
        message: "object create requires --type and --name",
        warnings: ["Missing required flags"],
        next_steps: [
          "Example: blendops object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1",
        ],
      });
      console.log(JSON.stringify(error, null, 2));
      return 1;
    }

    try {
      const type = ObjectTypeSchema.parse(typeRaw);
      const location = parseVec3(readFlag(args, "--location"), [0, 0, 0]);
      const rotation = parseVec3(readFlag(args, "--rotation"), [0, 0, 0]);
      const scale = parseVec3(readFlag(args, "--scale"), [1, 1, 1]);

      const res = await client.createObject({
        type,
        name,
        location,
        rotation,
        scale,
      });

      console.log(JSON.stringify(res, null, 2));
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
      });
      console.log(JSON.stringify(invalid, null, 2));
      return 1;
    }
  }

  if (group === "object" && action === "transform") {
    const name = readFlag(args, "--name");

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
      console.log(JSON.stringify(error, null, 2));
      return 1;
    }

    try {
      const hasLocation = args.includes("--location");
      const hasRotation = args.includes("--rotation");
      const hasScale = args.includes("--scale");

      if (!hasLocation && !hasRotation && !hasScale) {
        throw new Error("object transform requires at least one of --location, --rotation, or --scale");
      }

      const location = hasLocation ? parseVec3(readFlag(args, "--location"), [0, 0, 0]) : undefined;
      const rotation = hasRotation ? parseVec3(readFlag(args, "--rotation"), [0, 0, 0]) : undefined;
      const scale = hasScale ? parseVec3(readFlag(args, "--scale"), [1, 1, 1]) : undefined;

      const res = await client.transformObject({
        name,
        location,
        rotation,
        scale,
      });

      console.log(JSON.stringify(res, null, 2));
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
      console.log(JSON.stringify(invalid, null, 2));
      return 1;
    }
  }

  if (group === "material" && action === "create") {
    const name = readFlag(args, "--name");
    const colorRaw = readFlag(args, "--color");

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
      console.log(JSON.stringify(error, null, 2));
      return 1;
    }

    try {
      const color = ColorHexSchema.parse(colorRaw);
      const roughness = parseNumericFlag(readFlag(args, "--roughness"), "--roughness", 0.5);
      const metallic = parseNumericFlag(readFlag(args, "--metallic"), "--metallic", 0);

      if (roughness < 0 || roughness > 1 || metallic < 0 || metallic > 1) {
        throw new Error("roughness and metallic must be between 0 and 1");
      }

      const res = await client.createMaterial({
        name,
        color,
        roughness,
        metallic,
      });

      console.log(JSON.stringify(res, null, 2));
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
      console.log(JSON.stringify(invalid, null, 2));
      return 1;
    }
  }

  if (group === "material" && action === "apply") {
    const objectName = readFlag(args, "--object");
    const materialName = readFlag(args, "--material");

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
      console.log(JSON.stringify(error, null, 2));
      return 1;
    }

    const res = await client.applyMaterial({
      object_name: objectName,
      material_name: materialName,
    });

    console.log(JSON.stringify(res, null, 2));
    return res.ok ? 0 : 1;
  }

  if (group === "lighting" && action === "setup") {
    const presetRaw = readFlag(args, "--preset");
    const target = readFlag(args, "--target");

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
      console.log(JSON.stringify(error, null, 2));
      return 1;
    }

    try {
      const preset = LightingPresetSchema.parse(presetRaw);
      const res = await client.setupLighting({
        preset,
        target,
      });

      console.log(JSON.stringify(res, null, 2));
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
      console.log(JSON.stringify(invalid, null, 2));
      return 1;
    }
  }

  if (group === "camera" && action === "set") {
    const target = readFlag(args, "--target");
    const hasLocation = args.includes("--location");
    const hasRotation = args.includes("--rotation");
    const hasDistance = args.includes("--distance");
    const hasFocalLength = args.includes("--focal-length");

    try {
      if (!target && !hasLocation) {
        throw new Error("camera set requires at least --target or --location");
      }

      const location = hasLocation ? parseVec3(readFlag(args, "--location"), [0, 0, 0]) : undefined;
      const rotation = hasRotation ? parseVec3(readFlag(args, "--rotation"), [0, 0, 0]) : undefined;

      if (hasLocation && !target && !hasRotation) {
        throw new Error("camera set requires --rotation when --location is provided without --target");
      }

      const distance = hasDistance ? parseNumericFlag(readFlag(args, "--distance"), "--distance", 0) : undefined;
      if (typeof distance !== "undefined" && distance <= 0) {
        throw new Error("--distance must be a positive number");
      }

      const focal_length = hasFocalLength ? parseNumericFlag(readFlag(args, "--focal-length"), "--focal-length", 0) : undefined;
      if (typeof focal_length !== "undefined" && focal_length <= 0) {
        throw new Error("--focal-length must be a positive number");
      }

      const res = await client.setCamera({
        target,
        location,
        rotation,
        distance,
        focal_length,
      });

      console.log(JSON.stringify(res, null, 2));
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
      console.log(JSON.stringify(invalid, null, 2));
      return 1;
    }
  }

  if (group === "render" && action === "preview") {
    try {
      const hasOutput = args.includes("--output");
      const hasWidth = args.includes("--width");
      const hasHeight = args.includes("--height");
      const hasSamples = args.includes("--samples");

      const output = hasOutput ? readFlag(args, "--output") : undefined;
      const width = hasWidth ? parseNumericFlag(readFlag(args, "--width"), "--width", 0) : undefined;
      const height = hasHeight ? parseNumericFlag(readFlag(args, "--height"), "--height", 0) : undefined;
      const samples = hasSamples ? parseNumericFlag(readFlag(args, "--samples"), "--samples", 0) : undefined;

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

      const res = await client.renderPreview({
        output,
        width,
        height,
        samples,
      });

      console.log(JSON.stringify(res, null, 2));
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
      console.log(JSON.stringify(invalid, null, 2));
      return 1;
    }
  }

  const error = makeResponse({
    ok: false,
    operation: "cli.command_not_found",
    message: `Unknown command: ${args.join(" ")}`,
    warnings: ["Unsupported command in MVP"],
    next_steps: [
      "Run `blendops --help` to see available commands",
      "Use scene/object/material/lighting/camera commands shown in help",
    ],
  });

  console.log(JSON.stringify(error, null, 2));
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
    });
    console.log(JSON.stringify(res, null, 2));
    process.exitCode = 1;
  });
