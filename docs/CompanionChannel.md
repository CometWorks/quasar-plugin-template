# Companion Channel

Use the companion channel when a Quasar UI plugin needs data from a Magnetar
plugin loaded into a managed Dedicated Server.

Register typed companion-channel clients through plugin DI. Keep those clients in
the UI project so PreviewHost can use mock implementations while the Quasar
adapter uses the real channel.

The UI plugin should not assume direct filesystem access to the server world or
plugin data. It asks Quasar, Quasar asks Quasar.Agent, and Quasar.Agent forwards
the request to the named companion plugin.

## Request Shape

```json
{
  "pluginId": "GridBackups",
  "operation": "grid.audit.get",
  "schemaVersion": 1,
  "correlationId": "00000000-0000-0000-0000-000000000000",
  "payload": {
    "gridEntityId": 123456789
  }
}
```

## Response Shape

```json
{
  "schemaVersion": 1,
  "correlationId": "00000000-0000-0000-0000-000000000000",
  "success": true,
  "payload": {
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

- `grid.audit.get`
- `grid.backups.list`
- `grid.snapshot.metadata`
- `grid.snapshot.scene`
- `grid.backup.create`
