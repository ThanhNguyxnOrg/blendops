import {
  BlendOpsResponseSchema,
  BridgeCommandSchema,
  makeResponse,
  type BlendOpsResponse,
  type BlendOpsReceipt,
  type BridgeCommand,
  type BridgeOperationsData,
  type MaterialApplyRequest,
  type MaterialCreateRequest,
  type LightingSetupRequest,
  type CameraSetRequest,
  type ObjectCreateRequest,
  type ObjectTransformRequest,
  type RenderPreviewRequest,
  type ValidateSceneRequest,
  type ExportAssetRequest,
} from "@blendops/schemas";

export interface BridgeClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  verbose?: boolean;
  quiet?: boolean;
  logger?: (message: string) => void;
  requestIdFactory?: () => string;
}

export class BridgeClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly verbose: boolean;
  private readonly quiet: boolean;
  private readonly logger: ((message: string) => void) | undefined;
  private readonly requestIdFactory: () => string;

  constructor(options: BridgeClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.BLENDER_BRIDGE_URL ?? "http://127.0.0.1:8765";
    this.timeoutMs = options.timeoutMs ?? 5_000;
    this.verbose = options.verbose ?? false;
    this.quiet = options.quiet ?? false;
    this.logger = options.logger;
    this.requestIdFactory = options.requestIdFactory ?? BridgeClient.defaultRequestIdFactory;
  }

  private static defaultRequestIdFactory(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private log(message: string): void {
    if (this.logger && !this.quiet) {
      this.logger(message);
    }
  }

  private static buildReceipt(request_id: string, operation: string, ok: boolean, duration_ms?: number): BlendOpsReceipt {
    return {
      request_id,
      operation,
      ok,
      duration_ms,
    };
  }

  async status(request_id?: string): Promise<BlendOpsResponse> {
    const resolvedRequestId = request_id ?? this.requestIdFactory();
    const response = await this.post("/status", { operation: "bridge.status", request_id: resolvedRequestId });
    const parsed = BlendOpsResponseSchema.parse(response);

    return {
      ...parsed,
      request_id: parsed.request_id ?? resolvedRequestId,
      receipt:
        parsed.receipt ??
        BridgeClient.buildReceipt(parsed.request_id ?? resolvedRequestId, parsed.operation, parsed.ok),
    };
  }

  async send(command: BridgeCommand): Promise<BlendOpsResponse> {
    const validated = BridgeCommandSchema.parse(command);
    const request_id = validated.request_id ?? this.requestIdFactory();
    const payloadWithRequestId = { ...validated, request_id };
    const response = await this.post("/command", payloadWithRequestId);
    const parsed = BlendOpsResponseSchema.parse(response);
    const responseRequestId = parsed.request_id ?? request_id;

    return {
      ...parsed,
      request_id: responseRequestId,
      receipt: parsed.receipt ?? BridgeClient.buildReceipt(responseRequestId, parsed.operation, parsed.ok),
    };
  }

  async inspectScene(request_id?: string): Promise<BlendOpsResponse> {
    return this.send({ operation: "scene.inspect", request_id });
  }

  async operations(request_id?: string): Promise<BlendOpsResponse> {
    return this.send({ operation: "bridge.operations", request_id });
  }

  async getOperationManifest(): Promise<BridgeOperationsData> {
    const response = await this.operations();
    if (!response.ok) {
      throw new Error(response.message);
    }

    const operations = response.data["operations"];
    if (!Array.isArray(operations)) {
      throw new Error("Bridge operations payload is missing operations array");
    }

    return {
      operations: operations.map((entry) => {
        if (typeof entry !== "object" || entry === null) {
          throw new Error("Bridge operations payload contains invalid operation entry");
        }

        const typed = entry as Record<string, unknown>;
        if (
          typeof typed["name"] !== "string" ||
          typeof typed["category"] !== "string" ||
          typeof typed["cli_supported"] !== "boolean" ||
          typeof typed["mcp_supported"] !== "boolean" ||
          typeof typed["destructive"] !== "boolean"
        ) {
          throw new Error("Bridge operations payload entry has invalid shape");
        }

        const runtimeNotes = typed["runtime_notes"];
        const evidenceDoc = typed["evidence_doc"];

        return {
          name: typed["name"],
          category: typed["category"],
          cli_supported: typed["cli_supported"],
          mcp_supported: typed["mcp_supported"],
          destructive: typed["destructive"],
          runtime_notes: typeof runtimeNotes === "string" ? runtimeNotes : undefined,
          evidence_doc: typeof evidenceDoc === "string" ? evidenceDoc : undefined,
        };
      }),
    };
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

  async setCamera(input: Omit<CameraSetRequest, "operation">): Promise<BlendOpsResponse> {
    return this.send({ operation: "camera.set", ...input });
  }

  async renderPreview(input: Partial<Omit<RenderPreviewRequest, "operation">> = {}): Promise<BlendOpsResponse> {
    return this.send({ operation: "render.preview", ...input });
  }

  async validateScene(input: Partial<Omit<ValidateSceneRequest, "operation">> = {}): Promise<BlendOpsResponse> {
    return this.send({ operation: "validate.scene", ...input });
  }

  async exportAsset(input: Omit<ExportAssetRequest, "operation">): Promise<BlendOpsResponse> {
    return this.send({ operation: "export.asset", ...input });
  }

  private async post(path: string, body: Record<string, unknown>): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const startedAt = Date.now();
    const operation = typeof body.operation === "string" ? body.operation : "unknown";
    const request_id = typeof body.request_id === "string" ? body.request_id : this.requestIdFactory();
    const payloadWithRequestId = { ...body, request_id };

    if (this.verbose) {
      this.log(`bridge request start: ${operation} ${path} request_id=${request_id}`);
      this.log(`bridge target: ${this.baseUrl}${path}`);
    }

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadWithRequestId),
        signal: controller.signal,
      });

      const json = (await res.json()) as unknown;
      const duration_ms = Date.now() - startedAt;

      if (!res.ok) {
        this.log(`bridge request failed: ${operation} ${path} status=${res.status} duration=${duration_ms}ms request_id=${request_id}`);
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
          request_id,
          receipt: BridgeClient.buildReceipt(request_id, operation, false, duration_ms),
        });
      }

      if (this.verbose) {
        this.log(`bridge request ok: ${operation} ${path} duration=${duration_ms}ms request_id=${request_id}`);
      }

      const parsed = BlendOpsResponseSchema.parse(json);
      const responseRequestId = parsed.request_id ?? request_id;
      const responseReceipt = parsed.receipt ?? BridgeClient.buildReceipt(responseRequestId, parsed.operation, parsed.ok, duration_ms);

      return {
        ...parsed,
        request_id: responseRequestId,
        receipt: responseReceipt,
      };
    } catch (error) {
      const duration_ms = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : "Unknown bridge error";
      this.log(`bridge connection error: ${operation} ${path} duration=${duration_ms}ms error=${message} request_id=${request_id}`);
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
        request_id,
        receipt: BridgeClient.buildReceipt(request_id, operation, false, duration_ms),
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
