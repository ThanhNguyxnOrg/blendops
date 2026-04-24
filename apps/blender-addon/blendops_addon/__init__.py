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
        created = bpy.context.active_object

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
