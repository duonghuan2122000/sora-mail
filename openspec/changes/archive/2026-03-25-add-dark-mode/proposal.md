## Why

Users want a dark mode for the Electron application to reduce eye strain in low-light environments and improve accessibility.

## What Changes

- Add a theme toggle (light/dark) to the application settings.
- Persist the user's theme preference across sessions.
- Update CSS variables and component styles to support dark mode.

## Capabilities

### New Capabilities

- `theme-switching`: Handles toggling between light and dark themes and persisting the user's preference.

### Modified Capabilities

- None

## Impact

- **Main Process**: Add IPC handler to get/set theme preference (stored via `electron-store` or similar).
- **Renderer Process**: Update stylesheets to use dark mode variants. Add UI for theme toggle in settings.
- **Preload Script**: Expose API for theme communication.
