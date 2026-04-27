import { z } from "zod";

export const BlendOpsReceiptSchema = z.object({
  request_id: z.string(),
  operation: z.string(),
  ok: z.boolean(),
  duration_ms: z.number().int().nonnegative().optional(),
});

export type BlendOpsReceipt = z.infer<typeof BlendOpsReceiptSchema>;

export const BlendOpsResponseSchema = z.object({
  ok: z.boolean(),
  operation: z.string(),
  message: z.string(),
  data: z.record(z.any()),
  warnings: z.array(z.string()),
  next_steps: z.array(z.string()),
  request_id: z.string().optional(),
  receipt: BlendOpsReceiptSchema.optional(),
});

export type BlendOpsResponse = z.infer<typeof BlendOpsResponseSchema>;

export const Vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
export const ColorHexSchema = z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Invalid hex color format");

export const SceneInspectRequestSchema = z.object({
  operation: z.literal("scene.inspect"),
  dryRun: z.boolean().optional(),
  request_id: z.string().optional(),
});

export const BridgeOperationsRequestSchema = z.object({
  operation: z.literal("bridge.operations"),
  request_id: z.string().optional(),
});

export const BridgeStartModeSchema = z.enum(["gui", "background"]);

export const BridgeStartRequestSchema = z.object({
  operation: z.literal("bridge.start"),
  mode: BridgeStartModeSchema.optional(),
  blender_path: z.string().min(1).optional(),
  timeout_ms: z.number().int().positive().optional(),
  poll_interval_ms: z.number().int().positive().optional(),
  request_id: z.string().optional(),
});

export const BridgeStopRequestSchema = z.object({
  operation: z.literal("bridge.stop"),
  all: z.boolean().optional(),
  request_id: z.string().optional(),
});

export const BridgeLogsRequestSchema = z.object({
  operation: z.literal("bridge.logs"),
  tail: z.number().int().positive().optional(),
  request_id: z.string().optional(),
});

export const UndoLastRequestSchema = z.object({
  operation: z.literal("undo.last"),
  request_id: z.string().optional(),
});

export const UndoLastDataSchema = z.object({
  undone: z.boolean(),
  detail: z.string().optional(),
});

export const SceneClearRequestSchema = z.object({
  operation: z.literal("scene.clear"),
  confirm: z.literal("CLEAR_SCENE"),
  dry_run: z.boolean().optional(),
  request_id: z.string().optional(),
});

export const SceneClearDataSchema = z.object({
  removed_objects: z.number().int().nonnegative(),
  removed_meshes: z.number().int().nonnegative().optional(),
  removed_materials: z.number().int().nonnegative().optional(),
  remaining_objects: z.number().int().nonnegative(),
  dry_run: z.boolean().optional(),
  would_remove_objects: z.number().int().nonnegative().optional(),
  would_remove_meshes: z.number().int().nonnegative().optional(),
});

export const BatchPlanStepSchema = z
  .object({
    operation: z.string().min(1),
  })
  .passthrough();

export const BatchPlanRequestSchema = z.object({
  operation: z.literal("batch.plan"),
  steps: z.array(BatchPlanStepSchema).min(1).max(25),
  request_id: z.string().optional(),
});

export const BatchPlanValidationErrorSchema = z.object({
  step: z.number().int().positive().nullable(),
  operation: z.string().optional(),
  field: z.string().optional(),
  error: z.string(),
});

export const BatchPlanDataSchema = z.object({
  step_count: z.number().int().nonnegative(),
  operations: z.array(z.string()),
  destructive_steps: z.number().int().nonnegative(),
  requires_confirmation: z.boolean(),
  unsupported_operations: z.array(z.string()),
  valid: z.boolean(),
  executable: z.literal(false),
  notes: z.array(z.string()),
  validation_errors: z.array(BatchPlanValidationErrorSchema).optional(),
});

export const BatchExecuteRequestSchema = z.object({
  operation: z.literal("batch.execute"),
  dry_run: z.literal(true),
  steps: z.array(BatchPlanStepSchema).min(1).max(25),
  request_id: z.string().optional(),
});

