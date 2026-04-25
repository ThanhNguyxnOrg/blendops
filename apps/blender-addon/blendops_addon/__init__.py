bl_info = {
    "name": "BlendOps Bridge",
    "author": "BlendOps Contributors",
    "version": (0, 1, 0),
    "blender": (3, 6, 0),
    "location": "View3D > Sidebar > BlendOps",
    "description": "Safe Blender automation bridge for AI agents",
    "category": "System",
    "doc_url": "https://github.com/yourusername/blendops",
    "tracker_url": "https://github.com/yourusername/blendops/issues",
}

import bpy
import json
import math
import os
import re
import sys
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread
from typing import Any, Dict, Optional
import traceback

try:
    from mathutils import Vector
except ImportError:
    Vector = None  # type: ignore

_server: Optional[HTTPServer] = None
_server_thread: Optional[Thread] = None
_command_queue: list[Dict[str, Any]] = []
_response_queue: Dict[str, Dict[str, Any]] = {}
_server_start_time: float = 0.0
_request_count: int = 0
_last_operation: Optional[str] = None
_last_error: Optional[str] = None
_last_duration_ms: Optional[int] = None

VALIDATION_PRESETS = {"basic", "game_asset", "render_ready"}
GENERIC_NAME_ROOTS = {
    "cube",
    "sphere",
    "uvsphere",
    "icosphere",
    "cylinder",
    "cone",
    "torus",
    "plane",
    "light",
    "camera",
    "empty",
}
EXPORT_FORMAT_EXTENSIONS = {
    "glb": ".glb",
    "gltf": ".gltf",
    "fbx": ".fbx",
}

OPERATION_REGISTRY = {
    "scene.inspect": None,
    "object.create": None,
    "object.transform": None,
    "material.create": None,
    "material.apply": None,
    "lighting.setup": None,
    "camera.set": None,
    "render.preview": None,
    "validate.scene": None,
    "export.asset": None,
}


def _log(msg: str) -> None:
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[BlendOps {timestamp}] {msg}"
    print(line, flush=True)
    sys.stdout.flush()


def make_response(
    ok: bool,
    operation: str,
    message: str,
    data: Optional[Dict[str, Any]] = None,
    warnings: Optional[list[str]] = None,
    next_steps: Optional[list[str]] = None,
) -> Dict[str, Any]:
    return {
        "ok": ok,
        "operation": operation,
        "message": message,
        "data": data or {},
        "warnings": warnings or [],
        "next_steps": next_steps or [],
    }


def object_snapshot(obj: Any) -> Dict[str, Any]:
    return {
        "name": obj.name,
        "type": obj.type,
        "location": list(obj.location),
        "rotation": list(obj.rotation_euler),
        "scale": list(obj.scale),
        "materials": [mat.name for mat in obj.data.materials]
        if hasattr(obj.data, "materials")
        else [],
    }


def handle_scene_inspect() -> Dict[str, Any]:
    try:
        scene = bpy.context.scene
        objects = [object_snapshot(obj) for obj in scene.objects]
        cameras = [obj.name for obj in scene.objects if obj.type == "CAMERA"]
        lights = [obj.name for obj in scene.objects if obj.type == "LIGHT"]
        materials = [mat.name for mat in bpy.data.materials]
        active_camera = scene.camera.name if scene.camera else None

        data = {
            "objects": objects,
            "cameras": cameras,
            "lights": lights,
            "materials": materials,
            "active_camera": active_camera,
            "stats": {
                "object_count": len(scene.objects),
                "mesh_count": len([obj for obj in scene.objects if obj.type == "MESH"]),
            },
        }

        return make_response(
            ok=True,
            operation="scene.inspect",
            message="Scene inspection complete",
            data=data,
            next_steps=["Use 'blendops object create' to add objects"],
        )
    except Exception as e:
        return make_response(
            ok=False,
            operation="scene.inspect",
            message=f"Scene inspection failed: {str(e)}",
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error"],
        )


def handle_object_create(command: Dict[str, Any]) -> Dict[str, Any]:
    primitive = command.get("type")
    name = command.get("name")
    location = command.get("location") or [0.0, 0.0, 0.0]
    rotation = command.get("rotation") or [0.0, 0.0, 0.0]
    scale = command.get("scale") or [1.0, 1.0, 1.0]

    primitive_ops = {
        "cube": bpy.ops.mesh.primitive_cube_add,
        "uv_sphere": bpy.ops.mesh.primitive_uv_sphere_add,
        "ico_sphere": bpy.ops.mesh.primitive_ico_sphere_add,
        "cylinder": bpy.ops.mesh.primitive_cylinder_add,
        "cone": bpy.ops.mesh.primitive_cone_add,
        "torus": bpy.ops.mesh.primitive_torus_add,
        "plane": bpy.ops.mesh.primitive_plane_add,
    }

    if primitive not in primitive_ops:
        return make_response(
            ok=False,
            operation="object.create",
            message=f"Unsupported primitive type: {primitive}",
            warnings=["Allowed types: cube, uv_sphere, ico_sphere, cylinder, cone, torus, plane"],
            next_steps=["Use one of the supported primitive types"],
        )

    if not isinstance(name, str) or len(name.strip()) == 0:
        return make_response(
            ok=False,
            operation="object.create",
            message="Object name is required",
            warnings=["Provide --name for object.create"],
            next_steps=["Example: blendops object create --type cube --name test_cube"],
        )

    try:
        primitive_ops[primitive](location=tuple(location), rotation=tuple(rotation), scale=tuple(scale))
        created = bpy.context.view_layer.objects.active

        if created is None:
            return make_response(
                ok=False,
                operation="object.create",
                message="Object creation failed: no active object created",
                warnings=["Blender operator did not return an active object"],
                next_steps=["Check Blender console for operator errors"],
            )

        created.name = name

        return make_response(
            ok=True,
            operation="object.create",
            message=f"Created {primitive} object '{name}'",
            data={"object": object_snapshot(created)},
            next_steps=[
                "Run `blendops scene inspect` to verify scene state",
                "Use object transform in future slices",
            ],
        )
    except Exception as e:
        return make_response(
            ok=False,
            operation="object.create",
            message=f"Object creation failed: {str(e)}",
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error"],
        )


