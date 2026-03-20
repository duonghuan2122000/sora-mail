# Agent Guidelines for sora-mail

This document provides guidelines for AI agents working on the sora-mail project, an Electron application built with Vue.js.

## Build, Lint, and Test Commands

### Development

- `npm run dev` – Start development server with hot reload
- `npm start` – Preview built application (`electron-vite preview`)

### Building

- `npm run build` – Build for production (outputs to `out/` directory)
- `npm run build:unpack` – Build and create unpacked directory
- `npm run build:win` – Build Windows installer
- `npm run build:mac` – Build macOS application
- `npm run build:linux` – Build Linux application

### Code Quality

- `npm run lint` – Run ESLint on all files (`.js`, `.vue`)
- `npm run format` – Format code with Prettier

### Testing

**No test framework is currently configured.** The project does not have any test dependencies or scripts. If you need to add tests, consider using Vitest (already integrated with Vite) or Jest.

## Project Structure

```
src/
├── main/           # Main process code (Node.js/Electron)
│   └── index.js
├── preload/        # Preload scripts (bridge between main and renderer)
│   └── index.js
└── renderer/       # Renderer process (Vue.js frontend)
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── App.vue
    │   └── main.js
    └── index.html
```

- **Main process**: Runs in Node.js, manages windows, system integration, and IPC.
- **Preload scripts**: Run in isolated context, expose safe APIs to renderer.
- **Renderer process**: Vue.js frontend running in Chromium.

## Code Style Guidelines

### General Formatting

- **Indentation**: 2 spaces (no tabs)
- **Line endings**: LF (`\n`)
- **Charset**: UTF‑8
- **Trailing whitespace**: Trimmed
- **Final newline**: Yes
- **Maximum line width**: 100 characters (Prettier `printWidth`)
- **CSS/SCSS**: Use SCSS with BEM methodology and 'sora-' prefix for class names

### JavaScript

- **Quotes**: Single quotes (`'`) (Prettier `singleQuote: true`)
- **Semicolons**: Omitted (Prettier `semi: false`)
- **Trailing commas**: None (Prettier `trailingComma: none`)
- **Arrow‑function parentheses**: Avoid when possible (`(x) => x + 1` → `x => x + 1`)

### Imports

- Place imports at the top of the file.
- Group imports in this order:
  1. Node/Electron built‑ins (`import { app, BrowserWindow } from 'electron'`)
  2. External dependencies (`import { electronAPI } from '@electron-toolkit/preload'`)
  3. Internal modules (`import icon from '../../resources/icon.png?asset'`)
- Use named imports for specific exports; default imports for Vue components.

### Vue Components

- Use `<script setup>` syntax (Composition API).
- Component names are multi‑word (except root `App`). The ESLint rule `vue/multi‑word‑component‑names` is turned off, but follow the convention where possible.
- Props: Default props are optional (`vue/require-default-prop: off`).
- Template: Use kebab‑case for custom elements (`<my-component />`).

### Naming Conventions

