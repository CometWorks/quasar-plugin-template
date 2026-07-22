# Companion Channel

Use the companion channel when a Quasar UI plugin needs data from a Magnetar
plugin loaded into a managed Dedicated Server.

Register typed companion-channel clients through plugin DI. Keep those clients in
the UI project so PreviewHost can use mock implementations while the Quasar
adapter uses the real channel.

The UI plugin should not assume direct filesystem access to the server world or
plugin data. It asks Quasar, Quasar asks Quasar.Agent, and Quasar.Agent forwards
the request to the named companion plugin.

## Owned Companion Builds

The template includes `src/TemplatePlugin.Magnetar`, a minimal companion that
implements `IQuasarCompanionRequestHandler`. It exposes a `runtime.info`
operation and references `MySession` through the Dedicated Server assemblies,
demonstrating both the request contract and `DS64` usage.

It is declared as an owned companion in `quasar-plugin.json`:

```json
"companionPlugins": [
  {
    "id": "todo.template-plugin",
    "projectPath": "src/TemplatePlugin.Magnetar/TemplatePlugin.Magnetar.csproj",
    "entryAssembly": "TemplatePlugin.Magnetar.dll"
  }
]
```

Quasar builds owned companions with two host-resolved MSBuild properties:

- `MagnetarProtocolAssembly` points to the protocol assembly used by
  Quasar.Agent.
- `DS64` points to a valid Dedicated Server assembly directory resolved by
  Quasar, preferring its configured or managed runtime.

Reference Space Engineers assemblies through `$(DS64)` in the companion
project. Keep local-development defaults conditional so Quasar's command-line
value wins:

```xml
<PropertyGroup>
  <DS64 Condition="'$(DS64)' == '' AND $([MSBuild]::IsOSPlatform('Windows'))">$(registry:HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Steam App 298740@InstallLocation)\DedicatedServer64</DS64>
  <DS64 Condition="'$(DS64)' == '\DedicatedServer64'">C:\Program Files (x86)\Steam\steamapps\common\SpaceEngineersDedicatedServer\DedicatedServer64</DS64>
  <DS64 Condition="'$(DS64)' == '' AND !$([MSBuild]::IsOSPlatform('Windows')) AND Exists('$(HOME)/.local/share/Steam/steamapps/common/SpaceEngineersDedicatedServer/DedicatedServer64/Sandbox.Game.dll')">$(HOME)/.local/share/Steam/steamapps/common/SpaceEngineersDedicatedServer/DedicatedServer64</DS64>
  <DS64 Condition="'$(DS64)' == '' AND !$([MSBuild]::IsOSPlatform('Windows'))">$(HOME)/.steam/steam/steamapps/common/SpaceEngineersDedicatedServer/DedicatedServer64</DS64>
</PropertyGroup>

<ItemGroup>
  <Reference Include="Sandbox.Game" HintPath="$(DS64)\Sandbox.Game.dll" Private="False" />
  <Reference Include="VRage" HintPath="$(DS64)\VRage.dll" Private="False" />
</ItemGroup>
```

If Quasar cannot resolve a valid DS64 directory, it omits the property and these
local defaults remain active.

## Request Shape

```json
{
  "pluginId": "todo.template-plugin",
  "operation": "runtime.info",
  "schemaVersion": 1,
  "correlationId": "00000000-0000-0000-0000-000000000000",
  "payload": {}
}
```

## Response Shape

```json
{
  "schemaVersion": 1,
  "correlationId": "00000000-0000-0000-0000-000000000000",
  "success": true,
  "payload": {
    "spaceEngineersAssemblyVersion": "1.0.0.0"
  },
  "warnings": []
}
```

## Rules

- Keep operations versioned.
- Keep payloads bounded.
- Return metadata first, large content only through explicit follow-up requests.
- Use opaque snapshot/file references instead of exposing raw server paths.
- Let Quasar enforce web auth and rate limits.
- Let companion plugins enforce game/plugin-specific validity.

## Example Operations

- `runtime.info`
- `grid.audit.get`
- `grid.backups.list`
- `grid.snapshot.metadata`
- `grid.snapshot.scene`
- `grid.backup.create`
