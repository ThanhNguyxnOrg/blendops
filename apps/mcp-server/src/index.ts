import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BridgeClient, getBridgeLogsLifecycle, startBridgeLifecycle, stopBridgeLifecycle } from "@blendops/core";
import { ColorHexSchema, ExportAssetExtensionByFormat, ExportAssetFormatSchema, LightingPresetSchema, ObjectTypeSchema, ValidationPresetSchema, Vec3Schema } from "@blendops/schemas";

const MCP_VERBOSE = process.env.BLENDOPS_MCP_VERBOSE === "1" || process.env.BLENDOPS_VERBOSE === "1";

function mcpLog(message: string): void {
  if (MCP_VERBOSE) {
    process.stderr.write(`[BlendOps MCP] ${message}\n`);
  }
}

const server = new Server(
  {
    name: "blendops-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const client = new BridgeClient({
  verbose: MCP_VERBOSE,
  logger: (message: string) => mcpLog(message),
});

type Vec3 = [number, number, number];

function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function parseRequiredVec3(input: unknown, field: "location" | "rotation" | "scale"): Vec3 {
  if (!Array.isArray(input) || input.length !== 3) {
    throw new Error(`Invalid ${field}: expected an array of 3 numbers`);
  }

  const parsed: Vec3 = [Number(input[0]), Number(input[1]), Number(input[2])];
  if (parsed.some((entry) => Number.isNaN(entry))) {
    throw new Error(`Invalid ${field}: all values must be numbers`);
  }

  return Vec3Schema.parse(parsed);
}