- **Variables & functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE` for true constants, `camelCase` for `const` variables that are reassignable.
- **Component files**: `PascalCase.vue` (e.g., `Versions.vue`)
- **Component references**: `PascalCase` in templates, `camelCase` in `<script setup>` imports.

### Error Handling

- Use `try`/`catch` for synchronous operations that may throw.
- Log errors with `console.error` (main/renderer) or `log.error` (if a logger is added).
- In preload scripts, wrap `contextBridge.exposeInMainWorld` in a try‑catch to avoid isolation errors.

### Type Safety

- The project is currently plain JavaScript; no TypeScript is configured.
- JSDoc comments are encouraged for public APIs and complex functions.

### CSS/SCSS Guidelines

- **Preprocessor**: Use SCSS (Sass) for all styles
- **File naming**: Component styles should be scoped with `<style lang="scss" scoped>`
- **BEM methodology**: Follow Block-Element-Modifier naming convention
- **Prefix**: Use `sora-` prefix for all CSS class names
- **Nesting**: Use SCSS nesting for better readability (max 3 levels deep)
- **Variables**: Define colors, spacing, breakpoints in SCSS variables (when centralized)
- **Example structure**:

  ```scss
  .sora-block {
    // Block styles

    &__element {
      // Element styles

      &--modifier {
        // Modifier styles
      }
    }
  }
  ```

- **Responsive design**: Use mobile-first approach with SCSS mixins/media queries
- **Current example**: See `src/renderer/src/App.vue` for reference implementation

## ESLint Configuration

The ESLint config extends:

- `@electron-toolkit/eslint-config`
- `eslint-plugin-vue` (flat/recommended)
- Prettier compatibility (`@electron-toolkit/eslint-config-prettier`)

Key custom rules:

- `vue/require-default-prop: off`
- `vue/multi-word-component-names: off`

Run `npm run lint` to check for issues; fix automatically with `npm run format` (Prettier) and manual adjustments.

## Electron‑Vite Build System

- Configuration: `electron.vite.config.mjs`
- Aliases: `@renderer` → `src/renderer/src`
- Vue plugin is enabled for the renderer.

**Important**: The main and preload processes are built separately and can use Node.js APIs. The renderer process is a standard Vue SPA bundled by Vite.

## Git & Version Control

- Ignored files: See `.gitignore` (typical Node/Electron patterns).
- Commit messages: Use conventional commits (feat, fix, chore, docs, style, refactor, test).
- Branches: Create feature branches for new work.

## Adding New Features

### Main Process

- Add new IPC handlers in `src/main/index.js` (or split into separate modules).
- Expose new APIs via the preload script.

### Preload Script

- Extend the `api` object in `src/preload/index.js` with functions that call `ipcRenderer.invoke`/`send`.

### Renderer (Vue)

- Create Vue components in `src/renderer/src/components/`.
- Use the exposed `window.electron` or `window.api` to communicate with the main process.

## Known Issues & Workarounds

- **Context isolation**: The preload script checks `process.contextIsolated` and exposes APIs accordingly.
- **Sandbox**: Disabled (`sandbox: false`) in main window webPreferences.
- **Asset imports**: Use the `?asset` suffix for static resources (e.g., `import icon from '../../resources/icon.png?asset'`).

## Environment Variables Configuration

The project uses `dotenv` to manage environment variables in the main process.

### Environment Files

- `.env.sample` – Template with example variables (committed)
- `.env.dev` – Development environment (git‑ignored)
- `.env.production` – Production environment (git‑ignored)
- `.env.local` – Local overrides (git‑ignored, optional)

### Loading Logic (in `src/main/index.js`)

1. Detects `NODE_ENV` (default: `'development'`)
2. Loads `.env.production` if `NODE_ENV === 'production'`, otherwise `.env.dev`
3. Optionally loads `.env.local` for personal overrides (with `override: true`)

### Accessing Variables

- Use `process.env.VARIABLE_NAME` in the main process
- Variables are parsed as strings; convert numbers with `parseInt()`
- Example: `const width = parseInt(process.env.WINDOW_WIDTH) || 900`

### Adding New Variables

1. Add to `.env.sample` with documentation
2. Update `.env.dev` and `.env.production` with appropriate values
3. Access via `process.env` in the main process

## Recommended Development Workflow

1. Run `npm run dev` to start the development server.
2. Make changes to main, preload, or renderer code – Vite will hot‑reload the renderer; the main process requires a restart.
3. Lint and format before committing: `npm run lint && npm run format`.
4. Build and test the packaged application with `npm run build:unpack`.

## For AI Agents

- **Always run lint and format** after making changes.
- **Follow existing patterns** – look at similar files to understand the project’s conventions.
- **Ask for clarification** if the required change conflicts with the guidelines above.
- **Do not introduce new dependencies** without discussing the need.
- **Keep changes minimal and focused** on the requested task.

## Missing Pieces (Potential Improvements)

- No unit/integration tests – consider adding Vitest.
- No TypeScript – could be migrated incrementally.
- No end‑to‑end testing – Cypress or Playwright could be added.
- No logging library – currently uses `console.log`/`error`.

---

_Last updated: 2026‑03‑20_
