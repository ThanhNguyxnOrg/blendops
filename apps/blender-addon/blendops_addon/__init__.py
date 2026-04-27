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
import hashlib
import json
import math
import os
import re
import sys
import time
import uuid
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread
from typing import Any, Callable, Dict, Optional
from urllib.parse import parse_qs, urlparse
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
_last_request_id: Optional[str] = None

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

OperationHandler = Callable[[Dict[str, Any]], Dict[str, Any]]

OPERATION_REGISTRY: Dict[str, Optional[OperationHandler]] = {
    "scene.inspect": None,
    "scene.clear": None,
    "bridge.operations": None,
    "bridge.start": None,
    "bridge.stop": None,
    "bridge.logs": None,
    "undo.last": None,
    "batch.plan": None,
    "batch.execute": None,
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

OPERATION_MANIFEST = {
    "bridge.operations": {
        "category": "bridge",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": None,
        "evidence_doc": "docs/runtime-smoke-test.md",
    },
    "bridge.start": {
        "category": "bridge",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": "Starts managed Blender bridge process from CLI/MCP lifecycle helper",
        "evidence_doc": "docs/runtime-smoke-test.md",
    },
    "bridge.stop": {
        "category": "bridge",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": True,
        "runtime_notes": "Stops managed Blender bridge process; use --all with caution",
        "evidence_doc": "docs/runtime-smoke-test.md",
    },
    "bridge.logs": {
        "category": "bridge",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": "Returns managed bridge process log tails from CLI lifecycle helper",
        "evidence_doc": "docs/runtime-smoke-test.md",
    },
    "undo.last": {
        "category": "history",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": True,
        "runtime_notes": "Uses Blender undo stack; affects last undoable scene operation",
        "evidence_doc": "docs/manual-test.md",
    },
    "scene.inspect": {
        "category": "scene",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": None,
        "evidence_doc": "docs/runtime-smoke-test.md",
    },
    "scene.clear": {
        "category": "scene",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": True,
        "runtime_notes": "Requires confirm=CLEAR_SCENE; supports dry_run preview; removes scene objects when dry_run is false",
        "evidence_doc": "docs/manual-test.md",
    },
    "object.create": {
        "category": "object",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": None,
        "evidence_doc": "docs/runtime-smoke-test.md",
    },
    "object.transform": {
        "category": "object",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": None,
        "evidence_doc": "docs/runtime-smoke-test-object-transform.md",
    },
    "material.create": {
        "category": "material",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": None,
        "evidence_doc": "docs/runtime-smoke-test-material.md",
    },
    "material.apply": {
        "category": "material",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": None,
        "evidence_doc": "docs/runtime-smoke-test-material.md",
    },
    "lighting.setup": {
        "category": "lighting",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": None,
        "evidence_doc": "docs/runtime-smoke-test-lighting.md",
    },
    "camera.set": {
        "category": "camera",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": None,
        "evidence_doc": "docs/runtime-smoke-test-camera.md",
    },
    "render.preview": {
        "category": "render",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": None,
        "evidence_doc": "docs/runtime-smoke-test-render.md",
    },
    "validate.scene": {
        "category": "validate",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": None,
        "evidence_doc": "docs/runtime-smoke-test-validate.md",
    },
    "export.asset": {
        "category": "export",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": "GLB/GLTF requires GUI bridge on Blender 4.2 background mode",
        "evidence_doc": "docs/runtime-smoke-test-export.md",
    },
    "batch.plan": {
        "category": "batch",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": "Plan-only validation; does not execute steps",
        "evidence_doc": "docs/manual-test.md",
    },
    "batch.execute": {
        "category": "batch",
        "cli_supported": True,
        "mcp_supported": True,
        "destructive": False,
        "runtime_notes": "Dry-run only; validates and previews steps without executing",
        "evidence_doc": "docs/runtime-smoke-test-batch-execute-dry-run.md",
    },
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
    request_id: Optional[str] = None,
    receipt: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "ok": ok,
        "operation": operation,
        "message": message,
        "data": data or {},
        "warnings": warnings or [],
        "next_steps": next_steps or [],
        "request_id": request_id,
        "receipt": receipt,
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


def handle_scene_clear(command: Dict[str, Any]) -> Dict[str, Any]:
    confirm = command.get("confirm")
    dry_run = bool(command.get("dry_run", False))

    if confirm != "CLEAR_SCENE":
        return make_response(
            ok=False,
            operation="scene.clear",
            message="scene.clear requires exact confirm token CLEAR_SCENE",
            warnings=["Missing or incorrect confirmation token"],
            next_steps=[
                "Use: blendops scene clear --confirm CLEAR_SCENE",
                "Run scene.inspect before clearing to verify scene state",
            ],
        )

    try:
        scene = bpy.context.scene
        objects_to_remove = list(scene.objects)
        objects_before = len(objects_to_remove)
        mesh_count_before = len([obj for obj in objects_to_remove if obj.type == "MESH"])

        if dry_run:
            return make_response(
                ok=True,
                operation="scene.clear",
                message=f"Dry run: scene.clear would remove {objects_before} object(s)",
                data={
                    "removed_objects": 0,
                    "removed_meshes": 0,
                    "remaining_objects": objects_before,
                    "dry_run": True,
                    "would_remove_objects": objects_before,
                    "would_remove_meshes": mesh_count_before,
                },
                next_steps=[
                    "Run scene.inspect to verify scene state",
                    "Run scene.clear with --confirm CLEAR_SCENE without --dry-run to execute",
                ],
            )

        if objects_before == 0:
            return make_response(
                ok=True,
                operation="scene.clear",
                message="Scene already empty",
                data={
                    "removed_objects": 0,
                    "removed_meshes": 0,
                    "remaining_objects": 0,
                    "dry_run": False,
                    "would_remove_objects": 0,
                    "would_remove_meshes": 0,
                },
                next_steps=["Run scene.inspect to verify scene state"],
            )

        for obj in objects_to_remove:
            bpy.data.objects.remove(obj, do_unlink=True)

        objects_after = len(scene.objects)
        removed_count = objects_before - objects_after

        return make_response(
            ok=True,
            operation="scene.clear",
            message=f"Cleared {removed_count} object(s) from scene",
            data={
                "removed_objects": removed_count,
                "removed_meshes": mesh_count_before,
                "remaining_objects": objects_after,
                "dry_run": False,
                "would_remove_objects": objects_before,
                "would_remove_meshes": mesh_count_before,
            },
            next_steps=["Run scene.inspect to verify scene state"],
        )
    except Exception as e:
        return make_response(
            ok=False,
            operation="scene.clear",
            message=f"Scene clear failed: {str(e)}",
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error"],
        )


def handle_bridge_operations() -> Dict[str, Any]:
    operations = []
    for operation_name, metadata in OPERATION_MANIFEST.items():
        operations.append(
            {
                "name": operation_name,
                "category": metadata["category"],
                "cli_supported": metadata["cli_supported"],
                "mcp_supported": metadata["mcp_supported"],
                "destructive": metadata["destructive"],
                "runtime_notes": metadata["runtime_notes"],
                "evidence_doc": metadata["evidence_doc"],
            }
        )

    operations.sort(key=lambda item: str(item.get("name", "")))

    return make_response(
        ok=True,
        operation="bridge.operations",
        message="Operation manifest",
        data={"operations": operations},
    )


def handle_bridge_start(_command: Dict[str, Any]) -> Dict[str, Any]:
    return make_response(
        ok=True,
        operation="bridge.start",
        message="Bridge is already running in this Blender process",
        data={
            "managed_by": "blender-addon",
            "server_running": _server is not None,
            "port": 8765,
        },
        next_steps=[
            "Use CLI/MCP bridge start to launch managed Blender process when bridge is not running",
            "Run `blendops bridge status --verbose` to verify readiness",
        ],
    )


def _delayed_stop_server() -> None:
    time.sleep(0.05)
    stop_server()


def handle_bridge_stop(_command: Dict[str, Any]) -> Dict[str, Any]:
    if _server is None:
        return make_response(
            ok=False,
            operation="bridge.stop",
            message="Bridge is not running in this Blender process",
            next_steps=["Use CLI bridge start to launch the bridge"],
        )

    Thread(target=_delayed_stop_server, daemon=True).start()

    return make_response(
        ok=True,
        operation="bridge.stop",
        message="Bridge stop requested for this Blender process",
        data={"stopping": True},
        warnings=["This will stop HTTP bridge handling in current Blender process"],
    )


def handle_bridge_logs(command: Dict[str, Any]) -> Dict[str, Any]:
    tail = command.get("tail", 80)
    try:
        tail_int = int(tail)
    except (TypeError, ValueError):
        tail_int = 80

    if tail_int <= 0:
        tail_int = 80
    if tail_int > 1000:
        tail_int = 1000

    return make_response(
        ok=True,
        operation="bridge.logs",
        message="Bridge-side log tail is available in Blender console",
        data={
            "tail": tail_int,
            "note": "Use CLI bridge logs for managed process stdout/stderr files",
            "last_operation": _last_operation,
            "last_request_id": _last_request_id,
            "request_count": _request_count,
            "last_error": _last_error,
            "last_duration_ms": _last_duration_ms,
        },
        next_steps=[
            "Run `blendops bridge logs --tail 120` for managed process stdout/stderr tails",
            "Inspect Blender console window for in-process bridge lifecycle logs",
        ],
    )


def handle_undo_last(_command: Dict[str, Any]) -> Dict[str, Any]:
    undo_poll = bpy.ops.ed.undo.poll()
    if not undo_poll:
        return make_response(
            ok=False,
            operation="undo.last",
            message="No undo step available",
            data={
                "undone": False,
                "detail": "Blender undo stack is empty or undo is unavailable in current context",
            },
            warnings=["Undo not executed because no undo step is available"],
            next_steps=["Run `blendops scene inspect` to confirm current scene state"],
        )

    try:
        result = bpy.ops.ed.undo()
        was_undone = "FINISHED" in result

        if was_undone:
            return make_response(
                ok=True,
                operation="undo.last",
                message="Undo executed",
                data={
                    "undone": True,
                    "detail": "Reverted last undoable scene operation",
                },
                next_steps=["Run `blendops scene inspect` to verify scene changes after undo"],
            )

        return make_response(
            ok=False,
            operation="undo.last",
            message="Undo did not execute",
            data={
                "undone": False,
                "detail": "Blender undo operator did not report FINISHED",
            },
            warnings=["Undo operator returned without FINISHED status"],
            next_steps=["Run `blendops scene inspect` to confirm scene state"],
        )
    except Exception as e:
        return make_response(
            ok=False,
            operation="undo.last",
            message=f"Undo failed: {str(e)}",
            data={
                "undone": False,
                "detail": "Undo execution raised an exception",
            },
            warnings=[traceback.format_exc()],
            next_steps=["Check Blender console for detailed error", "Run `blendops scene inspect` to confirm scene state"],
        )


BATCH_PLAN_FORBIDDEN_OPERATIONS = {
    "batch.plan",
    "bridge.start",
    "bridge.stop",
    "bridge.logs",
    "bridge.status",
    "bridge.operations",
}
BATCH_PLAN_ALLOWED_OPERATIONS = {
    "scene.inspect",
    "scene.clear",
    "undo.last",
    "object.create",
    "object.transform",
    "material.create",
    "material.apply",
    "lighting.setup",
    "camera.set",
    "render.preview",
    "validate.scene",
    "export.asset",
}
BATCH_PLAN_FORBIDDEN_KEYS = {"python", "script", "shell", "command", "eval", "exec"}
BATCH_PLAN_OUTPUT_OPERATIONS = {"render.preview", "export.asset"}
BATCH_PLAN_ALLOWED_OBJECT_TYPES = {"cube", "uv_sphere", "ico_sphere", "cylinder", "cone", "torus", "plane"}
BATCH_PLAN_ALLOWED_LIGHTING_PRESETS = {"studio", "three_point", "soft_key"}
BATCH_PLAN_ALLOWED_EXPORT_FORMATS = set(EXPORT_FORMAT_EXTENSIONS.keys())


def _batch_add_error(
    errors: list[Dict[str, Any]],
    step: Optional[int],
    error: str,
    operation: Optional[str] = None,
    field: Optional[str] = None,
) -> None:
    payload: Dict[str, Any] = {
        "step": step,
        "error": error,
    }
    if operation is not None:
        payload["operation"] = operation
    if field is not None:
        payload["field"] = field
    errors.append(payload)


def is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and len(value.strip()) > 0


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def is_positive_number(value: Any) -> bool:
    return is_number(value) and float(value) > 0


def is_positive_integer(value: Any) -> bool:
    return is_number(value) and float(value).is_integer() and int(float(value)) > 0


def is_vec3(value: Any) -> bool:
    return isinstance(value, list) and len(value) == 3 and all(is_number(component) for component in value)


def is_hex_color(value: Any) -> bool:
    return isinstance(value, str) and re.fullmatch(r"^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$", value.strip()) is not None


def is_rgba_color(value: Any) -> bool:
    if not isinstance(value, list) or len(value) != 4:
        return False
    if not all(is_number(channel) for channel in value):
        return False
    return all(0.0 <= float(channel) <= 1.0 for channel in value)


def _batch_validate_step(raw_step: Dict[str, Any], step_label: int) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "operation": None,
        "errors": [],
        "warnings": [],
        "notes": [],
        "unsupported_operation": None,
        "destructive_step": False,
        "requires_confirmation": False,
    }

    step_operation_value = raw_step.get("operation")
    if not is_non_empty_string(step_operation_value):
        _batch_add_error(result["errors"], step_label, "operation must be a non-empty string", field="operation")
        return result

    normalized_op = str(step_operation_value).strip()
    result["operation"] = normalized_op

    for forbidden_key in BATCH_PLAN_FORBIDDEN_KEYS:
        if forbidden_key in raw_step:
            _batch_add_error(
                result["errors"],
                step_label,
                f"forbidden field: {forbidden_key}",
                operation=normalized_op,
                field=forbidden_key,
            )

    if normalized_op in BATCH_PLAN_FORBIDDEN_OPERATIONS:
        _batch_add_error(
            result["errors"],
            step_label,
            "operation is not allowed in batch.plan",
            operation=normalized_op,
            field="operation",
        )
        result["unsupported_operation"] = normalized_op
        return result

    if normalized_op not in BATCH_PLAN_ALLOWED_OPERATIONS:
        _batch_add_error(
            result["errors"],
            step_label,
            "operation is not supported for batch.plan",
            operation=normalized_op,
            field="operation",
        )
        result["unsupported_operation"] = normalized_op
        return result

    if normalized_op == "scene.inspect":
        ignored_fields = sorted([key for key in raw_step.keys() if key not in {"operation", "request_id"}])
        if len(ignored_fields) > 0:
            result["warnings"].append(
                f"step {step_label}: scene.inspect ignores extra fields: {', '.join(ignored_fields)}"
            )

    elif normalized_op == "scene.clear":
        result["destructive_step"] = True
        result["requires_confirmation"] = True
        result["notes"].append(f"step {step_label}: scene.clear is destructive")

        if raw_step.get("confirm") != "CLEAR_SCENE":
            _batch_add_error(
                result["errors"],
                step_label,
                "scene.clear requires confirm=CLEAR_SCENE",
                operation=normalized_op,
                field="confirm",
            )

        if "dry_run" in raw_step and not isinstance(raw_step.get("dry_run"), bool):
            _batch_add_error(
                result["errors"],
                step_label,
                "dry_run must be boolean",
                operation=normalized_op,
                field="dry_run",
            )

        if raw_step.get("dry_run") is not True:
            result["warnings"].append(
                f"step {step_label}: real scene.clear requires confirm=CLEAR_SCENE and dry_run preview first"
            )
            result["notes"].append(
                f"step {step_label}: real scene.clear requires confirm=CLEAR_SCENE and dry_run preview first"
            )

    elif normalized_op == "undo.last":
        result["destructive_step"] = True
        result["notes"].append(f"step {step_label}: undo.last is stateful and context dependent")

    elif normalized_op == "object.create":
        object_type = raw_step.get("type")
        if not is_non_empty_string(object_type) or str(object_type).strip() not in BATCH_PLAN_ALLOWED_OBJECT_TYPES:
            _batch_add_error(
                result["errors"],
                step_label,
                "type is required and must be one of: cube, uv_sphere, ico_sphere, cylinder, cone, torus, plane",
                operation=normalized_op,
                field="type",
            )

        if not is_non_empty_string(raw_step.get("name")):
            _batch_add_error(
                result["errors"],
                step_label,
                "name is required and must be a non-empty string",
                operation=normalized_op,
                field="name",
            )

        for vec_field in ("location", "rotation", "scale"):
            if vec_field in raw_step and not is_vec3(raw_step.get(vec_field)):
                _batch_add_error(
                    result["errors"],
                    step_label,
                    f"{vec_field} must be a vec3 number array",
                    operation=normalized_op,
                    field=vec_field,
                )

    elif normalized_op == "object.transform":
        if not is_non_empty_string(raw_step.get("name")):
            _batch_add_error(
                result["errors"],
                step_label,
                "name is required and must be a non-empty string",
                operation=normalized_op,
                field="name",
            )

        has_transform_field = any(field in raw_step for field in ("location", "rotation", "scale"))
        if not has_transform_field:
            _batch_add_error(
                result["errors"],
                step_label,
                "object.transform requires at least one of location, rotation, or scale",
                operation=normalized_op,
                field="location|rotation|scale",
            )

        for vec_field in ("location", "rotation", "scale"):
            if vec_field in raw_step and not is_vec3(raw_step.get(vec_field)):
                _batch_add_error(
                    result["errors"],
                    step_label,
                    f"{vec_field} must be a vec3 number array",
                    operation=normalized_op,
                    field=vec_field,
                )

    elif normalized_op == "material.create":
        if not is_non_empty_string(raw_step.get("name")):
            _batch_add_error(
                result["errors"],
                step_label,
                "name is required and must be a non-empty string",
                operation=normalized_op,
                field="name",
            )

        if "color" not in raw_step:
            _batch_add_error(
                result["errors"],
                step_label,
                "color is required",
                operation=normalized_op,
                field="color",
            )
        else:
            color_value = raw_step.get("color")
            if not is_hex_color(color_value) and not is_rgba_color(color_value):
                _batch_add_error(
                    result["errors"],
                    step_label,
                    "color must be a hex string (#RRGGBB or #RRGGBBAA) or RGBA array with values 0..1",
                    operation=normalized_op,
                    field="color",
                )

        for numeric_field in ("roughness", "metallic"):
            if numeric_field in raw_step:
                numeric_value = raw_step.get(numeric_field)
                if not is_number(numeric_value) or float(numeric_value) < 0 or float(numeric_value) > 1:
                    _batch_add_error(
                        result["errors"],
                        step_label,
                        f"{numeric_field} must be a number between 0 and 1",
                        operation=normalized_op,
                        field=numeric_field,
                    )

    elif normalized_op == "material.apply":
        object_target = raw_step.get("object")
        if object_target is None:
            object_target = raw_step.get("object_name")
        material_target = raw_step.get("material")
        if material_target is None:
            material_target = raw_step.get("material_name")

        if not is_non_empty_string(object_target):
            _batch_add_error(
                result["errors"],
                step_label,
                "object is required and must be a non-empty string",
                operation=normalized_op,
                field="object",
            )

        if not is_non_empty_string(material_target):
            _batch_add_error(
                result["errors"],
                step_label,
                "material is required and must be a non-empty string",
                operation=normalized_op,
                field="material",
            )

    elif normalized_op == "lighting.setup":
        preset = raw_step.get("preset")
        if not is_non_empty_string(preset) or str(preset).strip() not in BATCH_PLAN_ALLOWED_LIGHTING_PRESETS:
            _batch_add_error(
                result["errors"],
                step_label,
                "preset is required and must be one of: studio, three_point, soft_key",
                operation=normalized_op,
                field="preset",
            )

        if "target" in raw_step and not is_non_empty_string(raw_step.get("target")):
            _batch_add_error(
                result["errors"],
                step_label,
                "target must be a non-empty string when provided",
                operation=normalized_op,
                field="target",
            )

    elif normalized_op == "camera.set":
        target_value = raw_step.get("target")
        has_target = "target" in raw_step and target_value is not None
        has_location = "location" in raw_step and raw_step.get("location") is not None
        has_rotation = "rotation" in raw_step and raw_step.get("rotation") is not None

        if has_target and not is_non_empty_string(target_value):
            _batch_add_error(
                result["errors"],
                step_label,
                "target must be a non-empty string when provided",
                operation=normalized_op,
                field="target",
            )

        if has_location and not is_vec3(raw_step.get("location")):
            _batch_add_error(
                result["errors"],
                step_label,
                "location must be a vec3 number array",
                operation=normalized_op,
                field="location",
            )

        if has_rotation and not is_vec3(raw_step.get("rotation")):
            _batch_add_error(
                result["errors"],
                step_label,
                "rotation must be a vec3 number array",
                operation=normalized_op,
                field="rotation",
            )

        for numeric_field in ("distance", "focal_length"):
            if numeric_field in raw_step and raw_step.get(numeric_field) is not None:
                if not is_positive_number(raw_step.get(numeric_field)):
                    _batch_add_error(
                        result["errors"],
                        step_label,
                        f"{numeric_field} must be a positive number",
                        operation=normalized_op,
                        field=numeric_field,
                    )

        if not has_target and not has_location:
            _batch_add_error(
                result["errors"],
                step_label,
                "camera.set requires at least target or location",
                operation=normalized_op,
                field="target",
            )

        if has_location and not has_target and not has_rotation:
            _batch_add_error(
                result["errors"],
                step_label,
                "camera.set requires rotation when location is provided without target",
                operation=normalized_op,
                field="rotation",
            )

    elif normalized_op == "render.preview":
        output_value = raw_step.get("output")
        if not is_non_empty_string(output_value):
            _batch_add_error(
                result["errors"],
                step_label,
                "output is required and must be a non-empty string",
                operation=normalized_op,
                field="output",
            )
        elif not str(output_value).lower().endswith(".png"):
            _batch_add_error(
                result["errors"],
                step_label,
                "output must end with .png",
                operation=normalized_op,
                field="output",
            )

        for integer_field in ("width", "height", "samples"):
            if integer_field in raw_step and raw_step.get(integer_field) is not None:
                if not is_positive_integer(raw_step.get(integer_field)):
                    _batch_add_error(
                        result["errors"],
                        step_label,
                        f"{integer_field} must be a positive integer",
                        operation=normalized_op,
                        field=integer_field,
                    )

        result["notes"].append(f"step {step_label}: {normalized_op} produces output artifacts")

    elif normalized_op == "validate.scene":
        preset_value = raw_step.get("preset")
        if not is_non_empty_string(preset_value) or str(preset_value).strip() not in VALIDATION_PRESETS:
            _batch_add_error(
                result["errors"],
                step_label,
                "preset is required and must be one of: basic, game_asset, render_ready",
                operation=normalized_op,
                field="preset",
            )

    elif normalized_op == "export.asset":
        format_value = raw_step.get("format")
        normalized_format: Optional[str] = None
        if is_non_empty_string(format_value):
            normalized_format = str(format_value).strip().lower()

        if normalized_format is None or normalized_format not in BATCH_PLAN_ALLOWED_EXPORT_FORMATS:
            _batch_add_error(
                result["errors"],
                step_label,
                "format is required and must be one of: glb, gltf, fbx",
                operation=normalized_op,
                field="format",
            )

        output_value = raw_step.get("output")
        if not is_non_empty_string(output_value):
            _batch_add_error(
                result["errors"],
                step_label,
                "output is required and must be a non-empty string",
                operation=normalized_op,
                field="output",
            )
        elif normalized_format is not None:
            expected_extension = EXPORT_FORMAT_EXTENSIONS[normalized_format]
            if not str(output_value).lower().endswith(expected_extension):
                _batch_add_error(
                    result["errors"],
                    step_label,
                    f"output must end with {expected_extension} for format {normalized_format}",
                    operation=normalized_op,
                    field="output",
                )

        for boolean_field in ("selected_only", "apply_modifiers"):
            if boolean_field in raw_step and not isinstance(raw_step.get(boolean_field), bool):
                _batch_add_error(
                    result["errors"],
                    step_label,
                    f"{boolean_field} must be boolean",
                    operation=normalized_op,
                    field=boolean_field,
                )

        result["notes"].append(f"step {step_label}: {normalized_op} produces output artifacts")
        if normalized_format in {"glb", "gltf"}:
            result["notes"].append(
                f"step {step_label}: {normalized_format} export requires GUI bridge on Blender 4.2"
            )

    if normalized_op in BATCH_PLAN_OUTPUT_OPERATIONS and (
        f"step {step_label}: {normalized_op} produces output artifacts" not in result["notes"]
    ):
        result["notes"].append(f"step {step_label}: {normalized_op} produces output artifacts")

    return result


def _canonicalize_batch_value(value: Any) -> Any:
    """Recursively canonicalize a value for deterministic fingerprinting."""
    if isinstance(value, dict):
        return {k: _canonicalize_batch_value(v) for k, v in sorted(value.items())}
    elif isinstance(value, list):
        return [_canonicalize_batch_value(item) for item in value]
    elif isinstance(value, str):
        return value.strip()
    else:
        return value


def _normalize_batch_steps_for_fingerprint(steps: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
    """Normalize steps array for deterministic fingerprinting by removing runtime metadata."""
    normalized = []
    for step in steps:
        if not isinstance(step, dict):
            continue
        normalized_step = {}
        for key, value in step.items():
            if key in ("request_id", "receipt"):
                continue
            normalized_step[key] = value
        normalized.append(normalized_step)
    return normalized


def _batch_plan_fingerprint(steps: list[Dict[str, Any]]) -> str:
    """Generate deterministic SHA-256 fingerprint from normalized steps."""
    normalized_steps = _normalize_batch_steps_for_fingerprint(steps)
    canonical = _canonicalize_batch_value(normalized_steps)
    canonical_json = json.dumps(canonical, sort_keys=True, separators=(',', ':'))
    hash_digest = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()
    return f"sha256:{hash_digest}"


def handle_batch_plan(command: Dict[str, Any]) -> Dict[str, Any]:
    operation = "batch.plan"

    steps = command.get("steps")
    if not isinstance(steps, list):
        return make_response(
            ok=False,
            operation=operation,
            message="batch.plan requires steps array",
            data={
                "step_count": 0,
                "operations": [],
                "destructive_steps": 0,
                "requires_confirmation": False,
                "unsupported_operations": [],
                "valid": False,
                "executable": False,
                "notes": [],
                "validation_errors": [{"step": None, "field": "steps", "error": "steps must be an array"}],
            },
            warnings=["Invalid steps payload"],
            next_steps=["Provide steps as an array with 1 to 25 typed operations"],
        )

    step_count = len(steps)
    if step_count == 0 or step_count > 25:
        return make_response(
            ok=False,
            operation=operation,
            message="batch.plan steps must contain between 1 and 25 items",
            data={
                "step_count": step_count,
                "operations": [],
                "destructive_steps": 0,
                "requires_confirmation": False,
                "unsupported_operations": [],
                "valid": False,
                "executable": False,
                "notes": [],
                "validation_errors": [{"step": None, "field": "steps", "error": "steps count must be within 1..25"}],
            },
            warnings=["Unsupported step count"],
            next_steps=["Split large plans into smaller batches and retry batch.plan"],
        )

    operations: list[str] = []
    notes: list[str] = []
    warnings: list[str] = []
    validation_errors: list[Dict[str, Any]] = []
    unsupported_operations: list[str] = []
    destructive_steps = 0
    requires_confirmation = False

    for index, raw_step in enumerate(steps):
        step_label = index + 1
        if not isinstance(raw_step, dict):
            _batch_add_error(validation_errors, step_label, "step must be an object", field="step")
            continue

        result = _batch_validate_step(raw_step, step_label)

        normalized_op = result.get("operation")
        if isinstance(normalized_op, str):
            operations.append(normalized_op)

        notes.extend(result.get("notes", []))
        warnings.extend(result.get("warnings", []))

        if bool(result.get("destructive_step")):
            destructive_steps += 1
        if bool(result.get("requires_confirmation")):
            requires_confirmation = True

        unsupported_op = result.get("unsupported_operation")
        if isinstance(unsupported_op, str) and unsupported_op not in unsupported_operations:
            unsupported_operations.append(unsupported_op)

        errors = result.get("errors")
        if isinstance(errors, list):
            validation_errors.extend(errors)

    valid = len(validation_errors) == 0 and len(unsupported_operations) == 0

    plan_fingerprint = None
    if isinstance(steps, list) and len(steps) > 0:
        try:
            plan_fingerprint = _batch_plan_fingerprint(steps)
        except Exception:
            pass

    data: Dict[str, Any] = {
        "step_count": step_count,
        "operations": operations,
        "destructive_steps": destructive_steps,
        "requires_confirmation": requires_confirmation,
        "unsupported_operations": unsupported_operations,
        "valid": valid,
        "executable": False,
        "notes": notes,
    }

    if plan_fingerprint is not None:
        data["plan_fingerprint"] = plan_fingerprint

    if not valid:
        data["validation_errors"] = validation_errors
        return make_response(
            ok=False,
            operation=operation,
            message="batch.plan validation failed",
            data=data,
            warnings=warnings + ["One or more steps are invalid or unsupported"],
            next_steps=[
                "Fix validation_errors and retry batch.plan",
                "Use typed operations only; batch.execute is not implemented",
            ],
        )

    return make_response(
        ok=True,
        operation=operation,
        message="batch.plan validated successfully",
        data=data,
        warnings=warnings,
        next_steps=[
            "Review plan summary and run steps individually",
            "batch.execute is not implemented yet",
        ],
    )


def _generate_batch_execute_preview(step_num: int, operation: str, raw_step: Dict[str, Any]) -> Dict[str, Any]:
    effect = ""
    
    if operation == "scene.inspect":
        effect = "inspect scene state"
    elif operation == "scene.clear":
        effect = "would clear scene objects"
    elif operation == "undo.last":
        effect = "undo is context-dependent"
    elif operation == "object.create":
        obj_type = raw_step.get("type", "unknown")
        obj_name = raw_step.get("name", "unnamed")
        effect = f"create {obj_type} object '{obj_name}'"
    elif operation == "object.transform":
        obj_name = raw_step.get("name", "unnamed")
        transforms = []
        if "location" in raw_step:
            transforms.append("location")
        if "rotation" in raw_step:
            transforms.append("rotation")
        if "scale" in raw_step:
            transforms.append("scale")
        effect = f"transform object '{obj_name}' ({', '.join(transforms)})"
    elif operation == "material.create":
        mat_name = raw_step.get("name", "unnamed")
        effect = f"create material '{mat_name}'"
    elif operation == "material.apply":
        obj_name = raw_step.get("object") or raw_step.get("object_name", "unnamed")
        mat_name = raw_step.get("material") or raw_step.get("material_name", "unnamed")
        effect = f"apply material '{mat_name}' to object '{obj_name}'"
    elif operation == "lighting.setup":
        preset = raw_step.get("preset", "unknown")
        target = raw_step.get("target")
        if target:
            effect = f"setup {preset} lighting targeting '{target}'"
        else:
            effect = f"setup {preset} lighting"
    elif operation == "camera.set":
        target = raw_step.get("target")
        if target:
            effect = f"set camera targeting '{target}'"
        else:
            effect = "set camera position/rotation"
    elif operation == "render.preview":
        output = raw_step.get("output", "renders/preview.png")
        effect = f"output artifact would be produced at {output}"
    elif operation == "validate.scene":
        preset = raw_step.get("preset", "basic")
        effect = f"validate scene with {preset} preset"
    elif operation == "export.asset":
        fmt = raw_step.get("format", "unknown")
        output = raw_step.get("output", "unknown")
        effect = f"output artifact would be produced at {output} ({fmt})"
    else:
        effect = f"execute {operation}"
    
    return {
        "step": step_num,
        "operation": operation,
        "effect": effect,
    }


def handle_batch_execute(command: Dict[str, Any]) -> Dict[str, Any]:
    operation = "batch.execute"
    
    dry_run = command.get("dry_run")
    if dry_run is not True:
        return make_response(
            ok=False,
            operation=operation,
            message="batch.execute requires dry_run=true; real execution is not implemented",
            data={
                "dry_run": dry_run if isinstance(dry_run, bool) else None,
                "executable": False,
                "step_count": 0,
                "operations": [],
                "valid": False,
                "would_execute": [],
                "destructive_steps": 0,
                "requires_confirmation": False,
                "notes": ["Only dry-run mode is supported"],
            },
            warnings=["Real batch execution is not implemented"],
            next_steps=["Rerun with dry_run=true to preview steps"],
        )
    
    steps = command.get("steps")
    if not isinstance(steps, list):
        return make_response(
            ok=False,
            operation=operation,
            message="batch.execute requires steps array",
            data={
                "dry_run": True,
                "executable": False,
                "step_count": 0,
                "operations": [],
                "valid": False,
                "would_execute": [],
                "destructive_steps": 0,
                "requires_confirmation": False,
                "validation_errors": [{"step": None, "field": "steps", "error": "steps must be an array"}],
                "notes": [],
            },
            warnings=["Invalid steps payload"],
            next_steps=["Provide steps as an array with 1 to 25 typed operations"],
        )
    
    step_count = len(steps)
    if step_count == 0 or step_count > 25:
        return make_response(
            ok=False,
            operation=operation,
            message="batch.execute steps must contain between 1 and 25 items",
            data={
                "dry_run": True,
                "executable": False,
                "step_count": step_count,
                "operations": [],
                "valid": False,
                "would_execute": [],
                "destructive_steps": 0,
                "requires_confirmation": False,
                "validation_errors": [{"step": None, "field": "steps", "error": "steps count must be within 1..25"}],
                "notes": [],
            },
            warnings=["Unsupported step count"],
            next_steps=["Split large plans into smaller batches"],
        )
    
    operations: list[str] = []
    notes: list[str] = []
    warnings: list[str] = []
    validation_errors: list[Dict[str, Any]] = []
    would_execute: list[Dict[str, Any]] = []
    destructive_steps = 0
    requires_confirmation = False
    
    for index, raw_step in enumerate(steps):
        step_label = index + 1
        if not isinstance(raw_step, dict):
            validation_errors.append({
                "step": step_label,
                "field": "step",
                "error": "step must be an object",
            })
            continue
        
        result = _batch_validate_step(raw_step, step_label)
        
        normalized_op = result.get("operation")
        if isinstance(normalized_op, str):
            operations.append(normalized_op)
            if len(result.get("errors", [])) == 0:
                preview = _generate_batch_execute_preview(step_label, normalized_op, raw_step)
                would_execute.append(preview)
        
        notes.extend(result.get("notes", []))
        warnings.extend(result.get("warnings", []))
        
        if bool(result.get("destructive_step")):
            destructive_steps += 1
        if bool(result.get("requires_confirmation")):
            requires_confirmation = True
        
        errors = result.get("errors")
        if isinstance(errors, list):
            validation_errors.extend(errors)
    
    valid = len(validation_errors) == 0
    
    plan_fingerprint = None
    if isinstance(steps, list) and len(steps) > 0:
        try:
            plan_fingerprint = _batch_plan_fingerprint(steps)
        except Exception:
            pass
    
    dry_run_id = None
    if plan_fingerprint is not None:
        fingerprint_short = plan_fingerprint.replace("sha256:", "")[:16]
        request_id_value = command.get("request_id", "unknown")
        dry_run_id = f"dryrun:{fingerprint_short}:{request_id_value}"
    
    data: Dict[str, Any] = {
        "dry_run": True,
        "executable": False,
        "step_count": step_count,
        "operations": operations,
        "valid": valid,
        "would_execute": would_execute,
        "destructive_steps": destructive_steps,
        "requires_confirmation": requires_confirmation,
        "validation_errors": validation_errors,
        "notes": notes,
    }
    
    if plan_fingerprint is not None:
        data["plan_fingerprint"] = plan_fingerprint
    if dry_run_id is not None:
        data["dry_run_id"] = dry_run_id
    
    if not valid:
        return make_response(
            ok=False,
            operation=operation,
            message="batch.execute dry-run validation failed",
            data=data,
            warnings=warnings + ["One or more steps are invalid"],
            next_steps=[
                "Fix validation_errors and retry",
                "Real batch.execute is not implemented yet",
            ],
        )
    
    return make_response(
        ok=True,
        operation=operation,
        message="batch.execute dry-run preview complete",
        data=data,
        warnings=warnings,
        next_steps=[
            "Review dry-run output",
            "Real batch execution is not implemented yet",
            "Run individual operations manually or wait for future batch.execute support",
        ],
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
            rgba = [float(channel) for channel in color]
        except (TypeError, ValueError):
            return None

        if any(channel < 0.0 or channel > 1.0 for channel in rgba):
            return None

        return (rgba[0], rgba[1], rgba[2], rgba[3])

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

    if export_format in ("glb", "gltf") and getattr(bpy.context, "window", None) is None:
        return make_response(
            ok=False,
            operation="export.asset",
            message="GLB/GLTF export requires a Blender GUI window context in Blender 4.2",
            next_steps=["Start the BlendOps bridge from Blender GUI instead of background mode"],
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

    active_object = None
    original_selected: list[Any] = []

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

        selected_objects_for_export = [obj for obj in scene.objects if obj.select_get()]
        active_object_for_export = bpy.context.view_layer.objects.active

        if active_object_for_export is None:
            if len(selected_objects_for_export) > 0:
                active_object_for_export = selected_objects_for_export[0]
            elif len(mesh_objects) > 0:
                active_object_for_export = mesh_objects[0]

        def run_export_with_context(export_callable: Any) -> None:
            if hasattr(bpy.context, "temp_override"):
                override_kwargs: Dict[str, Any] = {
                    "scene": scene,
                    "view_layer": bpy.context.view_layer,
                }
                if active_object_for_export is not None:
                    override_kwargs["active_object"] = active_object_for_export
                    override_kwargs["object"] = active_object_for_export
                if len(selected_objects_for_export) > 0:
                    override_kwargs["selected_objects"] = selected_objects_for_export
                    override_kwargs["selected_editable_objects"] = selected_objects_for_export
                with bpy.context.temp_override(**override_kwargs):
                    export_callable()
            else:
                export_callable()

        if export_format == "glb":
            run_export_with_context(lambda: bpy.ops.export_scene.gltf(
                filepath=output_path,
                export_format="GLB",
                use_selection=selected_only,
                export_apply=apply_modifiers,
            ))
        elif export_format == "gltf":
            run_export_with_context(lambda: bpy.ops.export_scene.gltf(
                filepath=output_path,
                export_format="GLTF_SEPARATE",
                use_selection=selected_only,
                export_apply=apply_modifiers,
            ))
        elif export_format == "fbx":
            run_export_with_context(lambda: bpy.ops.export_scene.fbx(
                filepath=output_path,
                use_selection=selected_only,
                apply_scale_options="FBX_SCALE_NONE",
                use_mesh_modifiers=apply_modifiers,
            ))

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
    global _request_count, _last_operation, _last_error, _last_duration_ms, _last_request_id

    operation = _coerce_operation_name(command.get("operation"))
    request_id = _coerce_request_id(command.get("request_id"))
    start = time.time()

    if operation == "bridge.status":
        _log(f"status check ok request_id={request_id}")
    else:
        _log(f"received: {operation} request_id={request_id}")

    if operation == "bridge.status":
        uptime_seconds = int(time.time() - _server_start_time) if _server_start_time > 0 else 0
        blender_version_tuple = tuple(bpy.app.version)
        background_mode = bpy.app.background
        has_window_context = getattr(bpy.context, "window", None) is not None
        export_glb_supported = not (background_mode and not has_window_context)
        export_gltf_supported = not (background_mode and not has_window_context)

        compatibility_notes = []
        if not export_glb_supported or not export_gltf_supported:
            compatibility_notes.append("GLB/GLTF export requires GUI bridge on Blender 4.2 background mode")

        response = make_response(
            ok=True,
            operation="bridge.status",
            message="BlendOps bridge is running",
            data={
                "version": ".".join(map(str, bl_info["version"])),
                "started_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(_server_start_time)) if _server_start_time > 0 else None,
                "uptime_seconds": uptime_seconds,
                "request_count": _request_count + 1,
                "last_operation": operation,
                "last_error": None,
                "last_duration_ms": _last_duration_ms,
                "last_request_id": request_id,
                "implemented_operations": list(OPERATION_REGISTRY.keys()),
                "blender_version": bpy.app.version_string,
                "blender_version_tuple": blender_version_tuple,
                "background_mode": background_mode,
                "has_window_context": has_window_context,
                "export_glb_supported": export_glb_supported,
                "export_gltf_supported": export_gltf_supported,
                "export_fbx_supported": "unknown",
                "compatibility_notes": compatibility_notes,
            },
            request_id=request_id,
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
                request_id=request_id,
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
                    request_id=request_id,
                )

    duration_ms = int((time.time() - start) * 1000)

    _request_count += 1
    _last_operation = operation
    _last_duration_ms = duration_ms
    _last_request_id = request_id
    if not response.get("ok"):
        _last_error = response.get("message")
    else:
        _last_error = None

    response["request_id"] = response.get("request_id") or request_id
    response["receipt"] = response.get("receipt") or {
        "request_id": response["request_id"],
        "operation": operation,
        "ok": bool(response.get("ok")),
        "duration_ms": duration_ms,
    }

    if response.get("ok"):
        if operation != "bridge.status":
            _log(f"completed: {operation} ok {duration_ms}ms request_id={response['request_id']}")
            output_path = response.get("data", {}).get("output") if isinstance(response.get("data"), dict) else None
            if isinstance(output_path, str) and output_path.strip():
                _log(f"output: {output_path}")
    else:
        _log(f"failed: {operation} {duration_ms}ms request_id={response['request_id']}")
        error_message = response.get("message")
        if isinstance(error_message, str) and error_message.strip():
            _log(f"reason: {error_message}")
        next_steps = response.get("next_steps")
        if isinstance(next_steps, list) and len(next_steps) > 0 and isinstance(next_steps[0], str):
            _log(f"next: {next_steps[0]}")

    last_error_label = _last_error if _last_error else "none"
    _log(f"status: alive | requests={_request_count} | last={_last_operation} | last_error={last_error_label} | last_request_id={_last_request_id}")

    return response


def process_command(command: Dict[str, Any]) -> Dict[str, Any]:
    return _dispatch_with_observability(command, client_ip=None)


def _coerce_operation_name(value: Any) -> str:
    if isinstance(value, str):
        return value
    return "unknown"


def _coerce_request_id(value: Any) -> str:
    if isinstance(value, str) and len(value.strip()) > 0:
        return value.strip()
    return f"req_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"


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
            fallback_request_id = _coerce_request_id(command.get("request_id"))
            _response_queue[command_id] = make_response(
                ok=False,
                operation="bridge.error",
                message=f"Command processing failed: {str(e)}",
                warnings=[traceback.format_exc()],
                request_id=fallback_request_id,
                receipt={
                    "request_id": fallback_request_id,
                    "operation": "bridge.error",
                    "ok": False,
                },
            )

    return 0.1


class BlendOpsHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        # Suppress low-level HTTP logs - semantic logs are handled by _dispatch_with_observability
        pass

    def do_GET(self) -> None:
        parsed_path = urlparse(self.path)
        route_path = parsed_path.path
        request_id_header = self.headers.get("X-BlendOps-Request-Id")
        query_request_id_values = parse_qs(parsed_path.query).get("request_id", [])
        query_request_id = query_request_id_values[0] if len(query_request_id_values) > 0 else None
        request_id = request_id_header if isinstance(request_id_header, str) and len(request_id_header.strip()) > 0 else query_request_id

        if route_path == "/status":
            self._handle_status(request_id=request_id)
        elif route_path == "/favicon.ico":
            # Silently ignore browser favicon requests
            self._send_json(
                404,
                make_response(
                    ok=False,
                    operation="bridge.http",
                    message="Not found",
                    data={},
                ),
            )
        else:
            _log(f"ignored unsupported GET {self.path}")
            self._send_json(
                405,
                make_response(
                    ok=False,
                    operation="bridge.http",
                    message=f"Unsupported GET path: {self.path}",
                    data={},
                    warnings=["GET is only supported for /status"],
                    next_steps=["Use GET /status or the BlendOps CLI"],
                ),
            )

    def do_POST(self) -> None:
        global _command_queue, _response_queue

        parsed_path = urlparse(self.path)
        route_path = parsed_path.path
        request_id_header = self.headers.get("X-BlendOps-Request-Id")
        query_request_id_values = parse_qs(parsed_path.query).get("request_id", [])
        query_request_id = query_request_id_values[0] if len(query_request_id_values) > 0 else None
        request_id = request_id_header if isinstance(request_id_header, str) and len(request_id_header.strip()) > 0 else query_request_id

        if route_path == "/status":
            self._handle_status(request_id=request_id)
        elif route_path == "/command":
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

    def _handle_status(self, request_id: Optional[str] = None) -> None:
        client_ip = self.client_address[0] if isinstance(self.client_address, tuple) else None
        command: Dict[str, Any] = {"operation": "bridge.status"}
        if isinstance(request_id, str) and len(request_id.strip()) > 0:
            command["request_id"] = request_id.strip()
        response = _dispatch_with_observability(command, client_ip=client_ip)
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
                    request_id = _coerce_request_id(command.get("request_id"))
                    self._send_json(
                        504,
                        make_response(
                            ok=False,
                            operation="bridge.timeout",
                            message="Command processing timed out",
                            warnings=["Command may still be processing"],
                            request_id=request_id,
                            receipt={
                                "request_id": request_id,
                                "operation": "bridge.timeout",
                                "ok": False,
                            },
                        ),
                    )
                    return

            response = _response_queue.pop(command_id)
            self._send_json(200, response)

        except json.JSONDecodeError:
            request_id = _coerce_request_id(None)
            self._send_json(
                400,
                make_response(
                    ok=False,
                    operation="bridge.invalid_json",
                    message="Invalid JSON in request body",
                    request_id=request_id,
                    receipt={
                        "request_id": request_id,
                        "operation": "bridge.invalid_json",
                        "ok": False,
                    },
                ),
            )
        except Exception as e:
            request_id = _coerce_request_id(None)
            self._send_json(
                500,
                make_response(
                    ok=False,
                    operation="bridge.error",
                    message=f"Request handling failed: {str(e)}",
                    request_id=request_id,
                    receipt={
                        "request_id": request_id,
                        "operation": "bridge.error",
                        "ok": False,
                    },
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
        print(" BlendOps Bridge is running", flush=True)
        print(f" Version: {'.'.join(map(str, bl_info['version']))}", flush=True)
        print(f" URL: http://127.0.0.1:{port}", flush=True)
        print(f" Status page: http://127.0.0.1:{port}/status", flush=True)
        print("", flush=True)
        print(" Keep this window open while using BlendOps.", flush=True)
        print("", flush=True)
        print(" Try:", flush=True)
        print("   npm run cli -- bridge status", flush=True)
        print("   npm run cli -- scene inspect --verbose", flush=True)
        print("", flush=True)
        print(" This window will show BlendOps operation logs.", flush=True)
        print("=" * 60, flush=True)
        sys.stdout.flush()
        
        _log("ready and waiting for commands")
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
    OPERATION_REGISTRY["scene.clear"] = handle_scene_clear
    OPERATION_REGISTRY["bridge.operations"] = lambda _command: handle_bridge_operations()
    OPERATION_REGISTRY["bridge.start"] = handle_bridge_start
    OPERATION_REGISTRY["bridge.stop"] = handle_bridge_stop
    OPERATION_REGISTRY["bridge.logs"] = handle_bridge_logs
    OPERATION_REGISTRY["undo.last"] = handle_undo_last
    OPERATION_REGISTRY["batch.plan"] = handle_batch_plan
    OPERATION_REGISTRY["batch.execute"] = handle_batch_execute
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
