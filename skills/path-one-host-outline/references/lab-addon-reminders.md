# Lab add-on reminders

- Path 1 floor follows the Lab MCP add-on manifest (`blender_version_min = 5.1.x`) — explain as "Blender 5.1 or newer for Path 1" in plain language.
- Users must enable/configure the add-on inside Blender before any host can attach.
- Single-bridge constraint still applies: one MCP bridge session per Blender instance.
- After add-on work, pick host (a) Connector or (b) manual MCP — never skip ordering.

If user cannot upgrade Blender, Path 1 is off the table — route to `runtime-path-picker`.
