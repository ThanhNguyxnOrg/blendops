# Runtime Claim Verification Record — Lab MCP, Blender CLI, Community Path 2

Status: **Source verification record (documentation claims only).** No Blender run, no runtime eval, no artifacts produced.
Date: 2026-10-13
Scope: Re-check the runtime claims BlendOps docs make, against primary sources (official docs, source code, specs).

> [!CAUTION]
> This record verifies **what upstream documentation and source code say**. It does **not** run Blender, does not exercise either MCP path, and does not produce preview/render/GLB artifacts. It must **not** be used to promote the Path 1 or Path 2 eval scope in [`../evals/`](../evals/). Those truths remain what their own eval files say.

> [!NOTE]
> **Jargon glosses** (repo law: plain language for non-Blender users). "MCP" = a standard plug for connecting an AI assistant to another program. "Add-on" = an installable extension inside Blender. "Manifest" = a small metadata file shipped with an add-on that declares which Blender versions it supports. "Sidebar tab" = a named panel you open by pressing `N` in Blender's 3D viewport. "Engine" = the renderer Blender uses to produce an image. "Background mode" (`--background`) = running Blender with no visible window.

---

## How sources were read (access method + honesty)

| Source | Access method | Result |
|---|---|---|
| `www.blender.org/lab/mcp-server/` | Direct fetch first — **blocked (HTTP 403)**. Then re-read through a text-extraction proxy (`r.jina.ai`). | Page text read successfully via proxy. |
| `projects.blender.org/lab/blender_mcp` | Direct fetch — **blocked (HTTP 403)**. Not re-read. | **Not verified** in this pass. |
| `docs.blender.org/manual/...` (all CLI pages) | Direct fetch — **blocked (HTTP 403)**. Then re-read through the same text-extraction proxy. | Page text read successfully via proxy. |
| `docs.blender.org/api/current/...` | Direct fetch — **blocked (HTTP 403)**. Then re-read through the proxy. | Page text read successfully via proxy. |
| `api.github.com`, `raw.githubusercontent.com`, `github.com`, `pypi.org`, `claude.com` | Direct fetch. | Read successfully, no proxy needed. |

**Verified via**: official vendor documentation (Anthropic, Blender, PyPI, GitHub) and upstream source code / repository metadata. No secondary blogs, no wiki mirrors, no AI summaries. Where a source could not be reached at all, the row below says **Not verified** rather than guessing.

Access date for every source in this record: **2026-10-13**.

> [!NOTE]
> Timing footnote: the text-extraction proxy stamped the Lab page content with a server time of `2026-10-14T01:16Z`, i.e. just after midnight UTC on the day after the nominal access date. The content is what the page served at that fetch; the date recorded for this record is 2026-10-13 per repo convention.

---

## Claim-by-claim verification

### Path 1 — Official Blender Lab MCP

#### Claim 1 — "The Lab page lists 'Blender 5.1 or newer' as requirement #1"

**Verdict: Not verified (as a verbatim quote) / Verified in substance (the 5.1 floor is real).**

| | |
|---|---|
| **Source** | <https://www.blender.org/lab/mcp-server/> — read 2026-10-13 via text-extraction proxy (direct fetch blocked, HTTP 403). What was read: full page body. |
| **What I actually found** | The page has **no numbered requirements list**, and the exact phrase **"Blender 5.1 or newer" does not appear** anywhere in the page text. The version floor is instead carried **inside the install link**, as a URL parameter: <br>`.../releases/download/v1.0.3/mcp-1.0.3.zip?repository=https%3A%2F%2Flab.blender.org%2F&**blender_version_min=5.1.0**` |
| **Also on the page** | "**Blender does not have any built-in functionality for connecting to LLMs.** In order for Blender to connect with LLMs, **three external tools must be manually downloaded, installed, and run**." A prominent **Security Warning**: "The MCP server will execute LLM generated code in Blender without any guards in place to protect your data." "If you drag & drop into Blender **you will need to do it twice**." An `.mcpb`-bundle route ("For newer clients that support `.mcpb` files"). |
| **Notes** | The claim is right about the **floor (5.1)** and wrong about the **form** (it is not a numbered "requirement #1"; it is a machine-readable parameter on the download link). Two independent primary sources confirm the 5.1.0 figure — this page's link parameter and the add-on manifest (Claim 2). BlendOps docs should stop describing it as "requirement #1: 'Blender 5.1 or newer'" and instead say "the Lab page's install link carries `blender_version_min=5.1.0`". |
| **Superseded detail** | The in-repo doc cites the add-on zip as `mcp-1.0.0.zip`. The Lab page now links **`mcp-1.0.3.zip`** (release `v1.0.3`). The `blender_version_min=5.1.0` value is unchanged across both. |