export const BatchExecuteStepPreviewSchema = z.object({
  step: z.number().int().positive(),
  operation: z.string(),
  effect: z.string(),
});

export const BatchExecuteDataSchema = z.object({
  dry_run: z.literal(true),
  executable: z.literal(false),
  step_count: z.number().int().nonnegative(),
  operations: z.array(z.string()),
  valid: z.boolean(),
  would_execute: z.array(BatchExecuteStepPreviewSchema),
  destructive_steps: z.number().int().nonnegative(),
  requires_confirmation: z.boolean(),
  validation_errors: z.array(BatchPlanValidationErrorSchema).optional(),
  notes: z.array(z.string()),
});

export const OperationManifestEntrySchema = z.object({
  name: z.string(),
  category: z.string(),
  cli_supported: z.boolean(),
  mcp_supported: z.boolean(),
  destructive: z.boolean(),
  runtime_notes: z.string().optional(),
  evidence_doc: z.string().optional(),
});

export const BridgeOperationsDataSchema = z.object({
  operations: z.array(OperationManifestEntrySchema),
});

export const ObjectTypeSchema = z.enum([
  "cube",
  "uv_sphere",
  "ico_sphere",
  "cylinder",
  "cone",
  "torus",
  "plane",
]);

export const ObjectCreateRequestSchema = z.object({
  operation: z.literal("object.create"),
  type: ObjectTypeSchema,
  name: z.string().min(1),
  location: Vec3Schema.optional(),
  rotation: Vec3Schema.optional(),
  scale: Vec3Schema.optional(),
  request_id: z.string().optional(),
});

export const SceneObjectSchema = z.object({
  name: z.string(),
  type: z.string(),
  location: Vec3Schema,
  rotation: Vec3Schema,
  scale: Vec3Schema,
  materials: z.array(z.string()),
});

export const SceneInspectDataSchema = z.object({
  objects: z.array(SceneObjectSchema),
  cameras: z.array(z.string()),
  lights: z.array(z.string()),
  materials: z.array(z.string()),
  active_camera: z.string().nullable(),
  unit_settings: z.string().optional(),
  stats: z
    .object({
      object_count: z.number(),
      mesh_count: z.number().optional(),
      poly_estimate: z.number().optional(),
    })
    .optional(),
});

export const ObjectTransformRequestSchema = z.object({
  operation: z.literal("object.transform"),
  name: z.string().min(1),
  location: Vec3Schema.optional(),
  rotation: Vec3Schema.optional(),
  scale: Vec3Schema.optional(),
  request_id: z.string().optional(),
});

export const MaterialCreateRequestSchema = z.object({
  operation: z.literal("material.create"),
  name: z.string().min(1),
  color: z.union([ColorHexSchema, z.tuple([z.number(), z.number(), z.number(), z.number()])]),
  roughness: z.number().min(0).max(1).optional(),
  metallic: z.number().min(0).max(1).optional(),
  request_id: z.string().optional(),
});

export const MaterialApplyRequestSchema = z.object({
  operation: z.literal("material.apply"),
  object_name: z.string().min(1),
  material_name: z.string().min(1),
  request_id: z.string().optional(),
});

export const LightingPresetSchema = z.enum(["studio", "three_point", "soft_key"]);

export const LightingSetupRequestSchema = z.object({
  operation: z.literal("lighting.setup"),
  preset: LightingPresetSchema,
  target: z.string().min(1).optional(),
  request_id: z.string().optional(),
});

export const CameraSetRequestSchema = z.object({
  operation: z.literal("camera.set"),
  target: z.string().min(1).optional(),
  location: Vec3Schema.optional(),
  rotation: Vec3Schema.optional(),
  distance: z.number().positive().optional(),
  focal_length: z.number().positive().optional(),
  request_id: z.string().optional(),
});

export const ObjectCreateDataSchema = z.object({
  object: SceneObjectSchema,
});

