import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BridgeClient } from "@blendops/core";
import { ColorHexSchema, LightingPresetSchema, ObjectTypeSchema, Vec3Schema } from "@blendops/schemas";

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

const client = new BridgeClient();

type Vec3 = [number, number, number];

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
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;

  if (name === "inspect_scene") {
    const result = await client.inspectScene();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
      isError: !result.ok,
    };
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
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const payload = {
        ok: false,
        operation: "mcp.create_object.invalid_input",
        message: error instanceof Error ? error.message : "Invalid create_object input",
        data: {},
        warnings: ["Input validation failed for create_object"],
        next_steps: ["Provide type/name and valid vec3 arrays for location/rotation/scale"],
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
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const payload = {
        ok: false,
        operation: "mcp.transform_object.invalid_input",
        message: error instanceof Error ? error.message : "Invalid transform_object input",
        data: {},
        warnings: ["Input validation failed for transform_object"],
        next_steps: ["Provide name and at least one valid vec3 array for location/rotation/scale"],
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
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const payload = {
        ok: false,
        operation: "mcp.create_material.invalid_input",
        message: error instanceof Error ? error.message : "Invalid create_material input",
        data: {},
        warnings: ["Input validation failed for create_material"],
        next_steps: ["Provide name, color, and optional roughness/metallic values"],
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
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const payload = {
        ok: false,
        operation: "mcp.apply_material.invalid_input",
        message: error instanceof Error ? error.message : "Invalid apply_material input",
        data: {},
        warnings: ["Input validation failed for apply_material"],
        next_steps: ["Provide object_name and material_name"],
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
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (error) {
      const payload = {
        ok: false,
        operation: "mcp.setup_lighting.invalid_input",
        message: error instanceof Error ? error.message : "Invalid setup_lighting input",
        data: {},
        warnings: ["Input validation failed for setup_lighting"],
        next_steps: ["Provide preset from: studio, three_point, soft_key"],
      };

      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }
  }

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
            next_steps: ["Use tool `inspect_scene`, `create_object`, `transform_object`, `create_material`, `apply_material`, or `setup_lighting`"],
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