#### Claim 2 — "The Lab add-on manifest literal is `blender_version_min = 5.1.0`"

**Verdict: Verified.**

| | |
|---|---|
| **Source** | <https://github.com/bpype/blender_mcp> → `addon/blender_mcp_addon/blender_manifest.toml` (branch `main`, blob SHA `1d634fc29b12678ae354c1bd522eaf10998360f2`). Read via GitHub contents API and raw file, 2026-10-13. |
| **Verbatim literal found** | ```blender_version_min = "5.1.0"``` |
| **Full manifest as read** | `schema_version = "1.0.0"` · `id = "mcp"` · `version = "1.0.0"` · `name = "MCP"` · `tagline = "MCP server add-on for LLM interaction"` · `maintainer = "Blender Lab"` · `type = "add-on"` · `website = "https://www.blender.org/lab/mcp-server/"` · `blender_version_min = "5.1.0"` · license `SPDX:GPL-3.0-or-later` · `tags = ["Development"]` · `[permissions] network = "Runs a local TCP socket server for MCP client communication"` |
| **Notes** | This is the authoritative machine-readable floor and it exactly matches the value in the Lab page install link (Claim 1). **This manifest is the binding constraint for Path 1** and it governs Path 1 only — it must not be applied to Path 2 or to the CLI appendix (per AGENTS.md hard rule 1). |
| **Discrepancy worth knowing** | The manifest on branch `main` declares `version = "1.0.0"`, but the release the Lab page hands users is `v1.0.3`. The published add-on is therefore ahead of the `main`-branch manifest version string. The `blender_version_min` value is the same in both places, so the floor is not affected. |

#### Claim 3 — Lab MCP tool surface (the tool list BlendOps docs refer to)

**Verdict: Verified.** Listed from `readme_tools.rst` in the repo, and independently cross-checked against the tool modules on disk.