def handle_object_transform(command: Dict[str, Any]) -> Dict[str, Any]:
    name = command.get("name")

    if not isinstance(name, str) or len(name.strip()) == 0:
        return make_response(
            ok=False,
            operation="object.transform",
            message="Object name is required",
            warnings=["Provide --name for object.transform"],
            next_steps=["Example: blendops object transform --name test_cube --location 1,0,1"],
        )

    location = command.get("location")
    rotation = command.get("rotation")
    scale = command.get("scale")

    if location is None and rotation is None and scale is None:
        return make_response(
            ok=False,
            operation="object.transform",
            message="object.transform requires at least one of location, rotation, or scale",
            warnings=["No transform fields provided"],
            next_steps=["Provide one or more of location/rotation/scale"],
        )

    obj = bpy.data.objects.get(name)
    if obj is None:
        return make_response(
            ok=False,
            operation="object.transform",
            message=f"Object `{name}` not found",
            next_steps=["Run `blendops scene inspect` to list available objects"],
        )

    try:
        if location is not None:
            obj.location = tuple(location)
        if rotation is not None:
            obj.rotation_euler = tuple(rotation)
        if scale is not None:
            obj.scale = tuple(scale)

        return make_response(
            ok=True,
            operation="object.transform",
            message=f"Transformed object '{name}'",
            data={"object": object_snapshot(obj)},
            next_steps=["Run `blendops scene inspect` to verify scene state"],
        )
    except Exception as e:
        return make_response(
            ok=False,
            operation="object.transform",
            message=f"Object transform failed: {str(e)}",
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error"],
        )


def parse_color_input(color: Any) -> Optional[tuple[float, float, float, float]]:
    if isinstance(color, str):
        value = color.strip()
        if not value.startswith("#"):
            return None
        hex_value = value[1:]
        if len(hex_value) not in (6, 8):
            return None

        try:
            if len(hex_value) == 6:
                r = int(hex_value[0:2], 16) / 255.0
                g = int(hex_value[2:4], 16) / 255.0
                b = int(hex_value[4:6], 16) / 255.0
                return (r, g, b, 1.0)

            r = int(hex_value[0:2], 16) / 255.0
            g = int(hex_value[2:4], 16) / 255.0
            b = int(hex_value[4:6], 16) / 255.0
            a = int(hex_value[6:8], 16) / 255.0
            return (r, g, b, a)
        except ValueError:
            return None

    if isinstance(color, list) and len(color) == 4:
        try:
            rgba = tuple(float(channel) for channel in color)
        except (TypeError, ValueError):
            return None

        if any(channel < 0.0 or channel > 1.0 for channel in rgba):
            return None

        return rgba

    return None


def material_snapshot(mat: Any) -> Dict[str, Any]:
    color = [1.0, 1.0, 1.0, 1.0]
    roughness = 0.5
    metallic = 0.0

    if mat.use_nodes and mat.node_tree:
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf is not None:
            color = list(bsdf.inputs["Base Color"].default_value)
            roughness = float(bsdf.inputs["Roughness"].default_value)
            metallic = float(bsdf.inputs["Metallic"].default_value)

    return {
        "name": mat.name,
        "color": color,
        "roughness": roughness,
        "metallic": metallic,
    }


def handle_material_create(command: Dict[str, Any]) -> Dict[str, Any]:
    name = command.get("name")
    color_input = command.get("color")
    roughness = command.get("roughness", 0.5)
    metallic = command.get("metallic", 0.0)

    if not isinstance(name, str) or len(name.strip()) == 0:
        return make_response(
            ok=False,
            operation="material.create",
            message="Material name is required",
            warnings=["Provide --name for material.create"],
            next_steps=["Example: blendops material create --name red_plastic --color #ff0000"],
        )

    parsed_color = parse_color_input(color_input)
    if parsed_color is None:
        return make_response(
            ok=False,
            operation="material.create",
            message="Invalid color value",
            warnings=["Color must be hex (#RRGGBB or #RRGGBBAA) or RGBA array with 4 values between 0 and 1"],
            next_steps=["Use --color \"#ff0000\" or RGBA array [1,0,0,1]"],
        )

    try:
        roughness_value = float(roughness)
        metallic_value = float(metallic)
    except (TypeError, ValueError):
        return make_response(
            ok=False,
            operation="material.create",
            message="Invalid material numeric properties",
            warnings=["roughness and metallic must be numbers"],
            next_steps=["Use numeric values between 0 and 1"],
        )

    if roughness_value < 0.0 or roughness_value > 1.0 or metallic_value < 0.0 or metallic_value > 1.0:
        return make_response(
            ok=False,
            operation="material.create",
            message="Invalid material numeric range",
            warnings=["roughness and metallic must be between 0 and 1"],
            next_steps=["Use values like --roughness 0.5 --metallic 0"],
        )

    try:
        material = bpy.data.materials.get(name)
        if material is None:
            material = bpy.data.materials.new(name=name)

        material.use_nodes = True
        bsdf = material.node_tree.nodes.get("Principled BSDF") if material.node_tree else None
        if bsdf is None:
            return make_response(
                ok=False,
                operation="material.create",
                message="Failed to locate Principled BSDF node",
                next_steps=["Check Blender material node configuration"],
            )

        bsdf.inputs["Base Color"].default_value = parsed_color
        bsdf.inputs["Roughness"].default_value = roughness_value
        bsdf.inputs["Metallic"].default_value = metallic_value

        return make_response(
            ok=True,
            operation="material.create",
            message=f"Created material '{name}'",
            data={"material": material_snapshot(material)},
            next_steps=["Run `blendops material apply` to assign material to an object"],
        )
    except Exception as e:
        return make_response(
            ok=False,
            operation="material.create",
            message=f"Material creation failed: {str(e)}",
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error"],
        )