function parseOptionalVec3(input: unknown, field: "location" | "rotation" | "scale"): Vec3 | undefined {
  if (typeof input === "undefined") {
    return undefined;
  }

  return parseRequiredVec3(input, field);
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "inspect_scene",
      description: "Inspect Blender scene and return structured summary.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: "clear_scene",
      description: "Clear scene objects (destructive) with explicit confirmation token; supports dry_run preview.",
      inputSchema: {
        type: "object",
        properties: {
          confirm: { type: "string", enum: ["CLEAR_SCENE"] },
          dry_run: { type: "boolean" },
        },
        required: ["confirm"],
        additionalProperties: false,
      },
    },
    {
      name: "undo_last",
      description: "Undo the last undoable Blender scene operation.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: "list_operations",
      description: "List BlendOps operation manifest and compatibility notes.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: "start_bridge",
      description: "Start managed Blender bridge process using safe lifecycle helper.",
      inputSchema: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["gui", "background"] },
          blender_path: { type: "string" },
          timeout_ms: { type: "number", minimum: 1 },
          poll_interval_ms: { type: "number", minimum: 1 },
        },
        additionalProperties: false,
      },
    },
    {
      name: "stop_bridge",
      description: "Stop managed Blender bridge process tracked by BlendOps lifecycle state.",
      inputSchema: {
        type: "object",
        properties: {
          all: { type: "boolean" },
        },
        additionalProperties: false,
      },
    },
    {
      name: "get_bridge_logs",
      description: "Read managed bridge stdout/stderr log tails.",
      inputSchema: {
        type: "object",
        properties: {
          tail: { type: "number", minimum: 1 },
        },
        additionalProperties: false,
      },
    },
    {
      name: "create_object",
      description: "Create a primitive mesh object in Blender scene.",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["cube", "uv_sphere", "ico_sphere", "cylinder", "cone", "torus", "plane"],
          },
          name: { type: "string" },
          location: {
            type: "array",
            items: { type: "number" },
            minItems: 3,
            maxItems: 3,
          },
          rotation: {
            type: "array",
            items: { type: "number" },
            minItems: 3,
            maxItems: 3,
          },
          scale: {
            type: "array",
            items: { type: "number" },
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ["type", "name"],
        additionalProperties: false,
      },
    },
    {
      name: "transform_object",
      description: "Transform an existing object by name in Blender scene.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          location: {
            type: "array",
            items: { type: "number" },
            minItems: 3,
            maxItems: 3,
          },
          rotation: {
            type: "array",
            items: { type: "number" },
            minItems: 3,
            maxItems: 3,
          },
          scale: {
            type: "array",
            items: { type: "number" },
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
    {
      name: "create_material",
      description: "Create a material with base color and optional roughness/metallic.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          color: {
            oneOf: [
              { type: "string", pattern: "^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$" },
              {
                type: "array",
                items: { type: "number" },
                minItems: 4,
                maxItems: 4,
              },
            ],
          },
          roughness: { type: "number", minimum: 0, maximum: 1 },
          metallic: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["name", "color"],
        additionalProperties: false,
      },
    },
    {
      name: "apply_material",
      description: "Apply an existing material to an existing object.",
      inputSchema: {
        type: "object",
        properties: {
          object_name: { type: "string" },
          material_name: { type: "string" },
        },
        required: ["object_name", "material_name"],
        additionalProperties: false,
      },
    },
    {
      name: "setup_lighting",
      description: "Setup scene lighting using a preset with optional target object.",
      inputSchema: {
        type: "object",
        properties: {
          preset: {
            type: "string",
            enum: ["studio", "three_point", "soft_key"],
          },
          target: { type: "string" },
        },
        required: ["preset"],
        additionalProperties: false,
      },
    },
    {
      name: "set_camera",
      description: "Set camera position/target and focal length.",
      inputSchema: {
        type: "object",
        properties: {
          target: { type: "string" },
          location: {
            type: "array",
            items: { type: "number" },
            minItems: 3,
            maxItems: 3,
          },
          rotation: {
            type: "array",
            items: { type: "number" },
            minItems: 3,
            maxItems: 3,
          },
          distance: { type: "number", exclusiveMinimum: 0 },
          focal_length: { type: "number", exclusiveMinimum: 0 },
        },
        additionalProperties: false,
      },
    },
    {
      name: "render_preview",
      description: "Render a preview image of the current scene.",
      inputSchema: {
        type: "object",
        properties: {
          output: { type: "string" },
          width: { type: "number", minimum: 1 },
          height: { type: "number", minimum: 1 },
          samples: { type: "number", minimum: 1 },
        },
        additionalProperties: false,
      },
    },
    {
      name: "validate_scene",
      description: "Validate scene against a preset (basic, game_asset, render_ready).",
      inputSchema: {
        type: "object",
        properties: {
          preset: {
            type: "string",
            enum: ["basic", "game_asset", "render_ready"],
          },
        },
        additionalProperties: false,
      },
    },
    {
      name: "export_asset",
      description: "Export asset to glb/gltf/fbx file.",
      inputSchema: {
        type: "object",
        properties: {
          format: {
            type: "string",
            enum: ["glb", "gltf", "fbx"],
          },
          output: { type: "string" },
          selected_only: { type: "boolean" },
          apply_modifiers: { type: "boolean" },
        },
        required: ["format", "output"],
        additionalProperties: false,
      },
    },
    {
      name: "plan_batch",
      description: "Validate and summarize a multi-step BlendOps plan without executing any step.",
      inputSchema: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            minItems: 1,
            maxItems: 25,
            items: {
              type: "object",
            },
          },
        },
        required: ["steps"],
        additionalProperties: false,
      },
    },
    {
      name: "execute_batch",
      description: "Preview batch execution with dry-run validation (real execution not implemented).",
      inputSchema: {
        type: "object",
        properties: {
          dry_run: {
            type: "boolean",
            enum: [true],
          },
          steps: {
            type: "array",
            minItems: 1,
            maxItems: 25,
            items: {
              type: "object",
            },
          },
        },
        required: ["dry_run", "steps"],
        additionalProperties: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;
  const start = Date.now();
  const request_id = createRequestId();

  mcpLog(`tool call: ${name} request_id=${request_id}`);

  if (name === "inspect_scene") {
    const result = await client.inspectScene(request_id);
    const duration = Date.now() - start;
    mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
        },
      ],
      isError: !result.ok,
    };
  }

  if (name === "clear_scene") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;
      const confirm = args.confirm;

      let dry_run = false;
      if (typeof args.dry_run !== "undefined") {
        if (typeof args.dry_run !== "boolean") {
          throw new Error("dry_run must be boolean");
        }
        dry_run = args.dry_run;
      }

      if (confirm !== "CLEAR_SCENE") {
        const duration = Date.now() - start;
        mcpLog(`tool error: ${name} duration=${duration}ms error=invalid_confirm request_id=${request_id}`);
        const payload = {
          ok: false,
          operation: "mcp.clear_scene.invalid_input",
          message: "clear_scene requires confirm=CLEAR_SCENE",
          data: {},
          warnings: ["Missing or incorrect confirmation token for destructive operation"],
          next_steps: [
            "Call inspect_scene before clear_scene to verify current state",
            "Retry with confirm: CLEAR_SCENE (optionally set dry_run: true)",
          ],
          request_id,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
          isError: true,
        };
      }

      const result = await client.clearScene({
        confirm,
        dry_run,
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.clear_scene.invalid_input",
        message: error instanceof Error ? error.message : "Invalid clear_scene input",
        data: {},
        warnings: ["Input validation failed for clear_scene"],
        next_steps: ["Provide confirm with exact value CLEAR_SCENE"],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "undo_last") {
    const result = await client.undoLast({ request_id });
    const duration = Date.now() - start;
    mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
        },
      ],
      isError: !result.ok,
    };
  }

  if (name === "list_operations") {
    const result = await client.operations(request_id);
    const duration = Date.now() - start;
    mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
        },
      ],
      isError: !result.ok,
    };
  }

  if (name === "start_bridge") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;
      const modeRaw = typeof args.mode === "string" ? args.mode : "gui";
      if (modeRaw !== "gui" && modeRaw !== "background") {
        throw new Error("start_bridge mode must be gui or background");
      }

      const blender_path = typeof args.blender_path === "string" && args.blender_path.trim().length > 0
        ? args.blender_path.trim()
        : undefined;

      const timeout_ms = typeof args.timeout_ms === "number" && Number.isFinite(args.timeout_ms)
        ? Math.max(1, Math.floor(args.timeout_ms))
        : undefined;

      const poll_interval_ms = typeof args.poll_interval_ms === "number" && Number.isFinite(args.poll_interval_ms)
        ? Math.max(1, Math.floor(args.poll_interval_ms))
        : undefined;

      const lifecycle = await startBridgeLifecycle({
        mode: modeRaw,
        root_dir: process.cwd(),
        logger: (message: string) => mcpLog(message),
        ...(typeof blender_path === "string" ? { blender_path } : {}),
        ...(typeof timeout_ms === "number" ? { timeout_ms } : {}),
        ...(typeof poll_interval_ms === "number" ? { poll_interval_ms } : {}),
      });

      const duration = Date.now() - start;
      const payload = {
        ok: lifecycle.ok,
        operation: "bridge.start",
        message: lifecycle.message,
        data: lifecycle.data,
        warnings: lifecycle.warnings,
        next_steps: lifecycle.next_steps,
        request_id,
        receipt: {
          request_id,
          operation: "bridge.start",
          ok: lifecycle.ok,
          duration_ms: duration,
        },
      };

      mcpLog(`tool result: ${name} ok=${lifecycle.ok} duration=${duration}ms request_id=${request_id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: !lifecycle.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.start_bridge.invalid_input",
        message: error instanceof Error ? error.message : "Invalid start_bridge input",
        data: {},
        warnings: ["Input validation failed for start_bridge"],
        next_steps: ["Use mode gui/background and optional blender_path"],
        request_id,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "stop_bridge") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;
      const all = typeof args.all === "boolean" ? args.all : false;

      const lifecycle = stopBridgeLifecycle({
        all,
        root_dir: process.cwd(),
        logger: (message: string) => mcpLog(message),
      });

      const duration = Date.now() - start;
      const payload = {
        ok: lifecycle.ok,
        operation: "bridge.stop",
        message: lifecycle.message,
        data: lifecycle.data,
        warnings: lifecycle.warnings,
        next_steps: lifecycle.next_steps,
        request_id,
        receipt: {
          request_id,
          operation: "bridge.stop",
          ok: lifecycle.ok,
          duration_ms: duration,
        },
      };

      mcpLog(`tool result: ${name} ok=${lifecycle.ok} duration=${duration}ms request_id=${request_id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: !lifecycle.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.stop_bridge.invalid_input",
        message: error instanceof Error ? error.message : "Invalid stop_bridge input",
        data: {},
        warnings: ["Input validation failed for stop_bridge"],
        next_steps: ["Use optional all=true only when intentional"],
        request_id,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "get_bridge_logs") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;
      const tail = typeof args.tail === "number" && Number.isFinite(args.tail)
        ? Math.max(1, Math.floor(args.tail))
        : undefined;

      const lifecycle = getBridgeLogsLifecycle({
        root_dir: process.cwd(),
        ...(typeof tail === "number" ? { tail } : {}),
      });

      const duration = Date.now() - start;
      const payload = {
        ok: lifecycle.ok,
        operation: "bridge.logs",
        message: lifecycle.message,
        data: lifecycle.data,
        warnings: lifecycle.warnings,
        next_steps: lifecycle.next_steps,
        request_id,
        receipt: {
          request_id,
          operation: "bridge.logs",
          ok: lifecycle.ok,
          duration_ms: duration,
        },
      };

      mcpLog(`tool result: ${name} ok=${lifecycle.ok} duration=${duration}ms request_id=${request_id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: !lifecycle.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.get_bridge_logs.invalid_input",
        message: error instanceof Error ? error.message : "Invalid get_bridge_logs input",
        data: {},
        warnings: ["Input validation failed for get_bridge_logs"],
        next_steps: ["Use optional tail positive integer"],
        request_id,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "create_object") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;

      if (typeof args.type !== "string" || args.type.trim().length === 0) {
        throw new Error("Missing required field: type");
      }

      if (typeof args.name !== "string" || args.name.trim().length === 0) {
        throw new Error("Missing required field: name");
      }

      const type = ObjectTypeSchema.parse(args.type.trim());
      const objectName = args.name.trim();

      const result = await client.createObject({
        type,
        name: objectName,
        location: parseOptionalVec3(args.location, "location") ?? [0, 0, 0],
        rotation: parseOptionalVec3(args.rotation, "rotation") ?? [0, 0, 0],
        scale: parseOptionalVec3(args.scale, "scale") ?? [1, 1, 1],
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.create_object.invalid_input",
        message: error instanceof Error ? error.message : "Invalid create_object input",
        data: {},
        warnings: ["Input validation failed for create_object"],
        next_steps: ["Provide type/name and valid vec3 arrays for location/rotation/scale"],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "transform_object") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;

      if (typeof args.name !== "string" || args.name.trim().length === 0) {
        throw new Error("Missing required field: name");
      }

      const hasLocation = typeof args.location !== "undefined";
      const hasRotation = typeof args.rotation !== "undefined";
      const hasScale = typeof args.scale !== "undefined";

      if (!hasLocation && !hasRotation && !hasScale) {
        throw new Error("transform_object requires at least one of location, rotation, or scale");
      }

      const result = await client.transformObject({
        name: args.name.trim(),
        location: hasLocation ? parseRequiredVec3(args.location, "location") : undefined,
        rotation: hasRotation ? parseRequiredVec3(args.rotation, "rotation") : undefined,
        scale: hasScale ? parseRequiredVec3(args.scale, "scale") : undefined,
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.transform_object.invalid_input",
        message: error instanceof Error ? error.message : "Invalid transform_object input",
        data: {},
        warnings: ["Input validation failed for transform_object"],
        next_steps: ["Provide name and at least one valid vec3 array for location/rotation/scale"],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "create_material") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;

      if (typeof args.name !== "string" || args.name.trim().length === 0) {
        throw new Error("Missing required field: name");
      }

      if (typeof args.color === "undefined") {
        throw new Error("Missing required field: color");
      }

      let color: string | [number, number, number, number];
      if (typeof args.color === "string") {
        color = ColorHexSchema.parse(args.color.trim());
      } else if (Array.isArray(args.color) && args.color.length === 4) {
        const parsed = [Number(args.color[0]), Number(args.color[1]), Number(args.color[2]), Number(args.color[3])] as [number, number, number, number];
        if (parsed.some((entry) => Number.isNaN(entry) || entry < 0 || entry > 1)) {
          throw new Error("Invalid color: RGBA values must be numbers between 0 and 1");
        }
        color = parsed;
      } else {
        throw new Error("Invalid color: expected hex string or RGBA array");
      }

      const roughness = typeof args.roughness === "undefined" ? 0.5 : Number(args.roughness);
      const metallic = typeof args.metallic === "undefined" ? 0 : Number(args.metallic);

      if (Number.isNaN(roughness) || Number.isNaN(metallic)) {
        throw new Error("roughness and metallic must be numbers");
      }
      if (roughness < 0 || roughness > 1 || metallic < 0 || metallic > 1) {
        throw new Error("roughness and metallic must be between 0 and 1");
      }

      const result = await client.createMaterial({
        name: args.name.trim(),
        color,
        roughness,
        metallic,
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.create_material.invalid_input",
        message: error instanceof Error ? error.message : "Invalid create_material input",
        data: {},
        warnings: ["Input validation failed for create_material"],
        next_steps: ["Provide name, color, and optional roughness/metallic values"],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "apply_material") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;

      if (typeof args.object_name !== "string" || args.object_name.trim().length === 0) {
        throw new Error("Missing required field: object_name");
      }

      if (typeof args.material_name !== "string" || args.material_name.trim().length === 0) {
        throw new Error("Missing required field: material_name");
      }

      const result = await client.applyMaterial({
        object_name: args.object_name.trim(),
        material_name: args.material_name.trim(),
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.apply_material.invalid_input",
        message: error instanceof Error ? error.message : "Invalid apply_material input",
        data: {},
        warnings: ["Input validation failed for apply_material"],
        next_steps: ["Provide object_name and material_name"],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "setup_lighting") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;

      if (typeof args.preset !== "string") {
        throw new Error("Missing required field: preset");
      }

      const preset = LightingPresetSchema.parse(args.preset);

      let target: string | undefined;
      if (typeof args.target !== "undefined") {
        if (typeof args.target !== "string" || args.target.trim().length === 0) {
          throw new Error("Invalid target: expected non-empty string");
        }
        target = args.target.trim();
      }

      const result = await client.setupLighting({
        preset,
        target,
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.setup_lighting.invalid_input",
        message: error instanceof Error ? error.message : "Invalid setup_lighting input",
        data: {},
        warnings: ["Input validation failed for setup_lighting"],
        next_steps: ["Provide preset from: studio, three_point, soft_key"],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "set_camera") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;

      const hasTarget = typeof args.target !== "undefined";
      const hasLocation = typeof args.location !== "undefined";
      const hasRotation = typeof args.rotation !== "undefined";
      const hasDistance = typeof args.distance !== "undefined";
      const hasFocalLength = typeof args.focal_length !== "undefined";

      let target: string | undefined;
      if (hasTarget) {
        if (typeof args.target !== "string" || args.target.trim().length === 0) {
          throw new Error("Invalid target: expected non-empty string");
        }
        target = args.target.trim();
      }

      if (!hasTarget && !hasLocation) {
        throw new Error("set_camera requires at least target or location");
      }

      const location = hasLocation ? parseRequiredVec3(args.location, "location") : undefined;
      const rotation = hasRotation ? parseRequiredVec3(args.rotation, "rotation") : undefined;

      if (hasLocation && !hasTarget && !hasRotation) {
        throw new Error("set_camera requires rotation when location is provided without target");
      }

      let distance: number | undefined;
      if (hasDistance) {
        distance = Number(args.distance);
        if (Number.isNaN(distance) || distance <= 0) {
          throw new Error("distance must be a positive number");
        }
      }

      let focal_length: number | undefined;
      if (hasFocalLength) {
        focal_length = Number(args.focal_length);
        if (Number.isNaN(focal_length) || focal_length <= 0) {
          throw new Error("focal_length must be a positive number");
        }
      }

      const result = await client.setCamera({
        target,
        location,
        rotation,
        distance,
        focal_length,
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.set_camera.invalid_input",
        message: error instanceof Error ? error.message : "Invalid set_camera input",
        data: {},
        warnings: ["Input validation failed for set_camera"],
        next_steps: [
          "Provide at least target or location",
          "If location is provided without target, provide rotation",
          "Use positive distance and focal_length values",
        ],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "render_preview") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;

      let output: string | undefined;
      if (typeof args.output !== "undefined") {
        if (typeof args.output !== "string" || args.output.trim().length === 0) {
          throw new Error("Invalid output: expected non-empty string");
        }
        if (!args.output.endsWith(".png")) {
          throw new Error("Invalid output: must end with .png");
        }
        output = args.output.trim();
      }

      let width: number | undefined;
      if (typeof args.width !== "undefined") {
        width = Number(args.width);
        if (Number.isNaN(width) || width <= 0 || !Number.isInteger(width)) {
          throw new Error("width must be a positive integer");
        }
      }

      let height: number | undefined;
      if (typeof args.height !== "undefined") {
        height = Number(args.height);
        if (Number.isNaN(height) || height <= 0 || !Number.isInteger(height)) {
          throw new Error("height must be a positive integer");
        }
      }

      let samples: number | undefined;
      if (typeof args.samples !== "undefined") {
        samples = Number(args.samples);
        if (Number.isNaN(samples) || samples <= 0 || !Number.isInteger(samples)) {
          throw new Error("samples must be a positive integer");
        }
      }

      const result = await client.renderPreview({
        output,
        width,
        height,
        samples,
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.render_preview.invalid_input",
        message: error instanceof Error ? error.message : "Invalid render_preview input",
        data: {},
        warnings: ["Input validation failed for render_preview"],
        next_steps: [
          "Provide positive integer values for width, height, and samples",
          "Use .png extension for output",
          "Example: render_preview with output='renders/preview.png', width=512, height=512, samples=16",
        ],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "validate_scene") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;

      let preset: "basic" | "game_asset" | "render_ready" = "basic";
      if (typeof args.preset !== "undefined") {
        if (typeof args.preset !== "string") {
          throw new Error("Invalid preset: expected string");
        }
        preset = ValidationPresetSchema.parse(args.preset);
      }

      const result = await client.validateScene({
        preset,
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.validate_scene.invalid_input",
        message: error instanceof Error ? error.message : "Invalid validate_scene input",
        data: {},
        warnings: ["Input validation failed for validate_scene"],
        next_steps: [
          "Provide preset from: basic, game_asset, render_ready",
          "Example: validate_scene with preset='game_asset'",
        ],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "export_asset") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;

      if (typeof args.format !== "string") {
        throw new Error("Missing required field: format");
      }
      if (typeof args.output !== "string" || args.output.trim().length === 0) {
        throw new Error("Missing required field: output");
      }

      const format = ExportAssetFormatSchema.parse(args.format);
      const output = args.output.trim();
      const expectedExtension = ExportAssetExtensionByFormat[format];
      if (!output.toLowerCase().endsWith(expectedExtension)) {
        throw new Error(`output must end with ${expectedExtension} for format ${format}`);
      }

      let selected_only = false;
      if (typeof args.selected_only !== "undefined") {
        if (typeof args.selected_only !== "boolean") {
          throw new Error("selected_only must be boolean");
        }
        selected_only = args.selected_only;
      }

      let apply_modifiers = true;
      if (typeof args.apply_modifiers !== "undefined") {
        if (typeof args.apply_modifiers !== "boolean") {
          throw new Error("apply_modifiers must be boolean");
        }
        apply_modifiers = args.apply_modifiers;
      }

      const result = await client.exportAsset({
        format,
        output,
        selected_only,
        apply_modifiers,
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.export_asset.invalid_input",
        message: error instanceof Error ? error.message : "Invalid export_asset input",
        data: {},
        warnings: ["Input validation failed for export_asset"],
        next_steps: [
          "Provide format from: glb, gltf, fbx",
          "Provide output with extension matching format",
          "Example: export_asset with format='glb' and output='exports/test_scene.glb'",
        ],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "plan_batch") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;
      const steps = args.steps;

      if (!Array.isArray(steps)) {
        throw new Error("Missing required field: steps array");
      }
      if (steps.length < 1 || steps.length > 25) {
        throw new Error("steps length must be between 1 and 25");
      }

      for (const step of steps) {
        if (typeof step !== "object" || step === null || Array.isArray(step)) {
          throw new Error("each step must be an object");
        }
      }

      const result = await client.planBatch({
        steps,
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.plan_batch.invalid_input",
        message: error instanceof Error ? error.message : "Invalid plan_batch input",
        data: {
          executable: false,
        },
        warnings: ["Input validation failed for plan_batch"],
        next_steps: [
          "Provide steps as an array of 1..25 objects",
          "Use typed BlendOps operations only",
        ],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  if (name === "execute_batch") {
    try {
      const args = (rawArgs ?? {}) as Record<string, unknown>;
      const dry_run = args.dry_run;
      const steps = args.steps;

      if (dry_run !== true) {
        const duration = Date.now() - start;
        mcpLog(`tool error: ${name} duration=${duration}ms error=invalid_dry_run request_id=${request_id}`);
        const payload = {
          ok: false,
          operation: "mcp.execute_batch.invalid_input",
          message: "execute_batch requires dry_run=true; real execution is not implemented",
          data: {
            dry_run: typeof dry_run === "boolean" ? dry_run : null,
            executable: false,
          },
          warnings: ["dry_run must be true"],
          next_steps: [
            "Set dry_run to true",
            "Provide steps as an array of 1..25 objects",
          ],
          request_id,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
          isError: true,
        };
      }

      if (!Array.isArray(steps)) {
        throw new Error("Missing required field: steps array");
      }
      if (steps.length < 1 || steps.length > 25) {
        throw new Error("steps length must be between 1 and 25");
      }

      for (const step of steps) {
        if (typeof step !== "object" || step === null || Array.isArray(step)) {
          throw new Error("each step must be an object");
        }
      }

      const result = await client.executeBatch({
        dry_run: true,
        steps,
        request_id,
      });

      const duration = Date.now() - start;
      mcpLog(`tool result: ${name} ok=${result.ok} duration=${duration}ms request_id=${result.request_id ?? request_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...result, request_id: result.request_id ?? request_id }, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const duration = Date.now() - start;
      mcpLog(`tool error: ${name} duration=${duration}ms error=${error instanceof Error ? error.message : "unknown"} request_id=${request_id}`);
      const payload = {
        ok: false,
        operation: "mcp.execute_batch.invalid_input",
        message: error instanceof Error ? error.message : "Invalid execute_batch input",
        data: {
          executable: false,
        },
        warnings: ["Input validation failed for execute_batch"],
        next_steps: [
          "Set dry_run to true",
          "Provide steps as an array of 1..25 objects",
        ],
        request_id,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

  mcpLog(`tool error: ${name} duration=${Date.now() - start}ms error=tool_not_found request_id=${request_id}`);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            ok: false,
            operation: "mcp.tool_not_found",
            message: `Unknown tool: ${name}`,
            data: {},
            warnings: ["Tool not implemented in MVP"],
            next_steps: ["Use tool `inspect_scene`, `clear_scene`, `undo_last`, `list_operations`, `start_bridge`, `stop_bridge`, `get_bridge_logs`, `create_object`, `transform_object`, `create_material`, `apply_material`, `setup_lighting`, `set_camera`, `render_preview`, `validate_scene`, `export_asset`, `plan_batch`, or `execute_batch`"],
            request_id,
          },
          null,
          2,
        ),
      },
    ],
    isError: true,
  };
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start BlendOps MCP server:", error);
  process.exit(1);
});
