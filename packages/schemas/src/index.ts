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

export const BridgeCommandSchema = z.discriminatedUnion("operation", [
  SceneInspectRequestSchema,
  ObjectCreateRequestSchema,
  ObjectTransformRequestSchema,
  MaterialCreateRequestSchema,
  MaterialApplyRequestSchema,
  LightingSetupRequestSchema,
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