def handle_material_apply(command: Dict[str, Any]) -> Dict[str, Any]:
    object_name = command.get("object_name")
    material_name = command.get("material_name")

    if not isinstance(object_name, str) or len(object_name.strip()) == 0:
        return make_response(
            ok=False,
            operation="material.apply",
            message="Object name is required",
            warnings=["Provide --object for material.apply"],
            next_steps=["Example: blendops material apply --object test_cube --material red_plastic"],
        )

    if not isinstance(material_name, str) or len(material_name.strip()) == 0:
        return make_response(
            ok=False,
            operation="material.apply",
            message="Material name is required",
            warnings=["Provide --material for material.apply"],
            next_steps=["Example: blendops material apply --object test_cube --material red_plastic"],
        )

    obj = bpy.data.objects.get(object_name)
    if obj is None:
        return make_response(
            ok=False,
            operation="material.apply",
            message=f"Object `{object_name}` not found",
            next_steps=["Run `blendops scene inspect` to list available objects"],
        )

    material = bpy.data.materials.get(material_name)
    if material is None:
        return make_response(
            ok=False,
            operation="material.apply",
            message=f"Material `{material_name}` not found",
            next_steps=["Run `blendops material create` to create the material first"],
        )

    if not hasattr(obj.data, "materials"):
        return make_response(
            ok=False,
            operation="material.apply",
            message=f"Object `{object_name}` does not support materials",
            next_steps=["Use a mesh object target"],
        )

    try:
        if len(obj.data.materials) > 0:
            obj.data.materials[0] = material
        else:
            obj.data.materials.append(material)

        return make_response(
            ok=True,
            operation="material.apply",
            message=f"Applied material '{material_name}' to '{object_name}'",
            data={
                "object": object_snapshot(obj),
                "material": {"name": material.name},
            },
            next_steps=["Run `blendops scene inspect` to verify material assignment"],
        )
    except Exception as e:
        return make_response(
            ok=False,
            operation="material.apply",
            message=f"Material apply failed: {str(e)}",
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error"],
        )


def update_or_create_area_light(name: str, location: tuple[float, float, float], rotation: tuple[float, float, float], energy: float, size: float) -> str:
    obj = bpy.data.objects.get(name)

    if obj is None or obj.type != "LIGHT":
        light_data = bpy.data.lights.new(name=name, type="AREA")
        obj = bpy.data.objects.new(name=name, object_data=light_data)
        bpy.context.scene.collection.objects.link(obj)
    else:
        light_data = obj.data

    light_data.type = "AREA"
    light_data.energy = energy
    light_data.size = size
    obj.location = location
    obj.rotation_euler = rotation

    return obj.name


def camera_snapshot(camera_object: Any) -> Dict[str, Any]:
    lens = 50.0
    if hasattr(camera_object, "data") and hasattr(camera_object.data, "lens"):
        lens = float(camera_object.data.lens)

    return {
        "name": camera_object.name,
        "location": list(camera_object.location),
        "rotation": list(camera_object.rotation_euler),
        "focal_length": lens,
    }


def ensure_blendops_camera() -> Any:
    camera_obj = bpy.data.objects.get("blendops_camera")
    if camera_obj is not None and camera_obj.type == "CAMERA":
        return camera_obj

    camera_data = bpy.data.cameras.new(name="blendops_camera")
    camera_obj = bpy.data.objects.new(name="blendops_camera", object_data=camera_data)
    bpy.context.scene.collection.objects.link(camera_obj)
    return camera_obj


def aim_object_at_target(obj: Any, target_location: tuple[float, float, float]) -> None:
    if Vector is None:
        return

    direction = Vector(target_location) - obj.location
    if direction.length == 0:
        return

    quat = direction.to_track_quat("-Z", "Y")
    obj.rotation_euler = quat.to_euler()


def handle_render_preview(command: Dict[str, Any]) -> Dict[str, Any]:
    output = command.get("output") or "renders/preview.png"
    width = command.get("width") or 512
    height = command.get("height") or 512
    samples = command.get("samples") or 32

    scene = bpy.context.scene

    if scene.camera is None:
        return make_response(
            ok=False,
            operation="render.preview",
            message="No active camera found",
            next_steps=["Run `blendops camera set --target <object>` before rendering"],
        )

    try:
        import os

        output_path = output
        if not os.path.isabs(output_path):
            output_path = os.path.abspath(output_path)

        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        scene.render.resolution_x = int(width)
        scene.render.resolution_y = int(height)
        scene.render.image_settings.file_format = "PNG"

        if scene.render.engine == "CYCLES" or (hasattr(scene, "cycles") and scene.cycles):
            try:
                scene.cycles.samples = int(samples)
            except Exception:
                pass

        scene.render.filepath = output_path
        bpy.ops.render.render(write_still=True)

        if not os.path.exists(output_path):
            return make_response(
                ok=False,
                operation="render.preview",
                message=f"Render completed but output file not found at {output_path}",
                next_steps=["Check Blender render output settings and filesystem permissions"],
            )

        camera_name = scene.camera.name if scene.camera else None

        return make_response(
            ok=True,
            operation="render.preview",
            message=f"Rendered preview to {output}",
            data={
                "output": output,
                "width": int(width),
                "height": int(height),
                "samples": int(samples),
                "camera": camera_name,
            },
            next_steps=["Check output file exists at specified path"],
        )
    except Exception as e:
        return make_response(
            ok=False,
            operation="render.preview",
            message=f"Render preview failed: {str(e)}",
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error"],
        )


