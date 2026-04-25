import {
  BlendOpsResponseSchema,
  BridgeCommandSchema,
  makeResponse,
  type BlendOpsResponse,
  type BridgeCommand,
  type MaterialApplyRequest,
  type MaterialCreateRequest,
  type LightingSetupRequest,
  type ObjectCreateRequest,
  type ObjectTransformRequest,
} from "@blendops/schemas";

export interface BridgeClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export class BridgeClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: BridgeClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.BLENDER_BRIDGE_URL ?? "http://127.0.0.1:8765";
    this.timeoutMs = options.timeoutMs ?? 5_000;
  }

  async status(): Promise<BlendOpsResponse> {
    const response = await this.post("/status", { operation: "bridge.status" });
    return BlendOpsResponseSchema.parse(response);
  }

  async send(command: BridgeCommand): Promise<BlendOpsResponse> {
    const validated = BridgeCommandSchema.parse(command);
    const response = await this.post("/command", validated);
    return BlendOpsResponseSchema.parse(response);
  }

  async inspectScene(): Promise<BlendOpsResponse> {
    return this.send({ operation: "scene.inspect" });
  }

  async createObject(input: Omit<ObjectCreateRequest, "operation">): Promise<BlendOpsResponse> {
    return this.send({ operation: "object.create", ...input });
  }

  async transformObject(input: Omit<ObjectTransformRequest, "operation">): Promise<BlendOpsResponse> {
    return this.send({ operation: "object.transform", ...input });
  }

  async createMaterial(input: Omit<MaterialCreateRequest, "operation">): Promise<BlendOpsResponse> {
    return this.send({ operation: "material.create", ...input });
  }

  async applyMaterial(input: Omit<MaterialApplyRequest, "operation">): Promise<BlendOpsResponse> {
    return this.send({ operation: "material.apply", ...input });
  }

  async setupLighting(input: Omit<LightingSetupRequest, "operation">): Promise<BlendOpsResponse> {
    return this.send({ operation: "lighting.setup", ...input });
  }

  private async post(path: string, body: Record<string, unknown>): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const json = (await res.json()) as unknown;

      if (!res.ok) {
        return makeResponse({
          ok: false,
          operation: "bridge.error",
          message: `Bridge request failed with status ${res.status}`,
          data: { status: res.status, body: json },
          warnings: ["Bridge returned non-2xx status"],
          next_steps: [
            "Ensure Blender addon bridge is running",
            "Run `blendops bridge status`",
          ],
        });
      }

      return json;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown bridge error";
      return makeResponse({
        ok: false,
        operation: "bridge.error",
        message: `Failed to connect to Blender bridge: ${message}`,
        warnings: [
          "Blender bridge might not be running",
          "Connection timed out or was refused",
        ],
        next_steps: [
          "Start Blender and enable BlendOps addon bridge",
          "Run `blendops bridge status` to verify connection",
        ],
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
