# Quasar Plugin Template

Build a Quasar 1.7+ dashboard plugin with .NET 10 and Blazor WebAssembly.
The starter adds a navigation link, a page that reads its installed version
through the authorized panel SDK, and an action on each viewable entity row.
The dashboard runs the same browser components locally and under a hosted panel path.

## Create a plugin

From a checkout of this template, run:

```sh
dotnet new install .
dotnet new quasar-plugin -n Acme.FleetTools -o ../FleetTools
```

Use a unique ASCII .NET project name such as `Acme.FleetTools`. The generator
renames the namespaces, projects, DLLs and stylesheet, derives the package ID
and page route (`acme-fleet-tools` and `/acme-fleet-tools` in this example),
and generates a hub GUID. Run subsequent commands from the new project,
using its generated paths. A GitHub **Use this template** copy retains the
starter identifiers until you rename them yourself.

## Build and preview

Set `QUASAR_PUBLISH` to the Release publish directory of the target worker.

```sh
dotnet build src/TemplatePlugin.Quasar -c Release \
  -p:QuasarPluginAbstractionsAssembly="$QUASAR_PUBLISH/Quasar.Plugin.Abstractions.dll"
dotnet run --project samples/PreviewHost
```

The adapter can also build against a sibling `Quasar` checkout or an explicit
`-p:QuasarPluginAbstractionsProject=/path/to/Quasar.Plugin.Abstractions.csproj`.
QuasarHub supplies the running worker's abstractions DLL when it builds a package.

The standalone WASM preview shows a grid and a character with different action
availability, a theme toggle, and the same routable page as the dashboard.
Its preview-only SDK returns the value `preview`. An installed plugin reads
the version declared in its package manifest.

## Package and runtime

| Location | Responsibility |
| --- | --- |
| `src/TemplatePlugin` | Browser Razor class library. Contains the page, typed entity action and static CSS. |
| `src/TemplatePlugin.Quasar` | Worker adapter. Registers the route assembly, navigation, extension and authorized SDK operation. |
| `src/TemplatePlugin.Magnetar` | Owned game-server companion for the separate `runtime.info` example. |
| `quasar-plugin.json` | Runtime package ID, entry type, worker and browser DLL names, SDK version, project and static asset paths. |
| `quasar-hub.xml` | Source catalog entry with repository, minimum host version and reviewed commit. |

Building the adapter places `TemplatePlugin.Quasar.dll` and `TemplatePlugin.dll`
beside one another in `src/TemplatePlugin.Quasar/bin/Release/net10.0/`.
The manifest's `browserAssembly` is the browser DLL's **basename**. Quasar
discovers the adapter's build output, resolves `staticAssets` relative to the
manifest, and shadow-copies the package. To load the build locally, set
`QUASAR_UI_PLUGIN_DIR` to the absolute plugin repository directory when
starting a development worker and restart it after changes.

The adapter returns the component assembly from `GetRazorAssemblies()` and
registers the entity action through `GetExtensions()`. The worker checks the
page, navigation and outlet policies. The browser loads the declared assembly
through its authenticated panel and verifies its digest. Choose a unique route
for each plugin. The entity outlet passes named component parameters, including
a 64-bit entity ID and nullable unsigned owner ID. Preserve their types.

The page invokes `quasarSdk.request` on the dashboard's existing panel client.
Its `version.read` operation requires `CanView` on the worker, independently
of the page's `[Authorize]` attribute. Register worker services, persistence,
secrets and companion access in the adapter. Keep view state inside the
browser component. Use panel-relative links and assets so navigation works
under hosted prefixes. [Native UI](docs/NativeUi.md) · [Companion channel](docs/CompanionChannel.md)

## Check the installed plugin

The template checkout includes a generation test in `tests/generate.py`. It
creates a fresh renamed project and runs its browser check against Quasar's
published dashboard fixture at both root and a hosted path. Supply the matching
Quasar 1.7 source checkout, its Release publish output, Python 3, and Node
with Playwright, Chromium and Firefox installed. The companion and Quasar agent
builds use the Dedicated Server and Magnetar SDK paths.

```sh
dotnet publish "$QUASAR_SOURCE/Quasar/Quasar.csproj" -c Release -o "$QUASAR_PUBLISH"
python3 tests/generate.py "$QUASAR_SOURCE" "$QUASAR_PUBLISH"
```

The generated project retains `tests/dashboard.mjs`. To check a development
panel directly, pass its full base URL ending in `/` and, for a signed-in
panel, a local Playwright storage-state file. Keep session files private.

```sh
QUASAR_TEST_PANEL_URL="$PANEL_BASE_URL" QUASAR_TEST_STORAGE_STATE="$SESSION_FILE" \
  node tests/dashboard.mjs
```

For the generation test, set `PLAYWRIGHT_MODULE` to an absolute Playwright
module entry point accessible to the Quasar fixture. The standalone check can
also use a project-local installation of `playwright`. `CHROME_PATH`
can select a locally installed Chromium executable.

## Publish to QuasarHub

Set the repository owner, author, description and commit in the hub XML.
Keep the package and hub version requirements aligned. Build the optional
companion if you ship one, verify the generated package on your target
dashboard, then submit the catalog XML with the exact reviewed plugin commit.