def handle_camera_set(command: Dict[str, Any]) -> Dict[str, Any]:
    target_name = command.get("target")
    location = command.get("location")
    rotation = command.get("rotation")
    distance_input = command.get("distance")
    focal_length_input = command.get("focal_length")

    has_target = isinstance(target_name, str) and len(target_name.strip()) > 0
    has_location = location is not None
    has_rotation = rotation is not None

    if not has_target and not has_location:
        return make_response(
            ok=False,
            operation="camera.set",
            message="camera.set requires at least target or location",
            warnings=["Provide --target or --location"],
            next_steps=[
                "Example: blendops camera set --target test_cube --distance 5",
                "Example: blendops camera set --location 4,-5,3 --rotation 1.1,0,0.7",
            ],
        )

    if has_location and not has_target and not has_rotation:
        return make_response(
            ok=False,
            operation="camera.set",
            message="camera.set requires rotation when location is provided without target",
            warnings=["Missing rotation for explicit camera placement without target"],
            next_steps=["Provide --rotation with --location when --target is omitted"],
        )

    if distance_input is not None:
        try:
            distance_value = float(distance_input)
        except (TypeError, ValueError):
            return make_response(
                ok=False,
                operation="camera.set",
                message="distance must be a positive number",
                next_steps=["Use a positive numeric value for --distance"],
            )

        if distance_value <= 0:
            return make_response(
                ok=False,
                operation="camera.set",
                message="distance must be a positive number",
                next_steps=["Use a positive numeric value for --distance"],
            )
    else:
        distance_value = 5.0

    if focal_length_input is None:
        focal_length_value = 50.0
    else:
        try:
            focal_length_value = float(focal_length_input)
        except (TypeError, ValueError):
            return make_response(
                ok=False,
                operation="camera.set",
                message="focal_length must be a positive number",
                next_steps=["Use a positive numeric value for --focal-length"],
            )

        if focal_length_value <= 0:
            return make_response(
                ok=False,
                operation="camera.set",
                message="focal_length must be a positive number",
                next_steps=["Use a positive numeric value for --focal-length"],
            )

    target_obj = None
    if has_target:
        target_obj = bpy.data.objects.get(target_name)
        if target_obj is None:
            return make_response(
                ok=False,
                operation="camera.set",
                message=f"Target object `{target_name}` not found",
                next_steps=["Run `blendops scene inspect` to list available objects"],
            )

    try:
        camera_obj = ensure_blendops_camera()
        scene = bpy.context.scene

        if not hasattr(camera_obj, "data") or camera_obj.data is None:
            return make_response(
                ok=False,
                operation="camera.set",
                message="Resolved camera object does not have camera data",
                next_steps=["Check Blender camera data consistency"],
            )

        camera_obj.data.lens = focal_length_value

        if has_location:
            camera_obj.location = tuple(location)
        elif target_obj is not None:
            tx, ty, tz = target_obj.location.x, target_obj.location.y, target_obj.location.z
            camera_obj.location = (tx + distance_value, ty - distance_value, tz + distance_value * 0.6)

        if has_rotation:
            camera_obj.rotation_euler = tuple(rotation)
        elif target_obj is not None:
            aim_object_at_target(camera_obj, (target_obj.location.x, target_obj.location.y, target_obj.location.z))

        scene.camera = camera_obj

        return make_response(
            ok=True,
            operation="camera.set",
            message="Camera set successfully",
            data={
                "camera": camera_snapshot(camera_obj),
                "target": target_obj.name if target_obj is not None else None,
                "active_camera": scene.camera.name if scene.camera is not None else camera_obj.name,
            },
            next_steps=["Run `blendops scene inspect` to verify camera state"],
        )
    except Exception as e:
        return make_response(
            ok=False,
            operation="camera.set",
            message=f"Camera set failed: {str(e)}",
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error"],
        )


def is_finite_numeric(value: Any) -> bool:
    """Check if value is a finite numeric value."""
    try:
        num = float(value)
        return math.isfinite(num)
    except (TypeError, ValueError):
        return False


def is_generic_name(name: str) -> bool:
    """Check if object name is generic (e.g., Cube, Cube.001, Sphere.002)."""
    if not name:
        return False
    
    name_lower = name.lower()
    base_name = re.sub(r'\.\d+$', '', name_lower)
    
    return base_name in GENERIC_NAME_ROOTS