| | |
|---|---|
| **Source** | <https://github.com/bpype/blender_mcp/blob/main/readme_tools.rst> (the file the repo docs point at for the tool list), plus a directory listing of `mcp/blmcp/tools/` for cross-check. Read 2026-10-13. |
| **What was read** | `readme_tools.rst` is auto-generated from tool doc-strings by `make readme_update` (stated in the file header: "Do not edit the listing between the sentinels below by hand"). It lists **26 named entries**. |
| **The 20 distinct tools** | `execute_blender_code`, `get_blendfile_summary_datablocks`, `get_blendfile_summary_missing_files`, `get_blendfile_summary_of_linked_libraries`, `get_blendfile_summary_path_info`, `get_blendfile_summary_usage_guess`, `get_object_detail_summary`, `get_objects_summary`, `get_python_api_docs`, `get_screenshot_of_area_as_image`, `get_screenshot_of_window_as_image`, `get_screenshot_of_window_as_json`, `jump_to_tab_by_name`, `jump_to_tab_by_space_type`, `jump_to_view3d_object_by_name`, `jump_to_view3d_object_data_by_name`, `render_thumbnail_to_path`, `render_viewport_to_path`, `search_api_docs`, `search_manual_docs` |
| **The extra 6 entries** | Six of the 26 are `…_for_cli` duplicates (`execute_blender_code_for_cli`, `get_blendfile_summary_datablocks_for_cli`, `get_blendfile_summary_missing_files_for_cli`, `get_blendfile_summary_of_linked_libraries_for_cli`, `get_blendfile_summary_path_info_for_cli`, `get_blendfile_summary_usage_guess_for_cli`). The README explains why: "**Deferred responses are supported only by the interactive add-on server; background mode requires requests to complete synchronously** and rejects deferred results." So the `_for_cli` variants are the same tools in a background-mode-safe form, not separate capabilities. |
| **Cross-check** | `mcp/blmcp/tools/` contains exactly one module per tool, matching the 20 distinct names one-for-one (`execute_blender_code.py`, `get_blendfile_summary_datablocks.py`, `get_blendfile_summary_missing_files.py`, `get_blendfile_summary_of_linked_libraries.py`, `get_blendfile_summary_path_info.py`, `get_blendfile_summary_usage_guess.py`, `get_object_detail_summary.py`, `get_objects_summary.py`, `get_python_api_docs.py`, `get_screenshot_of_area_as_image.py`, `get_screenshot_of_window_as_image.py`, `get_screenshot_of_window_as_json.py`, `jump_to_tab_by_name.py`, `jump_to_tab_by_space_type.py`, `jump_to_view3d_object_by_name.py`, `jump_to_view3d_object_data_by_name.py`, `render_thumbnail_to_path.py`, `render_viewport_to_path.py`, `search_api_docs.py`, `search_manual_docs.py`), plus `*_toolcode.py` companions and `_template_*.py` helper stubs. |
| **Notes for BlendOps** | The three tools recorded in the 2026-04-29 read-only smoke test (`get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_objects_summary`) **all still exist** in today's surface — the old record stays consistent. The surface also includes tools that touch the filesystem and can write files (`render_viewport_to_path`, `render_thumbnail_to_path`), which matters for any future eval that claims "read-only". |
| **Architecture, quoted** | "A **Blender add-on** that runs inside Blender and executes requests" + "An **MCP server** that runs as a separate process, launched by the MCP client". Data flow: `MCP Client ⇐ MCP/stdio ⇒ blender-mcp ⇐ TCP socket ⇒ Blender Add-on`. Also: `mcp/blmcp/data/prompts.yml` provides LLM instructions at connection time; bundled `api/` and `manual/` RST data powers the two search tools. |

#### Claim 4 — "Anthropic's tutorial tells the user to install the Lab add-on inside Blender, and states 'Blender 4.2 or later'"

**Verdict: Verified (both parts, verbatim).**

| | |
|---|---|
| **Source** | <https://claude.com/resources/tutorials/using-the-blender-connector-in-claude> — "Using the Blender Connector in Claude", Anthropic Claude Academy. Read 2026-10-13 (direct fetch, no proxy). |
| **Connector is not standalone — verbatim** | "First, add the Blender connector in Claude Desktop, **then install an add-on inside Blender so the two can communicate**." |
| **Step 2 installs the Lab add-on — verbatim** | "**Step 2: Install the add-on in Blender** — 1. Open the [Blender MCP Server page](https://www.blender.org/lab/mcp-server/) in a browser alongside Blender. 2. Drag the install link from that page into the Blender window. Blender will prompt you to add the **lab** extension repository; allow it. 3. Drag the same link into Blender a second time. This installs the add-on." |
| **Prerequisite — verbatim** | "**Blender 4.2 or later** — free at [blender.org/download](https://www.blender.org/download/)". Also lists "Claude Desktop — any Claude plan, including Free". |
| **Other relevant statements** | "The connector was built by the Blender developers and released as part of [Claude for Creative Work]." "The connector is built on the open Model Context Protocol and **works with other MCP clients, including Claude Code**." FAQ: "Does the connector work on claude.ai in the browser? — No. The connector needs Blender running on the same machine as Claude, so it requires Claude Desktop." Step 3 refers to a "**BlenderMCP tab**" and "start MCP server". |
| **Notes** | Confirms AGENTS.md hard rule 1: the Connector is a **host**, not a standalone runtime; the Blender-side add-on is required either way. The "works with other MCP clients" line is independent support for Path 1 host option (b). |
| **The version-floor tension — and the correct reading** | Anthropic says **4.2 or later**; the Lab add-on manifest says **5.1.0** (Claim 2). These are not contradictory — Anthropic is stating a loose prerequisite for the Connector surface, while the add-on it tells you to install will not install below 5.1.0. **The manifest governs.** BlendOps correctly applies the 5.1+ floor to Path 1 only, and correctly does *not* push 5.1 onto Path 2 or the CLI appendix. |
| **Label caution** | "BlenderMCP" is the tab name in Anthropic's **Path 1 / Lab** walkthrough (Step 3). It is **not** the label of the community Path 2 add-on (see Claim 6). Do not use it as a shared label for both paths. |