export const ObjectTransformDataSchema = z.object({
  object: SceneObjectSchema,
});

export const MaterialCreateDataSchema = z.object({
  material: z.object({
    name: z.string(),
    color: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    roughness: z.number(),
    metallic: z.number(),
  }),
});

export const MaterialApplyDataSchema = z.object({
  object: SceneObjectSchema,
  material: z.object({
    name: z.string(),
  }),
});

export const LightingSetupDataSchema = z.object({
  preset: LightingPresetSchema,
  target: z.string().optional(),
  lights: z.array(z.string()),
});

export const CameraSetDataSchema = z.object({
  camera: z.object({
    name: z.string(),
    location: Vec3Schema,
    rotation: Vec3Schema,
    focal_length: z.number(),
  }),
  target: z.string().nullable(),
  active_camera: z.string(),
});

export const RenderPreviewDefaults = {
  output: "renders/preview.png",
  width: 512,
  height: 512,
  samples: 32,
} as const;

export const RenderPreviewRequestSchema = z.object({
  operation: z.literal("render.preview"),
  output: z
    .string()
    .min(1)
    .refine((value) => value.toLowerCase().endsWith(".png"), "output must end with .png")
    .optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  samples: z.number().int().positive().optional(),
  request_id: z.string().optional(),
});

export const RenderPreviewDataSchema = z.object({
  output: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  samples: z.number().int().positive(),
  camera: z.string().nullable(),
});

export const ValidationPresetSchema = z.enum(["basic", "game_asset", "render_ready"]);

export const ValidateSceneRequestSchema = z.object({
  operation: z.literal("validate.scene"),
  preset: ValidationPresetSchema.optional(),
  request_id: z.string().optional(),
});

export const ValidationCheckSchema = z.object({
  id: z.string(),
  status: z.enum(["pass", "warn", "fail"]),
  message: z.string(),
  details: z.record(z.any()),
});

export const ValidateSceneDataSchema = z.object({
  preset: ValidationPresetSchema,
  passed: z.boolean(),
  checks: z.array(ValidationCheckSchema),
  summary: z.object({
    pass: z.number(),
    warn: z.number(),
    fail: z.number(),
  }),
});

export const ExportAssetFormatSchema = z.enum(["glb", "gltf", "fbx"]);

export const ExportAssetExtensionByFormat = {
  glb: ".glb",
  gltf: ".gltf",
  fbx: ".fbx",
} as const;

export const ExportAssetRequestSchema = z.object({
  operation: z.literal("export.asset"),
  format: ExportAssetFormatSchema,
  output: z.string().min(1),
  selected_only: z.boolean().optional(),
  apply_modifiers: z.boolean().optional(),
  request_id: z.string().optional(),
});

export const ExportAssetDataSchema = z.object({
  format: ExportAssetFormatSchema,
  output: z.string().min(1),
  selected_only: z.boolean(),
  apply_modifiers: z.boolean(),
  file_exists: z.boolean(),
  file_size_bytes: z.number().int().nonnegative(),
});

