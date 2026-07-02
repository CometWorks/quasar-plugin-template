# MudBlazor Guidance

Quasar plugins should use MudBlazor for normal application UI. This keeps plugin
pages aligned with Quasar theme, accessibility behavior, density, dialogs, and
navigation.

## Use MudBlazor For

- `MudButton` and `MudIconButton`
- `MudDialog`
- `MudMenu`
- `MudTabs`
- `MudTable` or `MudDataGrid`
- `MudForm` and Mud input controls
- `MudAlert`
- `MudPaper`
- `MudProgressCircular` and `MudProgressLinear`
- `MudNavLink`

## Avoid

- second CSS frameworks
- standalone app shells
- hard-coded palettes
- custom button/input implementations when MudBlazor already has one
- page sections styled as nested cards unless they are repeated items or actual
  framed tools

## Custom Visual Surfaces

Custom rendering is allowed when the plugin's domain needs it. Examples:

- Three.js viewers
- canvas timelines
- log/event visualizations
- media previews

Keep surrounding controls in MudBlazor and use Quasar/MudBlazor CSS variables:

```css
.plugin-surface {
    color: var(--mud-palette-text-primary);
    background: var(--mud-palette-surface);
}
```

Declare small plugin-wide stylesheets in `quasar-plugin.json`:

```json
"stylesheets": [
  "template-plugin.css"
]
```

Quasar resolves these paths relative to `staticAssets` and injects them after
Quasar core CSS. Prefer narrow selectors and MudBlazor CSS variables.

## Review Rule

If a plugin avoids MudBlazor for ordinary UI, document why in the QuasarHub pull
request. Review should treat that as an exception.