---

### CLI fallback (appendix)

#### Claim 5 — "`--background`, `--python <file>`, and `-E`/`--engine` are documented command-line args"

**Verdict: Verified.** All three are documented, verbatim, in the Blender Manual's command-line arguments page, on the **Blender 5.2 LTS Manual** ("Last updated on 2026-10-13").

| | |
|---|---|
| **Sources** | `https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html` ("Command Line Arguments — Blender 5.2 LTS Manual"), and `.../advanced/command_line/render.html` ("Rendering From The Command Line"). Both read 2026-10-13 via text-extraction proxy (direct fetch blocked, HTTP 403). |
| **`--background` — verbatim** | "`-b`, `--background` — Run in background (often used for UI-less rendering)." Plus: "The audio device is disabled in background-mode by default and can be re-enabled by passing in `-setaudio Default` afterwards." |
| **`--python` — verbatim** | "`-P`, `--python` `<filepath>` — Run the given Python script file." (Note: short form is uppercase `-P`.) Related Python options also documented: `--python-text`, `--python-expr`, `--python-console`, `--python-exit-code`, `--python-use-system-env`. |
| **`-E` / `--engine` — verbatim** | "`-E`, `--engine` `<engine>` — Specify the render engine. Use `-E help` to list available engines." Also documented nearby: `-a`/`--render-anim`, `-f`/`--render-frame`, `-o`/`--render-output`, `-F` (image format override, e.g. `-F OPEN_EXR`), `-s`/`--frame-start`, `-e`/`--frame-end`, `-S`/`--scene`, `-t`/`--threads`, `--addons`, `--online-mode`/`--offline-mode`. |
| **Ordering rule, verbatim** | "Arguments are executed in the order they are given!" and "**Always** position `-f` or `-a` as the last arguments." Also "Arguments are case sensitive! `-F` and `-f` are not the same." |
| **Manual version found** | `latest` resolves to the **Blender 5.2 LTS Manual** for the CLI pages. The render page's footer reads "Last updated on 2026-10-13". The render page's worked example uses `blender -b file.blend -E CYCLES -s 10 -e 500 -t 2 -a`. |

#### Claim 5b — "Which engine tokens exist (`BLENDER_EEVEE` vs `BLENDER_EEVEE_NEXT`)"

**Verdict: `BLENDER_EEVEE` verified. `BLENDER_EEVEE_NEXT` NOT verified.**

| | |
|---|---|
| **Source** | `https://docs.blender.org/api/current/bpy.types.RenderSettings.html` — Blender Python API reference. Read 2026-10-13 via text-extraction proxy. |
| **Verbatim found** | "`engine` — Engine to use for rendering (default `'BLENDER_EEVEE'`)" with declared type `Literal['BLENDER_EEVEE']`. |
| **Why this is thin** | The API reference page as rendered shows only **one** enum literal for `RenderSettings.engine`. It is a valid primary source for `BLENDER_EEVEE` (and confirms it is the default), but it does **not** enumerate the full token list, and the string `BLENDER_EEVEE_NEXT` appears **nowhere** in it. |
| **What the CLI page says instead** | The command-line arguments page does **not** enumerate engine tokens at all — it deliberately defers: "Use `-E help` to list available engines." So the manual expects the user to ask the installed Blender, not to read a list. |
| **Notes** | **No primary source reachable in this pass confirms `BLENDER_EEVEE_NEXT` as a valid `-E` token.** It may well be one, but this record cannot say so. The 2026-04-29 smoke test recorded `Render engine: BLENDER_EEVEE` for the default startup scene — that is consistent with the API default, but it is an in-repo observation, not an upstream enumeration. Any doc that names `BLENDER_EEVEE_NEXT` should be treated as **unverified until someone runs `blender -E help` on a real install** and records the output. |