export type SceneInspectRequest = z.infer<typeof SceneInspectRequestSchema>;
export type SceneInspectData = z.infer<typeof SceneInspectDataSchema>;
export type BridgeOperationsRequest = z.infer<typeof BridgeOperationsRequestSchema>;
export type BridgeStartMode = z.infer<typeof BridgeStartModeSchema>;
export type BridgeStartRequest = z.infer<typeof BridgeStartRequestSchema>;
export type BridgeStopRequest = z.infer<typeof BridgeStopRequestSchema>;
export type BridgeLogsRequest = z.infer<typeof BridgeLogsRequestSchema>;
export type UndoLastRequest = z.infer<typeof UndoLastRequestSchema>;
export type UndoLastData = z.infer<typeof UndoLastDataSchema>;
export type SceneClearRequest = z.infer<typeof SceneClearRequestSchema>;
export type SceneClearData = z.infer<typeof SceneClearDataSchema>;
export type BatchPlanStep = z.infer<typeof BatchPlanStepSchema>;
export type BatchPlanRequest = z.infer<typeof BatchPlanRequestSchema>;
export type BatchPlanValidationError = z.infer<typeof BatchPlanValidationErrorSchema>;
export type BatchPlanData = z.infer<typeof BatchPlanDataSchema>;
export type BatchExecuteRequest = z.infer<typeof BatchExecuteRequestSchema>;
export type BatchExecuteStepPreview = z.infer<typeof BatchExecuteStepPreviewSchema>;
export type BatchExecuteData = z.infer<typeof BatchExecuteDataSchema>;
export type OperationManifestEntry = z.infer<typeof OperationManifestEntrySchema>;
export type BridgeOperationsData = z.infer<typeof BridgeOperationsDataSchema>;
export type ObjectCreateRequest = z.infer<typeof ObjectCreateRequestSchema>;
export type ObjectCreateData = z.infer<typeof ObjectCreateDataSchema>;
export type ObjectTransformRequest = z.infer<typeof ObjectTransformRequestSchema>;
export type ObjectTransformData = z.infer<typeof ObjectTransformDataSchema>;
export type MaterialCreateRequest = z.infer<typeof MaterialCreateRequestSchema>;
export type MaterialCreateData = z.infer<typeof MaterialCreateDataSchema>;
export type MaterialApplyRequest = z.infer<typeof MaterialApplyRequestSchema>;
export type MaterialApplyData = z.infer<typeof MaterialApplyDataSchema>;
export type LightingSetupRequest = z.infer<typeof LightingSetupRequestSchema>;
export type LightingSetupData = z.infer<typeof LightingSetupDataSchema>;
export type CameraSetRequest = z.infer<typeof CameraSetRequestSchema>;
export type CameraSetData = z.infer<typeof CameraSetDataSchema>;
export type RenderPreviewRequest = z.infer<typeof RenderPreviewRequestSchema>;
export type RenderPreviewData = z.infer<typeof RenderPreviewDataSchema>;
export type ValidateSceneRequest = z.infer<typeof ValidateSceneRequestSchema>;
export type ValidateSceneData = z.infer<typeof ValidateSceneDataSchema>;
export type ValidationPreset = z.infer<typeof ValidationPresetSchema>;
export type ExportAssetFormat = z.infer<typeof ExportAssetFormatSchema>;
export type ExportAssetRequest = z.infer<typeof ExportAssetRequestSchema>;
export type ExportAssetData = z.infer<typeof ExportAssetDataSchema>;

export const BridgeCommandSchema = z.discriminatedUnion("operation", [
  SceneInspectRequestSchema,
  SceneClearRequestSchema,
  BridgeOperationsRequestSchema,
  BridgeStartRequestSchema,
  BridgeStopRequestSchema,
  BridgeLogsRequestSchema,
  UndoLastRequestSchema,
  BatchPlanRequestSchema,
  BatchExecuteRequestSchema,
  ObjectCreateRequestSchema,
  ObjectTransformRequestSchema,
  MaterialCreateRequestSchema,
  MaterialApplyRequestSchema,
  LightingSetupRequestSchema,
  CameraSetRequestSchema,
  RenderPreviewRequestSchema,
  ValidateSceneRequestSchema,
  ExportAssetRequestSchema,
]);
export type BridgeCommand = z.infer<typeof BridgeCommandSchema>;

export function makeResponse(input: {
  ok: boolean;
  operation: string;
  message: string;
  data?: Record<string, unknown>;
  warnings?: string[];
  next_steps?: string[];
  request_id?: string;
  receipt?: BlendOpsReceipt;
}): BlendOpsResponse {
  return BlendOpsResponseSchema.parse({
    ok: input.ok,
    operation: input.operation,
    message: input.message,
    data: input.data ?? {},
    warnings: input.warnings ?? [],
    next_steps: input.next_steps ?? [],
    request_id: input.request_id,
    receipt: input.receipt,
  });
}
