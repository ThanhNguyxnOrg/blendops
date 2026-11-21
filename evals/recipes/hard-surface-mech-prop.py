import bpy
import math
from mathutils import Vector

# Developer-owned eval recipe, executed only in a disposable upstream Blender process.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 128
scene.cycles.use_denoising = True
scene.view_settings.view_transform = 'AgX'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

bpy.ops.mesh.primitive_cube_add(size=1)
body = bpy.context.object
body.name = 'Servo_Actuator_Prop'
body.scale = (1.6, 0.9, 0.65)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.22, depth=1.1, location=(0.47, 0, 0))
cutter = bpy.context.object
boolean = body.modifiers.new('Through bore', 'BOOLEAN')
boolean.operation = 'DIFFERENCE'
boolean.object = cutter
bpy.context.view_layer.objects.active = body
bpy.ops.object.modifier_apply(modifier=boolean.name)
bpy.data.objects.remove(cutter, do_unlink=True)
bevel = body.modifiers.new('Machined chamfers', 'BEVEL')
bevel.width = 0.045
bevel.segments = 3
bevel.use_clamp_overlap = True
weighted = body.modifiers.new('Weighted surface normals', 'WEIGHTED_NORMAL')
weighted.keep_sharp = True
bpy.ops.object.modifier_apply(modifier=bevel.name)
bpy.ops.object.modifier_apply(modifier=weighted.name)

bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.24, depth=0.8, location=(-0.48, 0, 0.55))
shaft = bpy.context.object
shaft.name = 'Steel_drive_shaft'
edge = shaft.modifiers.new('Shaft chamfer', 'BEVEL')
edge.width = 0.025
edge.segments = 3
bpy.ops.object.modifier_apply(modifier=edge.name)
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
triangulate = body.modifiers.new('Bake and export triangles', 'TRIANGULATE')
bpy.ops.object.modifier_apply(modifier=triangulate.name)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.008)
bpy.ops.object.mode_set(mode='OBJECT')

material = bpy.data.materials.new('Anodized metal')
material.use_nodes = True
nodes = material.node_tree.nodes
links = material.node_tree.links
bsdf = nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = (0.14, 0.19, 0.23, 1)
bsdf.inputs['Metallic'].default_value = 1
bsdf.inputs['Roughness'].default_value = 0.32
body.data.materials.clear()
body.data.materials.append(material)
normal = bpy.data.images.new('Actuator_Normal', width=2048, height=2048)
normal.colorspace_settings.name = 'Non-Color'
target = nodes.new('ShaderNodeTexImage')
target.image = normal
nodes.active = target
scene.render.bake.margin = 8
scene.cycles.samples = 16
bpy.ops.object.bake(type='NORMAL')
normal.pack()
normal_node = nodes.new('ShaderNodeNormalMap')
links.new(target.outputs['Color'], normal_node.inputs['Color'])
links.new(normal_node.outputs['Normal'], bsdf.inputs['Normal'])

ao = bpy.data.images.new('Actuator_AO', width=2048, height=2048)
ao.colorspace_settings.name = 'Non-Color'
ao_target = nodes.new('ShaderNodeTexImage')
ao_target.image = ao
nodes.active = ao_target
bpy.ops.object.bake(type='AO')
orm = bpy.data.images.new('Actuator_ORM', width=2048, height=2048)
orm.colorspace_settings.name = 'Non-Color'
pixels = list(ao.pixels[:])
for i in range(0, len(pixels), 4):
    pixels[i + 1] = 0.32
    pixels[i + 2] = 1.0
    pixels[i + 3] = 1.0
orm.pixels.foreach_set(pixels)
orm.pack()
ao_target.image = orm
separate = nodes.new('ShaderNodeSeparateColor')
links.new(ao_target.outputs['Color'], separate.inputs['Color'])
links.new(separate.outputs['Green'], bsdf.inputs['Roughness'])
links.new(separate.outputs['Blue'], bsdf.inputs['Metallic'])

scene.world.color = (0.15, 0.15, 0.15)
for location, power, size in [((2, -3, 4), 900, 4), ((-3, -1, 2), 300, 3), ((1, 3, 3), 600, 2)]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.data.energy = power
    light.data.shape = 'DISK'
    light.data.size = size
    light.rotation_euler = (-light.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add(location=(3, -4, 2.8))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 0.15)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.lens = 70
camera.data.clip_start = 0.02
camera.data.clip_end = 25
scene.camera = camera
scene.cycles.samples = 128
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
bpy.context.view_layer.objects.active = body
triangles = sum(len(p.vertices) - 2 for p in body.data.polygons)
assert triangles <= 28000, triangles
assert all(0 <= uv.uv.x <= 1 and 0 <= uv.uv.y <= 1 for uv in body.data.uv_layers.active.data)
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
bpy.ops.export_scene.gltf(filepath=GLB_PATH, export_format='GLB', use_selection=True, export_tangents=True)
scene.render.filepath = GLB_PATH.replace('.glb', '.png')
bpy.ops.render.render(write_still=True)
print('EVAL_RECIPE_COMPLETE triangles=' + str(triangles))