#### Claim 5c — "The CLI is a documented first-class upstream surface (BlendOps' own hedged claim)"

**Verdict: Verified as documentation. Stability beyond that: not claimed by this record.**

| | |
|---|---|
| **What is directly verified** | The command-line arguments page is a first-class, current, maintained part of the official Blender Manual (5.2 LTS, last updated 2026-10-13), with a dedicated section index for command-line topics and a full argument reference covering render, format, Python, network, logging, debug, GPU and miscellaneous options. The "Rendering From The Command Line" page cross-references it. That is exactly what "documented upstream as a first-class surface" should mean. |
| **What is NOT verified** | Any claim that a given flag is **stable across LTS releases**. I read the `latest` (5.2 LTS) pages only. I did not diff the CLI surface across Blender 2.93–5.2, so I can neither confirm nor deny cross-version stability. Note that AGENTS.md has **already removed** the "(stable across LTS releases)" hedge from the CLI line, and this record supplies no evidence for that stronger wording. |
| **URL structure change (superseded)** | The URL BlendOps-side sources point at — `docs.blender.org/manual/en/latest/advanced/command_line/**introduction.html**` — returns **404 Not Found** on the Blender 5.2 LTS Manual. The introductory material now lives at `advanced/command_line/**launch/index.html**` ("Launching from the Command Line"), and the argument list is at `advanced/command_line/**arguments.html**`. If any doc links to `…/command_line/introduction.html`, that link is dead. |
| **Related note** | The arguments page links onward to `advanced/command_line/extension_arguments.html` and `advanced/scripting/index.html`, i.e. the CLI surface is broader than just render + Python. |

---

### Path 2 — Community

#### Claim 6 — Community repo identity, stars, package, run command, Blender support, ports, sidebar tab

**Verdict: Verified (all parts), with two in-repo labels now superseded.**