def handle_export_asset(command: Dict[str, Any]) -> Dict[str, Any]:
    export_format = str(command.get("format", "")).lower().strip()
    output = str(command.get("output", "")).strip()
    selected_only = bool(command.get("selected_only", False))
    apply_modifiers = bool(command.get("apply_modifiers", True))

    if export_format not in EXPORT_FORMAT_EXTENSIONS:
        return make_response(
            ok=False,
            operation="export.asset",
            message=f"Unsupported export format: {export_format}",
            warnings=["Allowed formats: glb, gltf, fbx"],
            next_steps=["Use one of the supported formats"],
        )

    if len(output) == 0:
        return make_response(
            ok=False,
            operation="export.asset",
            message="Export output path is required",
            warnings=["Provide output path for export.asset"],
            next_steps=["Example: blendops export asset --format glb --output exports/test_scene.glb"],
        )

    expected_extension = EXPORT_FORMAT_EXTENSIONS[export_format]
    if not output.lower().endswith(expected_extension):
        return make_response(
            ok=False,
            operation="export.asset",
            message=f"Output extension must be {expected_extension} for format {export_format}",
            warnings=["Output path extension and format mismatch"],
            next_steps=[f"Use output ending with {expected_extension}"],
        )

    scene = bpy.context.scene
    mesh_objects = [obj for obj in scene.objects if obj.type == "MESH"]
    if len(mesh_objects) == 0:
        return make_response(
            ok=False,
            operation="export.asset",
            message="No mesh objects found to export",
            next_steps=["Create an object before exporting"],
        )

    try:
        output_path = output
        if not os.path.isabs(output_path):
            output_path = os.path.abspath(output_path)

        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        active_object = bpy.context.view_layer.objects.active
        original_selected = [obj for obj in scene.objects if obj.select_get()]

        if selected_only:
            for obj in scene.objects:
                obj.select_set(False)
            for obj in mesh_objects:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = mesh_objects[0]

        if export_format == "glb":
            bpy.ops.export_scene.gltf(
                filepath=output_path,
                export_format="GLB",
                use_selection=selected_only,
                export_apply=apply_modifiers,
            )
        elif export_format == "gltf":
            bpy.ops.export_scene.gltf(
                filepath=output_path,
                export_format="GLTF_EMBEDDED",
                use_selection=selected_only,
                export_apply=apply_modifiers,
            )
        elif export_format == "fbx":
            bpy.ops.export_scene.fbx(
                filepath=output_path,
                use_selection=selected_only,
                apply_scale_options="FBX_SCALE_NONE",
                use_mesh_modifiers=apply_modifiers,
            )

        if selected_only:
            for obj in scene.objects:
                obj.select_set(False)
            for obj in original_selected:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = active_object

        file_exists = os.path.exists(output_path)
        file_size_bytes = os.path.getsize(output_path) if file_exists else 0

        if not file_exists:
            return make_response(
                ok=False,
                operation="export.asset",
                message=f"Export completed but output file not found at {output_path}",
                next_steps=["Check Blender export settings and filesystem permissions"],
            )

        return make_response(
            ok=True,
            operation="export.asset",
            message=f"Exported asset to {output}",
            data={
                "format": export_format,
                "output": output,
                "selected_only": selected_only,
                "apply_modifiers": apply_modifiers,
                "file_exists": file_exists,
                "file_size_bytes": file_size_bytes,
            },
            next_steps=["Verify exported asset in target tool"],
        )
    except Exception as e:
        try:
            for obj in scene.objects:
                obj.select_set(False)
            for obj in original_selected:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = active_object
        except Exception:
            pass

        return make_response(
            ok=False,
            operation="export.asset",
            message=f"Asset export failed: {str(e)}",
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error"],
        )


