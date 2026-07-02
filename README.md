# Quasar Plugin Template

Starter repository for Quasar UI plugins.

Quasar UI plugins run inside the Quasar Blazor Server process. They can add
routes, nav items, extension components, static assets, and generic requests to
companion Magnetar plugins through Quasar.Agent.

The template also includes a standalone preview host so replacement pages and
components can be viewed quickly with Quasar-like MudBlazor theming.

The Quasar adapter uses a local sibling Quasar checkout when the default
`QuasarPluginAbstractionsProject` path resolves from
`src/TemplatePlugin.Quasar`, and falls back to the
`Quasar.Plugin.Abstractions` package otherwise. Override the MSBuild property
when Quasar lives elsewhere.

## Expected Layout

```text
.
|-- quasar-plugin.json
|-- quasar-hub.xml
|-- src/
|   |-- TemplatePlugin/
|   |   |-- TemplatePlugin.csproj
|   |   |-- _Imports.razor
|   |   |-- Pages/
|   |   |   `-- TemplatePage.razor
|   |   |-- Components/
|   |   |   `-- TemplateDashboardPanel.razor
|   |   `-- wwwroot/
|   |       `-- template-plugin.css
|   `-- TemplatePlugin.Quasar/
|       |-- TemplatePlugin.Quasar.csproj
|       `-- TemplateQuasarPlugin.cs
|-- samples/
|   `-- PreviewHost/
|       |-- PreviewHost.csproj
|       |-- Program.cs
|       |-- Components/
|       `-- wwwroot/
`-- docs/
    |-- CompanionChannel.md
    `-- MudBlazor.md
```

## Preview Workflow

Run the standalone preview host while building plugin UI:

```bash
dotnet run --project samples/PreviewHost/PreviewHost.csproj
```

The preview host references only the `TemplatePlugin` UI project and MudBlazor.
It does not require `Quasar.Plugin.Abstractions`, so component/page design stays
fast even when Quasar itself is not running.

Use the preview host to check:

- replacement pages
- dashboard panels
- entity/server action components
- plugin singleton/scoped state
- light and dark MudBlazor theme behavior
- responsive layout

The Quasar adapter lives in `src/TemplatePlugin.Quasar`. It is intentionally thin
and should only translate UI components into Quasar plugin contributions.

## MudBlazor First

Use MudBlazor for ordinary UI. This is not just a preference; it keeps Quasar
plugins visually coherent with Quasar core.

Use MudBlazor for:

- nav links
- buttons and icon buttons
- forms
- dialogs
- tabs
- tables/data grids
- menus
- cards/papers
- alerts
- progress/loading states

Custom HTML, CSS, canvas, WebGL, or Three.js is fine for specialized surfaces,
but the surrounding Quasar controls should still be MudBlazor and should inherit
Quasar theme tokens.

Do not ship Bootstrap, Tailwind, a second app shell, or a standalone color system
unless the plugin has a specific technical reason and the review calls it out.

## Package Manifest

`quasar-plugin.json` describes the runtime plugin package:

```json
{
  "id": "todo.template-plugin",
  "displayName": "Template Plugin",
  "version": "0.1.0",
  "entryAssembly": "TemplatePlugin.Quasar.dll",
  "entryType": "TemplatePlugin.Quasar.TemplateQuasarPlugin",
  "projectPath": "src/TemplatePlugin.Quasar/TemplatePlugin.Quasar.csproj",
  "staticAssets": "src/TemplatePlugin/wwwroot",
  "quasarVersion": ">=0.1.0",
  "companionPlugins": []
}
```

`quasar-hub.xml` is the catalog descriptor copied into
`CometWorks/quasar-hub/Plugins/` when publishing.

## Project Split

- `TemplatePlugin`
  - Razor components, pages, static assets, and UI services.
  - Buildable in the preview host without Quasar.
- `TemplatePlugin.Quasar`
  - Thin adapter implementing `IQuasarPlugin`.
  - Registers nav items, routes, extension points, endpoints, and services.
  - References `Quasar.Plugin.Abstractions`.

Keep most code in the UI project. Keep Quasar-specific code in the adapter.

## Dependency Injection and State

Put plugin services in the UI project and expose one registration method:

```csharp
public static IServiceCollection AddTemplatePluginUi(this IServiceCollection services)
{
    services.AddSingleton<TemplatePluginState>();
    return services;
}
```

Both hosts call this same method:

- `samples/PreviewHost/Program.cs`
- `src/TemplatePlugin.Quasar/TemplateQuasarPlugin.cs`

Use this pattern for:

- singleton plugin state
- scoped UI state
- typed clients
- companion-channel wrappers
- background services when they are bounded and cancellable

Avoid replacing Quasar core services unless Quasar exposes an explicit extension
target for that service.

## Plugin Entry Point

The entry point implements `IQuasarPlugin`:

```csharp
public sealed class TemplateQuasarPlugin : IQuasarPlugin
{
    public string Id => "todo.template-plugin";
    public string DisplayName => "Template Plugin";

    public void ConfigureServices(IServiceCollection services, QuasarPluginContext context)
    {
    }

    public void ConfigureEndpoints(IEndpointRouteBuilder endpoints, QuasarPluginContext context)
    {
    }

    public IEnumerable<Assembly> GetRazorAssemblies()
    {
        yield return typeof(TemplateDashboardPanel).Assembly;
    }

    public IEnumerable<QuasarNavItem> GetNavItems()
    {
        yield return new QuasarNavItem(
            "Template",
            "/template-plugin",
            Icons.Material.Filled.Extension,
            QuasarNavZones.Main,
            800,
            QuasarPolicyNames.CanView);
    }

    public IEnumerable<QuasarExtensionContribution> GetExtensions()
    {
        yield return new QuasarExtensionContribution(
            QuasarExtensionTargets.EntityActions,
            typeof(TemplateEntityAction),
            QuasarPatchMode.After,
            800,
            Id,
            QuasarPolicyNames.CanView);
    }
}
```

## Extension Points

Quasar plugins can contribute to stable extension targets. Currently hosted in
Quasar:

- `quasar.component.entity-actions`
- `quasar.page.entities`

Planned targets:

- `quasar.dashboard.panels`
- `quasar.component.entity-details-tabs`
- `quasar.component.server-detail-actions`
- `quasar.page.plugins`
- `quasar.page.analytics`

Use replacement carefully. Page/component replacement is powerful and should be
visible in the plugin manifest/review.

## Companion Channel

Use the companion channel when a UI plugin needs data from a Magnetar plugin
loaded into a managed Dedicated Server.

The UI plugin sends:

- target server id
- companion plugin id
- operation name
- JSON payload

The companion plugin replies with JSON payload. Keep operations versioned and
bounded.

Example operation names:

- `grid.audit.get`
- `grid.backups.list`
- `grid.snapshot.metadata`

## Publishing

1. Replace template ids, names, namespaces, and project paths.
2. Pin package versions.
3. Build and test the plugin against a compatible Quasar build.
4. Commit the plugin repository.
5. Copy `quasar-hub.xml` to `quasar-hub/Plugins/<PluginName>.xml`.
6. Set `Commit` to the exact plugin repository commit.
7. Open a QuasarHub pull request.
