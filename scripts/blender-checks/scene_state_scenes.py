"""Build the synthetic scenes the scene-state check is tested on.

Run: blender -b --factory-startup --python-exit-code 1 --python scene_state_scenes.py -- <out_dir>
Writes scene1.blend .. scene5.blend; see docs/evals/cli-fallback-scene-state.md for what each holds.
"""
import bpy, bmesh, json, math, os, sys
from mathutils import Matrix

out = sys.argv[sys.argv.index("--") + 1]
os.makedirs(out, exist_ok=True)


def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def save(name):
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, name))


def cube(name, size, loc):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return o


def node_group(name):
    g = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    g.interface.new_socket("Geometry", in_out='INPUT', socket_type='NodeSocketGeometry')
    g.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
    return g, g.nodes.new('NodeGroupInput'), g.nodes.new('NodeGroupOutput')


def metaball(scene, name, loc, mat, elements=True):
    mb = bpy.data.metaballs.new(name)
    if elements:
        mb.resolution = 0.05
        mb.elements.new().radius = 0.3
    if mat:
        mb.materials.append(mat)
    ob = bpy.data.objects.new(name, mb)
    ob.location = loc
    scene.collection.objects.link(ob)


def camera(scene, loc, rot, lens=50):
    cd = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Camera", cd)
    scene.collection.objects.link(cam)
    cam.location, cam.rotation_euler, cd.lens = loc, rot, lens
    scene.camera = cam


# Scene 1: planted problems
sc = fresh()
mat = bpy.data.materials.new("M")
cube("Box", (1, 1, 1), (0, 0, 0.5)).data.materials.append(mat)
cube("Top", (0.5, 0.5, 0.5), (0, 0, 1.25)).data.materials.append(mat)
cube("Floater", (0.3, 0.3, 0.3), (2, 0, 1.0)).data.materials.append(mat)
inv = cube("Inverted", (0.5, 0.5, 0.5), (-2, 0, 0.25))
bm = bmesh.new(); bm.from_mesh(inv.data); bmesh.ops.reverse_faces(bm, faces=bm.faces); bm.to_mesh(inv.data); bm.free()
inv.data.materials.append(None)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.3, location=(0, 2, 0.3))
ball = bpy.context.active_object; ball.name = "Ball"; ball.rotation_euler = (0.6, 0.3, 0); ball.data.materials.append(mat)
lamp = cube("Lamp", (0.2, 0.2, 0.2), (0, -2, 0.1)); lamp.data.materials.append(mat)
bm = bmesh.new(); bm.from_mesh(lamp.data); bmesh.ops.create_cube(bm, size=0.1, matrix=Matrix.Translation((0, -2, 0.6))); bm.to_mesh(lamp.data); bm.free()
bpy.ops.mesh.primitive_cube_add(size=1, location=(4, 0, 0.5))
empty = bpy.context.active_object; empty.name = "Empty_Mesh"
empty.modifiers.new("w", 'MASK').vertex_group = "none"
bpy.ops.object.light_add(type='AREA', location=(3, -3, 4)); bpy.context.active_object.name = "Key"
camera(sc, (0, -8, 2), (math.radians(85), 0, 0))
save("scene1.blend")

# Scene 2: a beveled curve, a Geometry Nodes scatter of instances only, a 251,001-vertex grid
sc = fresh()
mat = bpy.data.materials.new("M")
bpy.ops.curve.primitive_bezier_circle_add(radius=0.5, location=(0, 0, 0.05))
ring = bpy.context.active_object; ring.name = "Ring"; ring.data.bevel_depth = 0.05; ring.data.materials.append(mat)
bpy.ops.mesh.primitive_plane_add(size=1, location=(2, 0, 0)); scatter = bpy.context.active_object; scatter.name = "Scatter"
g, gi, go = node_group("Scatter")
pts, box, iop = g.nodes.new('GeometryNodeMeshToPoints'), g.nodes.new('GeometryNodeMeshCube'), g.nodes.new('GeometryNodeInstanceOnPoints')
box.inputs["Size"].default_value = (0.2, 0.2, 0.2)
g.links.new(gi.outputs[0], pts.inputs["Mesh"]); g.links.new(pts.outputs[0], iop.inputs["Points"])
g.links.new(box.outputs[0], iop.inputs["Instance"]); g.links.new(iop.outputs[0], go.inputs[0])
scatter.modifiers.new("GN", 'NODES').node_group = g
bpy.ops.mesh.primitive_grid_add(x_subdivisions=500, y_subdivisions=500, size=1, location=(-2, 0, 0.3))
heavy = bpy.context.active_object; heavy.name = "Heavy"; heavy.data.materials.append(mat)
camera(sc, (0, -8, 2), (math.radians(85), 0, 0))
save("scene2.blend")

# Scene 3: unit scale 0.01, so a 100-unit cube is 1 m
sc = fresh()
sc.unit_settings.scale_length = 0.01
bpy.ops.mesh.primitive_cube_add(size=100, location=(0, 0, 50))
bpy.context.active_object.name = "CmBox"
bpy.context.active_object.data.materials.append(bpy.data.materials.new("M"))
camera(sc, (0, -800, 200), (math.radians(85), 0, 0))
save("scene3.blend")

