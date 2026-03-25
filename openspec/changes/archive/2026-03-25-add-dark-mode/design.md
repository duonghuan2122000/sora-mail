## Context

The Sora Mail application is an Electron + Vue.js desktop client. Currently, it only supports a light theme. Users have requested a dark mode option to reduce eye strain and improve accessibility in low-light environments.

## Goals / Non-Goals

**Goals:**

- Implement a theme toggle (light/dark) in the application.
- Persist the user's theme preference across application restarts.
- Ensure all UI components (including Element Plus) respect the selected theme.

**Non-Goals:**

- Adding multiple custom themes (only light and dark).
- System theme detection (auto-switch based on OS settings).

## Decisions

### 1. Storage Backend

**Decision:** Use the existing SQLite database (via Knex) to store theme preference.
**Rationale:** The application already uses a SQLite database for mail data. Adding a `settings` table keeps all user data in one place and avoids introducing new dependencies like `electron-store`.
**Implementation:**

- Add a `settings` table to the database via migration.
- Table schema: `key` (TEXT, PRIMARY KEY), `value` (TEXT).
- Store theme as `key: 'theme', value: 'light' | 'dark'`.

### 2. CSS Theming Strategy

**Decision:** Use CSS Custom Properties (variables) controlled by a `data-theme` attribute on the `<html>` element.
**Rationale:** This is a standard, performant way to handle theming in modern web apps. It allows easy toggling without reloading stylesheets.
**Implementation:**

- Define light and dark color variables in `src/renderer/src/assets/base.css`.
- Apply the theme by setting `document.documentElement.setAttribute('data-theme', 'dark')`.
- Use the `[data-theme="dark"]` selector to override CSS variables.

### 3. IPC Communication

**Decision:** Extend the preload script to expose `getTheme` and `setTheme` methods.
**Rationale:** The renderer process (Vue) cannot directly access the database. IPC is required for secure communication with the main process.
**Implementation:**

- Add `ipcMain.handle('get-theme')` and `ipcMain.handle('set-theme', (_, theme)` in `src/main/index.js` (or a dedicated service).
- Expose these methods via `contextBridge` in `src/preload/index.js`.

### 4. UI Integration

**Decision:** Add a theme toggle switch to the Settings page.
**Rationale:** Settings are the logical place for user preferences.
**Implementation:**

- Create a `ThemeToggle.vue` component using Element Plus `el-switch`.
- Integrate the component into the existing Settings view.
- Add button back into the existing Settings view.
- Load the theme on app startup and apply it immediately.

## Risks / Trade-offs

- **Risk:** Some third-party components (Element Plus) may not fully respect CSS variable overrides.
  - _Mitigation:_ Element Plus supports a dark mode class (`dark` class on `<body>`). We will add this class alongside the CSS variable approach.
- **Risk:** Database migration might fail on existing installations.
  - _Mitigation:_ The migration uses `CREATE TABLE IF NOT EXISTS`, which is safe to run multiple times.
- **Risk:** Flash of unstyled content (FOUC) on startup if theme is applied after Vue mounts.
  - _Mitigation:_ Apply the theme class in `src/renderer/src/main.js` before mounting the app, using data from the main process (synchronous or blocking call).
