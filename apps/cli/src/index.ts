#!/usr/bin/env node

import { BridgeClient } from "@blendops/core";
import { makeResponse, ObjectTypeSchema, Vec3Schema } from "@blendops/schemas";

function printHelp(): void {
  console.log(`BlendOps CLI

Usage:
  blendops bridge status
  blendops scene inspect
  blendops object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1

Options:
  --json        Output JSON (default)
  -h, --help    Show help

Implemented in v0.1:
  - bridge status
  - scene inspect
  - object create`);
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

  const error = makeResponse({
    ok: false,
    operation: "cli.command_not_found",
    message: `Unknown command: ${args.join(" ")}`,
    warnings: ["Unsupported command in MVP"],
    next_steps: [
      "Run `blendops --help` to see available commands",
      "Use `blendops scene inspect` or `blendops object create`",
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
