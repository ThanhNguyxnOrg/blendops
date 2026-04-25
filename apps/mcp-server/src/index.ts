import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BridgeClient } from "@blendops/core";
import { ObjectTypeSchema, Vec3Schema } from "@blendops/schemas";

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

function parseOptionalVec3(input: unknown, fallback: Vec3, field: "location" | "rotation" | "scale"): Vec3 {
  if (typeof input === "undefined") {
    return fallback;
  }

  if (!Array.isArray(input) || input.length !== 3) {
    throw new Error(`Invalid ${field}: expected an array of 3 numbers`);
  }

  const parsed: Vec3 = [Number(input[0]), Number(input[1]), Number(input[2])];
  if (parsed.some((entry) => Number.isNaN(entry))) {
    throw new Error(`Invalid ${field}: all values must be numbers`);
  }

  return Vec3Schema.parse(parsed);
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
        location: parseOptionalVec3(args.location, [0, 0, 0], "location"),
        rotation: parseOptionalVec3(args.rotation, [0, 0, 0], "rotation"),
        scale: parseOptionalVec3(args.scale, [1, 1, 1], "scale"),
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
            next_steps: ["Use tool `inspect_scene` or `create_object`"],
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