def handle_validate_scene(command: Dict[str, Any]) -> Dict[str, Any]:
    preset = command.get("preset", "basic")
    
    if preset not in VALIDATION_PRESETS:
        return make_response(
            ok=False,
            operation="validate.scene",
            message=f"Unsupported validation preset: {preset}",
            warnings=["Allowed presets: basic, game_asset, render_ready"],
            next_steps=["Use one of the supported validation presets"],
        )
    
    try:
        scene = bpy.context.scene
        checks: list[Dict[str, Any]] = []
        
        # Common checks for all presets
        objects = list(scene.objects)
        mesh_objects = [obj for obj in objects if obj.type == "MESH"]
        cameras = [obj for obj in objects if obj.type == "CAMERA"]
        lights = [obj for obj in objects if obj.type == "LIGHT"]
        
        # Check: has at least one object
        if len(objects) > 0:
            checks.append({
                "id": "has_objects",
                "status": "pass",
                "message": f"Scene has {len(objects)} object(s)",
                "details": {"count": len(objects)},
            })
        else:
            checks.append({
                "id": "has_objects",
                "status": "fail",
                "message": "Scene has no objects",
                "details": {"count": 0},
            })
        
        # Check: has at least one mesh object
        if len(mesh_objects) > 0:
            checks.append({
                "id": "has_mesh_objects",
                "status": "pass",
                "message": f"Scene has {len(mesh_objects)} mesh object(s)",
                "details": {"count": len(mesh_objects)},
            })
        else:
            checks.append({
                "id": "has_mesh_objects",
                "status": "fail",
                "message": "Scene has no mesh objects",
                "details": {"count": 0},
            })
        
        # Check: object names are non-empty
        empty_names = [obj.name for obj in objects if not obj.name or len(obj.name.strip()) == 0]
        if len(empty_names) == 0:
            checks.append({
                "id": "object_names_non_empty",
                "status": "pass",
                "message": "All objects have non-empty names",
                "details": {},
            })
        else:
            checks.append({
                "id": "object_names_non_empty",
                "status": "fail",
                "message": f"{len(empty_names)} object(s) have empty names",
                "details": {"empty_count": len(empty_names)},
            })
        
        # Check: no duplicate object names (after Blender suffix normalization)
        name_counts: Dict[str, int] = {}
        for obj in objects:
            base_name = re.sub(r'\.\d+$', '', obj.name)
            name_counts[base_name] = name_counts.get(base_name, 0) + 1
        
        duplicates = {name: count for name, count in name_counts.items() if count > 1}
        if len(duplicates) == 0:
            checks.append({
                "id": "no_duplicate_names",
                "status": "pass",
                "message": "No duplicate object names detected",
                "details": {},
            })
        else:
            checks.append({
                "id": "no_duplicate_names",
                "status": "warn",
                "message": f"{len(duplicates)} duplicate base name(s) detected",
                "details": {"duplicates": duplicates},
            })
        
        # Check: scene has active camera
        if scene.camera is not None:
            checks.append({
                "id": "has_active_camera",
                "status": "pass",
                "message": f"Active camera: {scene.camera.name}",
                "details": {"camera": scene.camera.name},
            })
        else:
            checks.append({
                "id": "has_active_camera",
                "status": "fail",
                "message": "No active camera set",
                "details": {},
            })
        
        # Check: scene has at least one light
        if len(lights) > 0:
            checks.append({
                "id": "has_lights",
                "status": "pass",
                "message": f"Scene has {len(lights)} light(s)",
                "details": {"count": len(lights)},
            })
        else:
            checks.append({
                "id": "has_lights",
                "status": "fail",
                "message": "Scene has no lights",
                "details": {"count": 0},
            })
        
        # Check: mesh objects have materials
        meshes_without_materials = [
            obj.name for obj in mesh_objects
            if not hasattr(obj.data, "materials") or len(obj.data.materials) == 0
        ]
        if len(meshes_without_materials) == 0:
            checks.append({
                "id": "meshes_have_materials",
                "status": "pass",
                "message": "All mesh objects have materials",
                "details": {},
            })
        else:
            checks.append({
                "id": "meshes_have_materials",
                "status": "warn",
                "message": f"{len(meshes_without_materials)} mesh object(s) have no materials",
                "details": {"objects": meshes_without_materials},
            })
        
        # Check: transforms have valid finite numeric values
        invalid_transforms = []
        for obj in objects:
            if not all(is_finite_numeric(v) for v in obj.location):
                invalid_transforms.append(f"{obj.name} (location)")
            if not all(is_finite_numeric(v) for v in obj.rotation_euler):
                invalid_transforms.append(f"{obj.name} (rotation)")
            if not all(is_finite_numeric(v) for v in obj.scale):
                invalid_transforms.append(f"{obj.name} (scale)")
        
        if len(invalid_transforms) == 0:
            checks.append({
                "id": "valid_transforms",
                "status": "pass",
                "message": "All object transforms are valid",
                "details": {},
            })
        else:
            checks.append({
                "id": "valid_transforms",
                "status": "fail",
                "message": f"{len(invalid_transforms)} invalid transform(s) detected",
                "details": {"invalid": invalid_transforms},
            })
        
        # Preset-specific checks
        if preset == "game_asset":
            # Check: warn if non-mesh objects exist besides camera/lights
            other_objects = [
                obj.name for obj in objects
                if obj.type not in {"MESH", "CAMERA", "LIGHT"}
            ]
            if len(other_objects) == 0:
                checks.append({
                    "id": "game_asset_object_types",
                    "status": "pass",
                    "message": "Only mesh/camera/light objects present",
                    "details": {},
                })
            else:
                checks.append({
                    "id": "game_asset_object_types",
                    "status": "warn",
                    "message": f"{len(other_objects)} non-mesh/camera/light object(s) present",
                    "details": {"objects": other_objects},
                })
            
            # Check: warn if scale is not applied (scale differs from [1,1,1])
            unapplied_scale = [
                obj.name for obj in mesh_objects
                if not all(abs(s - 1.0) < 0.001 for s in obj.scale)
            ]
            if len(unapplied_scale) == 0:
                checks.append({
                    "id": "game_asset_scale_applied",
                    "status": "pass",
                    "message": "All mesh objects have applied scale",
                    "details": {},
                })
            else:
                checks.append({
                    "id": "game_asset_scale_applied",
                    "status": "warn",
                    "message": f"{len(unapplied_scale)} mesh object(s) have unapplied scale",
                    "details": {"objects": unapplied_scale},
                })
            
            # Check: warn if object names are generic
            generic_names = [obj.name for obj in mesh_objects if is_generic_name(obj.name)]
            if len(generic_names) == 0:
                checks.append({
                    "id": "game_asset_non_generic_names",
                    "status": "pass",
                    "message": "All mesh objects have non-generic names",
                    "details": {},
                })
            else:
                checks.append({
                    "id": "game_asset_non_generic_names",
                    "status": "warn",
                    "message": f"{len(generic_names)} mesh object(s) have generic names",
                    "details": {"objects": generic_names},
                })
            
            # Check: estimate polygon/triangle count
            total_polys = 0
            for obj in mesh_objects:
                if hasattr(obj.data, "polygons"):
                    total_polys += len(obj.data.polygons)
            
            if total_polys > 0:
                if total_polys < 10000:
                    checks.append({
                        "id": "game_asset_poly_count",
                        "status": "pass",
                        "message": f"Estimated {total_polys} polygon(s) (reasonable for game asset)",
                        "details": {"poly_count": total_polys},
                    })
                else:
                    checks.append({
                        "id": "game_asset_poly_count",
                        "status": "warn",
                        "message": f"Estimated {total_polys} polygon(s) (high for game asset)",
                        "details": {"poly_count": total_polys},
                    })
            else:
                checks.append({
                    "id": "game_asset_poly_count",
                    "status": "warn",
                    "message": "No polygons detected",
                    "details": {"poly_count": 0},
                })
        
        if preset == "render_ready":
            # Check: active camera exists (already checked above, but emphasize for render)
            # Check: at least one visible mesh object exists
            visible_meshes = [obj for obj in mesh_objects if not obj.hide_render]
            if len(visible_meshes) > 0:
                checks.append({
                    "id": "render_ready_visible_meshes",
                    "status": "pass",
                    "message": f"{len(visible_meshes)} visible mesh object(s) for rendering",
                    "details": {"count": len(visible_meshes)},
                })
            else:
                checks.append({
                    "id": "render_ready_visible_meshes",
                    "status": "fail",
                    "message": "No visible mesh objects for rendering",
                    "details": {"count": 0},
                })
            
            # Check: render resolution positive
            if scene.render.resolution_x > 0 and scene.render.resolution_y > 0:
                checks.append({
                    "id": "render_ready_resolution",
                    "status": "pass",
                    "message": f"Render resolution: {scene.render.resolution_x}x{scene.render.resolution_y}",
                    "details": {
                        "width": scene.render.resolution_x,
                        "height": scene.render.resolution_y,
                    },
                })
            else:
                checks.append({
                    "id": "render_ready_resolution",
                    "status": "fail",
                    "message": "Invalid render resolution",
                    "details": {
                        "width": scene.render.resolution_x,
                        "height": scene.render.resolution_y,
                    },
                })
        
        # Calculate summary
        pass_count = sum(1 for check in checks if check["status"] == "pass")
        warn_count = sum(1 for check in checks if check["status"] == "warn")
        fail_count = sum(1 for check in checks if check["status"] == "fail")
        
        passed = fail_count == 0
        
        data = {
            "preset": preset,
            "passed": passed,
            "checks": checks,
            "summary": {
                "pass": pass_count,
                "warn": warn_count,
                "fail": fail_count,
            },
        }
        
        warnings = []
        next_steps = []
        
        if fail_count > 0:
            warnings.append(f"Validation failed with {fail_count} failure(s)")
            next_steps.append("Review failed checks and address issues")
        
        if warn_count > 0:
            warnings.append(f"Validation has {warn_count} warning(s)")
            next_steps.append("Review warnings for potential improvements")
        
        if passed and warn_count == 0:
            next_steps.append("Scene validation passed with no warnings")
        
        return make_response(
            ok=True,
            operation="validate.scene",
            message=f"Scene validation complete (preset: {preset})",
            data=data,
            warnings=warnings if warnings else None,
            next_steps=next_steps if next_steps else None,
        )
    except Exception as e:
        return make_response(
            ok=False,
            operation="validate.scene",
            message=f"Scene validation failed: {str(e)}",
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error"],
        )


