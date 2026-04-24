#!/usr/bin/env node

import { BridgeClient } from "@blendops/core";
import { makeResponse } from "@blendops/schemas";

function printHelp(): void {
  console.log(`BlendOps CLI\n\nUsage:\n  blendops bridge status\n  blendops scene inspect\n\nOptions:\n  --json        Output JSON (default)\n  -h, --help    Show help\n\nMVP Note:\n  Only 'scene inspect' and 'bridge status' are implemented in v0.1.`);
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

  const error = makeResponse({
    ok: false,
    operation: "cli.command_not_found",
    message: `Unknown command: ${args.join(" ")}`,
    warnings: ["Unsupported command in MVP"],
    next_steps: [
      "Run `blendops --help` to see available commands",
      "Use `blendops scene inspect` for the MVP vertical slice",
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