| Sub-claim | Verdict | Source (URL + what was read, 2026-10-13) | What I found |
|---|---|---|---|
| **Canonical repo is `ahujasid/mcp-for-blender`** | **Verified** | `https://api.github.com/repos/ahujasid/blender-mcp` (repo metadata) | The API call to the old slug returned the object with `"full_name": "ahujasid/mcp-for-blender"` — i.e. **`github.com/ahujasid/blender-mcp` resolves to the renamed repo**. `html_url` is `https://github.com/ahujasid/mcp-for-blender`. Both URLs work today. |
| **Star count as of today** | **Verified — and it supersedes the in-repo figure** | same repo metadata | `stargazers_count: 30672` (**30,672 stars**), `forks_count: 2775`, `subscribers_count: 206`, `open_issues_count: 47`, `default_branch: main`, `license: MIT`, `created_at: 2025-03-07`, `pushed_at: 2026-10-06`. In-repo docs still say "mature 20K+ stars" — **superseded**; the correct figure is ~30.7k as of 2026-10-13. |
| **PyPI package name** | **Verified** | `https://pypi.org/project/mcp-for-blender/` | The package is **`mcp-for-blender`** (latest **2.1.9**, released **Oct 6, 2026**; `requires-python >=3.10`; console script `mcp-for-blender`; author Siddharth Ahuja; MIT). |
| **Legacy PyPI name still works** | **Verified** | README of the repo + PyPI page | "the PyPI package `blender-mcp` is now **`mcp-for-blender`**. Existing setups keep working — `uvx blender-mcp` still runs the server and **no config change is required**. New installs should use `mcp-for-blender`." Reason documented in issue #366. |
| **Run command** | **Verified** | repo README + PyPI | **`uvx mcp-for-blender`** is the current canonical command (README: "Already have uv? Run `uvx mcp-for-blender setup` instead."). Other documented commands: `uvx mcp-for-blender install-addon`, `uvx mcp-for-blender addon-paths`, `uvx mcp-for-blender@latest update`, `uvx mcp-for-blender --port 9877`. Legacy `uvx blender-mcp` still works. |
| **Blender version support** | **Verified** | repo README (Prerequisites) + `addon.py` `bl_info` | README prerequisites: "**Blender** 3.0 or newer", "**Python** 3.10 or newer", "**uv** package manager". `addon.py` declares `bl_info["blender"] = (3, 0, 0)`. Matches the "3.0+" claim. |
| **Default port(s)** | **Verified — with a nuance** | README environment-variable table + `addon.py` registration code | README: "`BLENDER_PORT` \| `9876` \| Port number for Blender socket server", `BLENDER_HOST` \| `localhost`. In `addon.py`: `bpy.types.Scene.blendermcp_port = IntProperty(name="Port", description="Port for the MCP for Blender server", default=9876, min=1024, max=65535)`. **9876 is the single default port.** `9877` is documented only as an **example for a second, additional instance** ("`uvx mcp-for-blender --port 9877`" / a second MCP-client entry pointing at a different port), not a second default. The socket is unauthenticated: "the addon's socket server has no authentication or encryption, so anyone who can reach that port can run Python inside Blender." |
| **Sidebar tab label** | **Verified — and it supersedes a label BlendOps docs use** | `addon.py` panel class + README | The panel is `BLENDERMCP_PT_Panel` with `bl_label = "MCP for Blender"`, `bl_idname = "BLENDERMCP_PT_Panel"`, `bl_category = 'MCP for Blender'`, `bl_space_type = 'VIEW_3D'`, `bl_region_type = 'UI'`. `bl_info`: `"name": "MCP for Blender"`, `"location": "View3D > Sidebar > MCP for Blender"`, `"category": "Interface"`, `"version": (1, 8)`. README: "Then open the **MCP for Blender** tab in Blender's sidebar (press `N` in the 3D viewport)". |
| **Path 2 tool surface** | **Verified** | repo README (Capabilities) | README: "The MCP adds what Python can't do on its own, as **nine tools**": `execute_blender_code`, `look`, `get_scene_info`, `generate_3d`, `search_assets` / `import_asset`, `get_addon_status`, `disable_telemetry`, `record_trajectory_feedback`. The two tools named in BlendOps' 2026-04-29 note (`get_scene_info`, `execute_blender_code`) both still exist — but the surface has grown to nine, so that note understates it. |
| **Third-party status** | **Verified** | repo README + PyPI description | "**This is a third-party integration and not made by Blender.**" / "(not affiliated with Blender Foundation)". Confirms Path 2 is community-run, not official. |

### Label findings that follow from the above (documentation bugs, not runtime bugs)

These are things a doc editor should fix. I changed nothing.

1. **`docs/unofficial-runtime-bridges.md` (the Path 2 caveats doc) tells the reader to "Open the **BlenderMCP** tab in Blender's 3D View sidebar (`N`) and click Connect to your client."** Upstream, the community add-on's sidebar tab is labeled **"MCP for Blender"** (verified in `addon.py` and the README). "BlenderMCP" is the *Lab/Path 1* tab name used in Anthropic's tutorial, and is otherwise only an internal code identifier in the community add-on. **The Path 2 doc names the wrong tab.**
2. **In-repo "mature 20K+ stars"** for Path 2 is stale; upstream shows **30,672** on 2026-10-13.
3. **The Lab page's `blender_version_min=5.1.0`** should not be described as "requirement #1" — it is a URL parameter on the install link, plus the manifest literal.
4. **The Lab release zip referenced in-repo is `mcp-1.0.0.zip`**; the Lab page links `mcp-1.0.3.zip`.
5. Any link to `docs.blender.org/manual/en/latest/advanced/command_line/introduction.html` is a **404** on the 5.2 LTS Manual; the live pages are `launch/index.html` and `arguments.html`.
6. The claim that Path 2's tool surface is `get_scene_info` + `execute_blender_code` is incomplete — it is now nine tools.

---

## What this record does NOT verify