def handle_lighting_setup(command: Dict[str, Any]) -> Dict[str, Any]:
    preset = command.get("preset")
    target_name = command.get("target")

    allowed_presets = {"studio", "three_point", "soft_key"}
    if preset not in allowed_presets:
        return make_response(
            ok=False,
            operation="lighting.setup",
            message=f"Unsupported lighting preset: {preset}",
            warnings=["Allowed presets: studio, three_point, soft_key"],
            next_steps=["Use one of the supported lighting presets"],
        )

    target = None
    if target_name is not None:
        if not isinstance(target_name, str) or len(target_name.strip()) == 0:
            return make_response(
                ok=False,
                operation="lighting.setup",
                message="Invalid target value",
                warnings=["target must be a non-empty string when provided"],
                next_steps=["Provide target object name or omit --target"],
            )

        target = bpy.data.objects.get(target_name)
        if target is None:
            return make_response(
                ok=False,
                operation="lighting.setup",
                message=f"Target object `{target_name}` not found",
                next_steps=["Run `blendops scene inspect` to list available objects"],
            )

    base_location = (0.0, 0.0, 0.0)
    if target is not None:
        base_location = (target.location.x, target.location.y, target.location.z)

    created_or_updated: list[str] = []

    try:
        if preset == "studio":
            created_or_updated.append(
                update_or_create_area_light(
                    "blendops_studio_light",
                    (base_location[0] + 2.0, base_location[1] - 2.5, base_location[2] + 3.0),
                    (0.9, 0.0, 0.6),
                    1200.0,
                    3.0,
                )
            )

        if preset == "soft_key":
            created_or_updated.append(
                update_or_create_area_light(
                    "blendops_key_light",
                    (base_location[0] + 2.5, base_location[1] - 2.0, base_location[2] + 2.8),
                    (0.85, 0.0, 0.7),
                    900.0,
                    4.0,
                )
            )

        if preset == "three_point":
            created_or_updated.append(
                update_or_create_area_light(
                    "blendops_key_light",
                    (base_location[0] + 2.5, base_location[1] - 2.5, base_location[2] + 3.0),
                    (0.9, 0.0, 0.7),
                    950.0,
                    2.5,
                )
            )
            created_or_updated.append(
                update_or_create_area_light(
                    "blendops_fill_light",
                    (base_location[0] - 2.0, base_location[1] - 1.5, base_location[2] + 2.0),
                    (1.0, 0.0, -0.8),
                    420.0,
                    2.2,
                )
            )
            created_or_updated.append(
                update_or_create_area_light(
                    "blendops_rim_light",
                    (base_location[0] + 0.0, base_location[1] + 3.0, base_location[2] + 2.6),
                    (1.2, 0.0, 3.14),
                    650.0,
                    1.8,
                )
            )

        return make_response(
            ok=True,
            operation="lighting.setup",
            message=f"Applied lighting preset '{preset}'",
            data={
                "preset": preset,
                "target": target_name,
                "lights": created_or_updated,
            },
            next_steps=["Run `blendops scene inspect` to verify scene lighting"],
        )
    except Exception as e:
        return make_response(
            ok=False,
            operation="lighting.setup",
            message=f"Lighting setup failed: {str(e)}",
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error"],
        )


def _dispatch_with_observability(command: Dict[str, Any], client_ip: Optional[str] = None) -> Dict[str, Any]:
    global _request_count, _last_operation, _last_error, _last_duration_ms
    
    operation = command.get("operation")
    start = time.time()
    
    _log(f"<- {operation}")
    
    if operation == "bridge.status":
        uptime_seconds = int(time.time() - _server_start_time) if _server_start_time > 0 else 0
        response = make_response(
            ok=True,
            operation="bridge.status",
            message="BlendOps bridge is running",
            data={
                "version": ".".join(map(str, bl_info["version"])),
                "started_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(_server_start_time)) if _server_start_time > 0 else None,
                "uptime_seconds": uptime_seconds,
                "request_count": _request_count,
                "last_operation": _last_operation,
                "last_error": _last_error,
                "last_duration_ms": _last_duration_ms,
                "implemented_operations": list(OPERATION_REGISTRY.keys()),
            },
        )
    else:
        handler = OPERATION_REGISTRY.get(operation)
        if handler is None:
            response = make_response(
                ok=False,
                operation="unknown",
                message=f"Unknown operation: {operation}",
                warnings=["Operation not implemented in MVP"],
                next_steps=["Use operation 'scene.inspect'"],
            )
        else:
            try:
                response = handler(command)
            except Exception as e:
                response = make_response(
                    ok=False,
                    operation=operation,
                    message=f"Operation failed: {str(e)}",
                    warnings=[traceback.format_exc()],
                    next_steps=["Check Blender console for detailed error"],
                )
    
    duration_ms = int((time.time() - start) * 1000)
    
    _request_count += 1
    _last_operation = operation
    _last_duration_ms = duration_ms
    if not response.get("ok"):
        _last_error = response.get("message")
    else:
        _last_error = None
    
    status = "ok" if response.get("ok") else "failed"
    if response.get("ok"):
        _log(f"-> {operation} {status} {duration_ms}ms")
    else:
        error_message = response.get("message")
        _log(f"-> {operation} {status} {duration_ms}ms: {error_message}")
    
    return response


