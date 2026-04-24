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

export const ObjectCreateDataSchema = z.object({
  object: SceneObjectSchema,
});

export type SceneInspectRequest = z.infer<typeof SceneInspectRequestSchema>;
export type SceneInspectData = z.infer<typeof SceneInspectDataSchema>;
export type ObjectCreateRequest = z.infer<typeof ObjectCreateRequestSchema>;
export type ObjectCreateData = z.infer<typeof ObjectCreateDataSchema>;

export const BridgeCommandSchema = z.discriminatedUnion("operation", [
  SceneInspectRequestSchema,
  ObjectCreateRequestSchema,
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
