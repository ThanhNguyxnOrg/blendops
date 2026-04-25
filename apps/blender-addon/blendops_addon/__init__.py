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
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread
from typing import Any, Dict, Optional
import traceback

_server: Optional[HTTPServer] = None
_server_thread: Optional[Thread] = None
_command_queue: list[Dict[str, Any]] = []
_response_queue: Dict[str, Dict[str, Any]] = {}


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


def process_command(command: Dict[str, Any]) -> Dict[str, Any]:
    operation = command.get("operation")

    if operation == "bridge.status":
        return make_response(
            ok=True,
            operation="bridge.status",
            message="BlendOps bridge is running",
            data={"version": ".".join(map(str, bl_info["version"]))},
        )

    if operation == "scene.inspect":
        return handle_scene_inspect()

    if operation == "object.create":
        return handle_object_create(command)

    if operation == "object.transform":
        return handle_object_transform(command)

    if operation == "material.create":
        return handle_material_create(command)

    if operation == "material.apply":
        return handle_material_apply(command)

    if operation == "lighting.setup":
        return handle_lighting_setup(command)

    return make_response(
        ok=False,
        operation="unknown",
        message=f"Unknown operation: {operation}",
        warnings=["Operation not implemented in MVP"],
        next_steps=["Use operation 'scene.inspect'"],
    )


def timer_process_queue() -> float:
    global _command_queue, _response_queue

    if _command_queue:
        item = _command_queue.pop(0)
        command_id = item["id"]
        command = item["command"]

        try:
            response = process_command(command)
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
        pass

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
        response = make_response(
            ok=True,
            operation="bridge.status",
            message="BlendOps bridge is running",
            data={"version": ".".join(map(str, bl_info["version"]))},
        )
        self._send_json(200, response)

    def _handle_command(self) -> None:
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            command = json.loads(body)

            if bpy.app.background:
                self._send_json(200, process_command(command))
                return

            import uuid

            command_id = str(uuid.uuid4())
            _command_queue.append({"id": command_id, "command": command})

            import time

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
    global _server, _server_thread

    if _server is not None:
        print("BlendOps: Server already running")
        return

    try:
        _server = HTTPServer(("127.0.0.1", port), BlendOpsHandler)
        _server_thread = Thread(target=_server.serve_forever, daemon=True)
        _server_thread.start()

        if not bpy.app.timers.is_registered(timer_process_queue):
            bpy.app.timers.register(timer_process_queue, persistent=True)

        print(f"BlendOps: Bridge started on http://127.0.0.1:{port}")
    except Exception as e:
        print(f"BlendOps: Failed to start server: {e}")


def stop_server() -> None:
    global _server, _server_thread

    if _server is not None:
        _server.shutdown()
        _server = None
        _server_thread = None

        if bpy.app.timers.is_registered(timer_process_queue):
            bpy.app.timers.unregister(timer_process_queue)

        print("BlendOps: Bridge stopped")


def register() -> None:
    start_server()


def unregister() -> None:
    stop_server()


if __name__ == "__main__":
    register()