def process_command(command: Dict[str, Any]) -> Dict[str, Any]:
    return _dispatch_with_observability(command, client_ip=None)


def timer_process_queue() -> float:
    global _command_queue, _response_queue

    if _command_queue:
        item = _command_queue.pop(0)
        command_id = item["id"]
        command = item["command"]
        client_ip = item.get("client_ip")

        try:
            response = _dispatch_with_observability(command, client_ip=client_ip)
            _response_queue[command_id] = response
        except Exception as e:
            _response_queue[command_id] = make_response(
                ok=False,
                operation="bridge.error",
                message=f"Command processing failed: {str(e)}",
                warnings=[traceback.format_exc()],
            )

    return 0.1


class BlendOpsHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        msg = f"[BlendOps {timestamp}] {self.client_address[0]}:{self.client_address[1]} - {format % args}"
        sys.stderr.write(msg + "\n")
        sys.stderr.flush()

    def do_POST(self) -> None:
        global _command_queue, _response_queue

        if self.path == "/status":
            self._handle_status()
        elif self.path == "/command":
            self._handle_command()
        else:
            self._send_json(
                404,
                make_response(
                    ok=False,
                    operation="bridge.not_found",
                    message=f"Unknown endpoint: {self.path}",
                    next_steps=["Use /status or /command endpoints"],
                ),
            )

    def _handle_status(self) -> None:
        client_ip = self.client_address[0] if isinstance(self.client_address, tuple) else None
        response = _dispatch_with_observability({"operation": "bridge.status"}, client_ip=client_ip)
        self._send_json(200, response)

    def _handle_command(self) -> None:
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            command = json.loads(body)
            client_ip = self.client_address[0] if isinstance(self.client_address, tuple) else None

            if bpy.app.background:
                self._send_json(200, _dispatch_with_observability(command, client_ip=client_ip))
                return

            command_id = str(uuid.uuid4())
            _command_queue.append({"id": command_id, "command": command, "client_ip": client_ip})

            timeout = 5.0
            start = time.time()
            while command_id not in _response_queue:
                time.sleep(0.05)
                if time.time() - start > timeout:
                    self._send_json(
                        504,
                        make_response(
                            ok=False,
                            operation="bridge.timeout",
                            message="Command processing timed out",
                            warnings=["Command may still be processing"],
                        ),
                    )
                    return

            response = _response_queue.pop(command_id)
            self._send_json(200, response)

        except json.JSONDecodeError:
            self._send_json(
                400,
                make_response(
                    ok=False,
                    operation="bridge.invalid_json",
                    message="Invalid JSON in request body",
                ),
            )
        except Exception as e:
            self._send_json(
                500,
                make_response(
                    ok=False,
                    operation="bridge.error",
                    message=f"Request handling failed: {str(e)}",
                ),
            )

    def _send_json(self, status: int, data: Dict[str, Any]) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))


def start_server(port: int = 8765) -> None:
    global _server, _server_thread, _server_start_time

    if _server is not None:
        _log("Server already running")
        return

    try:
        _server = HTTPServer(("127.0.0.1", port), BlendOpsHandler)
        _server_thread = Thread(target=_server.serve_forever, daemon=True)
        _server_thread.start()

        if not bpy.app.timers.is_registered(timer_process_queue):
            bpy.app.timers.register(timer_process_queue, persistent=True)

        _server_start_time = time.time()
        
        print("=" * 60, flush=True)
        print(" BlendOps Bridge", flush=True)
        print(f" Version: {'.'.join(map(str, bl_info['version']))}", flush=True)
        print(" Status: READY", flush=True)
        print(f" URL: http://127.0.0.1:{port}", flush=True)
        print(" Mode: Blender background bridge", flush=True)
        print(" Note: keep this window open while using BlendOps", flush=True)
        print("=" * 60, flush=True)
        sys.stdout.flush()
        
        _log("bridge ready")
    except Exception as e:
        _log(f"Failed to start server: {e}")


def stop_server() -> None:
    global _server, _server_thread

    if _server is not None:
        _server.shutdown()
        _server = None
        _server_thread = None

        if bpy.app.timers.is_registered(timer_process_queue):
            bpy.app.timers.unregister(timer_process_queue)

        _log("Bridge stopped")


def register() -> None:
    OPERATION_REGISTRY["scene.inspect"] = lambda _command: handle_scene_inspect()
    OPERATION_REGISTRY["object.create"] = handle_object_create
    OPERATION_REGISTRY["object.transform"] = handle_object_transform
    OPERATION_REGISTRY["material.create"] = handle_material_create
    OPERATION_REGISTRY["material.apply"] = handle_material_apply
    OPERATION_REGISTRY["lighting.setup"] = handle_lighting_setup
    OPERATION_REGISTRY["camera.set"] = handle_camera_set
    OPERATION_REGISTRY["render.preview"] = handle_render_preview
    OPERATION_REGISTRY["validate.scene"] = handle_validate_scene
    OPERATION_REGISTRY["export.asset"] = handle_export_asset
    
    start_server()


def unregister() -> None:
    stop_server()


if __name__ == "__main__":
    register()
