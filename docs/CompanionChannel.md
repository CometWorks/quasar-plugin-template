# Calling an owned Magnetar companion

The browser page calls a Quasar SDK operation. In the worker adapter, register
that operation with `AddQuasarOperation` and the policy required for the data or
action. Its handler can resolve `IQuasarCompanionChannel` from
`caller.Services`. Use an exact connected server ID returned by the channel.
Quasar.Agent dispatches the request to the named companion on that server.
Check target-specific access and validate inputs before sending commands.

The starter's `TemplatePlugin.Magnetar` project demonstrates the game-side
handler for `runtime.info`. It reads the Space Engineers assembly version and
returns it as `spaceEngineersAssemblyVersion` in the response payload. It
honors cancellation and preserves the request schema version and correlation
ID. The page's `version.read` sample reads the **UI package** version from
the worker manifest and works with zero game servers connected.

The package manifest declares the companion ID, project path and entry DLL.
QuasarHub builds it separately and installs it for managed servers. During
local development, the equivalent build is:

```sh
dotnet build src/TemplatePlugin.Magnetar -c Release \
  -p:MagnetarProtocolAssembly="$QUASAR_PUBLISH/Agent/Magnetar.Protocol.dll" \
  -p:DS64="$DS64" -p:MagnetarBin="$MagnetarBin"
```

`DS64` is the game's DedicatedServer64 directory. `MagnetarBin` contains
`PluginSdk.dll`. The project also accepts the installer’s `Magnetar` root and
has defaults for local Windows and Linux installs. For a UI-only plugin,
remove the companion project and its `companionPlugins` entry together.

Keep companion DTOs bounded and return only the fields the operator needs.
Use the SDK's authorized read/upload operations for large binary content.
Filesystem paths, agent credentials and the companion channel belong on the worker.