# Scene 4: instances, metaball families, node materials and a turned bar
sc = fresh()
mat = bpy.data.materials.new("M")
bpy.ops.mesh.primitive_plane_add(size=1, location=(2, 0, 0))
peb = bpy.context.object; peb.name = "Pebbles"; peb.data.materials.append(mat)
g, i, o = node_group("Pebbles")
n = g.nodes
pts = n.new('GeometryNodeMeshToPoints'); sph = n.new('GeometryNodeMeshUVSphere'); sph.inputs['Radius'].default_value = 0.1
iop = n.new('GeometryNodeInstanceOnPoints'); iop.inputs['Rotation'].default_value = (math.radians(45), math.radians(45), 0)
tr = n.new('GeometryNodeTranslateInstances'); tr.inputs['Translation'].default_value = (0, 0, 0.1); tr.inputs['Local Space'].default_value = False
join = n.new('GeometryNodeJoinGeometry')
g.links.new(i.outputs[0], pts.inputs['Mesh']); g.links.new(pts.outputs[0], iop.inputs['Points'])
g.links.new(sph.outputs['Mesh'], iop.inputs['Instance']); g.links.new(iop.outputs[0], tr.inputs[0])
g.links.new(i.outputs[0], join.inputs[0]); g.links.new(tr.outputs[0], join.inputs[0]); g.links.new(join.outputs[0], o.inputs[0])
peb.modifiers.new("GN", 'NODES').node_group = g
# a mesh with no material that also makes an instance and has a loose part above it
bpy.ops.mesh.primitive_cube_add(size=0.5, location=(-2, 0, 0.25)); mi = bpy.context.object; mi.name = "Unshaded"
bpy.ops.mesh.primitive_cube_add(size=0.2, location=(-2, 0, 1.5)); part = bpy.context.object
bpy.ops.object.select_all(action='DESELECT'); part.select_set(True); mi.select_set(True)
bpy.context.view_layer.objects.active = mi; bpy.ops.object.join()
g, i, o = node_group("Side")
n = g.nodes
pt = n.new('GeometryNodePoints'); pt.inputs['Position'].default_value = (1.0, 0, -0.15)
cu = n.new('GeometryNodeMeshCube'); cu.inputs['Size'].default_value = (0.2, 0.2, 0.2)
iop = n.new('GeometryNodeInstanceOnPoints'); join = n.new('GeometryNodeJoinGeometry')
g.links.new(pt.outputs[0], iop.inputs['Points']); g.links.new(cu.outputs['Mesh'], iop.inputs['Instance'])
g.links.new(i.outputs[0], join.inputs[0]); g.links.new(iop.outputs[0], join.inputs[0]); g.links.new(join.outputs[0], o.inputs[0])
mi.modifiers.new("GN", 'NODES').node_group = g
metaball(sc, "Blob", (0.0, 2, 0.3), mat)
metaball(sc, "Blob.001", (0.4, 2, 0.3), mat)
bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.1)); bar = bpy.context.object; bar.name = "Bar"; bar.data.materials.append(mat)
bar.scale = (2.6, 0.05, 0.1); bpy.ops.object.transform_apply(scale=True); bar.rotation_euler.z = math.radians(45)
camera(sc, (0, 0, 10), (0, 0, math.radians(45)))
sc.render.resolution_x, sc.render.resolution_y = 1000, 300
bpy.ops.mesh.primitive_cube_add(size=0.4, location=(-3.5, 0, 0.2)); gm = bpy.context.object; gm.name = "NodeShaded"
g, i, o = node_group("Shade")
sm = g.nodes.new('GeometryNodeSetMaterial'); sm.inputs['Material'].default_value = mat
g.links.new(i.outputs[0], sm.inputs[0]); g.links.new(sm.outputs[0], o.inputs[0])
gm.modifiers.new("GN", 'NODES').node_group = g
metaball(sc, "Foam.Left", (0.0, -2, 0.3), mat)
metaball(sc, "Foam.Left.001", (0.3, -2, 0.3), mat)
bpy.ops.mesh.primitive_cube_add(size=0.2, location=(3.5, -2, 0.1)); lone = bpy.context.object; lone.name = "Lone"; lone.data.materials.append(mat)
metaball(sc, "Lone.001", (3.5, -2, 1), None, elements=False)
save("scene4.blend")

# Scene 5: a sphere turned 45 degrees that just fits the shot
sc = fresh()
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(0, 0, 1), rotation=(math.radians(45), math.radians(45), 0))
bpy.context.object.name = "Orb"
bpy.context.object.data.materials.append(bpy.data.materials.new("M"))
camera(sc, (0, -3.2, 1), (math.radians(90), 0, 0))
sc.render.resolution_x = sc.render.resolution_y = 1000
save("scene5.blend")

print(json.dumps({"step": "scenes", "blender_version": list(bpy.app.version), "out_dir": out}))
