## 1. Database & Main Process

- [x] 1.1 Add migration for `settings` table in `src/main/database/index.js`
- [x] 1.2 Implement `getTheme` and `setTheme` IPC handlers in `src/main/index.js`
- [x] 1.3 Add database service method for reading/writing settings

## 2. Preload & IPC Bridge

- [x] 2.1 Expose `getTheme` and `setTheme` methods in `src/preload/database.js`
- [x] 2.2 Verify IPC communication works between main and renderer

## 3. Renderer Styles

- [x] 3.1 Define dark mode CSS variables in `src/renderer/src/assets/base.css`
- [x] 3.2 Add `[data-theme="dark"]` selector overrides
- [x] 3.3 Add Element Plus dark mode class support

## 4. UI Components

- [x] 4.1 Create `ThemeToggle.vue` component in `src/renderer/src/components/`
- [x] 4.2 Add theme toggle switch to Settings page
- [x] 4.3 Implement theme change handler in Vue component
- [x] 4.4 Add button back into Settings page

## 5. Integration & Startup

- [x] 5.1 Load theme on application startup in `src/renderer/src/main.js`
- [x] 5.2 Apply theme class to document element immediately
- [x] 5.3 Test theme persistence across app restarts