1. **Anything about actually running Blender.** No Blender was started. No Blender version was recorded. Both runtime evals stay exactly as their own records say them to be.
2. **Path 1 or Path 2 runtime success, mutation, render, export, GLB, or preview artifacts.** All remain `Not Run` / `Not Produced` per the eval files. This record is source verification only.
3. **Anything from `projects.blender.org/lab/blender_mcp`** (the Lab repo's own host): direct fetch returned HTTP 403 and I did not re-read it. The GitHub mirror `bpype/blender_mcp` was read instead, and the two refer to the same project (the mirror's README points to `blender.org/lab/mcp-server` and links Lab wiki pages), but the Gitea-hosted original is unverified here.
4. **The exact phrase "Blender 5.1 or newer" on the Lab page.** Not present in the text as read. The 5.1 floor itself is verified twice over (page link parameter + manifest literal), but not in that wording.
5. **`BLENDER_EEVEE_NEXT` as a valid `-E` engine token.** No reachable primary source lists it. `BLENDER_EEVEE` is verified (and is the default per the Python API reference). The full token list requires `blender -E help` on a real install.
6. **Cross-version stability of any CLI flag.** Only the Blender 5.2 LTS ("latest") manual pages were read. No diff against 2.93–5.2 or any other version was performed, so no stability claim is made either way. AGENTS.md currently states the CLI is documented upstream without the "stable across LTS releases" hedge; this record supports only the "documented" part.
7. **That the `bpype/blender_mcp` GitHub mirror's `main` branch equals the shipped Lab release.** The mirror manifest says `version = "1.0.0"` while the Lab page links `v1.0.3`. Only the Lab page's linked artifact is the user-facing one.
8. **Whether the 26-entry `readme_tools.rst` list is byte-identical to what a live MCP client actually advertises.** It is generated from tool doc-strings by the repo's own build step and cross-checked against the on-disk modules, but I did not connect a client to a running server and enumerate tools.
9. **Behavior, permissions, or safety of any upstream component.** I read what the docs and manifests declare, including the Lab page's own security warning ("executes LLM generated code in Blender without any guards") and the community add-on's opt-in telemetry and `BLENDER_MCP_SAFE_MODE` option. I did not audit either.

---

## Source list (all accessed 2026-10-13)

| # | Source | Type |
|---|---|---|
| S1 | https://www.blender.org/lab/mcp-server/ | Official Blender page (via proxy) |
| S2 | https://github.com/bpype/blender_mcp → `addon/blender_mcp_addon/blender_manifest.toml` | Upstream source code |
| S3 | https://github.com/bpype/blender_mcp/blob/main/readme_tools.rst | Upstream repo docs |
| S4 | https://github.com/bpype/blender_mcp → `mcp/blmcp/tools/` listing | Upstream source code |
| S5 | https://github.com/bpype/blender_mcp/blob/main/readme.md | Upstream repo docs |
| S6 | https://claude.com/resources/tutorials/using-the-blender-connector-in-claude | Official Anthropic tutorial |
| S7 | https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html | Official Blender Manual |
| S8 | https://docs.blender.org/manual/en/latest/advanced/command_line/render.html | Official Blender Manual |
| S9 | https://docs.blender.org/manual/en/latest/advanced/command_line/launch/index.html | Official Blender Manual |
| S10 | https://docs.blender.org/api/current/bpy.types.RenderSettings.html | Official Blender Python API reference |
| S11 | https://api.github.com/repos/ahujasid/blender-mcp | GitHub repo metadata (redirected target) |
| S12 | https://github.com/ahujasid/mcp-for-blender | Community repo README |
| S13 | https://raw.githubusercontent.com/ahujasid/mcp-for-blender/main/addon.py | Community source code |
| S14 | https://raw.githubusercontent.com/ahujasid/mcp-for-blender/main/pyproject.toml | Community package metadata |
| S15 | https://pypi.org/project/mcp-for-blender/ | Official PyPI project page |
| S16 | https://docs.blender.org/manual/en/latest/advanced/command_line/introduction.html | **404 Not Found** (dead URL, recorded as such) |

---

## Non-actions preserved

- This record did not install Blender, run Blender, or connect any MCP client.
- This record did not create, modify, or delete any file in this repository other than itself.
- This record did not promote any runtime eval scope, truth state, or artifact claim.
- This record did not edit the documentation bugs it lists in the findings section.
