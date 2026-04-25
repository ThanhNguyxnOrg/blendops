import { z } from "zod";

export const BlendOpsResponseSchema = z.object({
  ok: z.boolean(),
  operation: z.string(),
  message: z.string(),
  data: z.record(z.any()),
  warnings: z.array(z.string()),
  next_steps: z.array(z.string()),
});

export type BlendOpsResponse = z.infer<typeof BlendOpsResponseSchema>;

export const Vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
export const ColorHexSchema = z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Invalid hex color format");

export const SceneInspectRequestSchema = z.object({
  operation: z.literal("scene.inspect"),
  dryRun: z.boolean().optional(),
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
});

export const MaterialCreateRequestSchema = z.object({
  operation: z.literal("material.create"),
  name: z.string().min(1),
  color: z.union([ColorHexSchema, z.tuple([z.number(), z.number(), z.number(), z.number()])]),
  roughness: z.number().min(0).max(1).optional(),
  metallic: z.number().min(0).max(1).optional(),
});

export const MaterialApplyRequestSchema = z.object({
  operation: z.literal("material.apply"),
  object_name: z.string().min(1),
  material_name: z.string().min(1),
});

export const LightingPresetSchema = z.enum(["studio", "three_point", "soft_key"]);

export const LightingSetupRequestSchema = z.object({
  operation: z.literal("lighting.setup"),
  preset: LightingPresetSchema,
  target: z.string().min(1).optional(),
});

export const CameraSetRequestSchema = z.object({
  operation: z.literal("camera.set"),
  target: z.string().min(1).optional(),
  location: Vec3Schema.optional(),
  rotation: Vec3Schema.optional(),
  distance: z.number().positive().optional(),
  focal_length: z.number().positive().optional(),
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
}): BlendOpsResponse {
  return BlendOpsResponseSchema.parse({
    ok: input.ok,
    operation: input.operation,
    message: input.message,
    data: input.data ?? {},
    warnings: input.warnings ?? [],
    next_steps: input.next_steps ?? [],
  });
}
