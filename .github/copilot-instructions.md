# Belcorp Report - AI Coding Instructions

## Project Architecture

This is a **monorepo Electron application** built with Vite, React, TanStack Router, and TypeScript. The architecture follows Electron security best practices with clear separation between main process, preload scripts, and renderer process.

### Core Package Structure
- **`packages/main/`** - Electron main process (Node.js environment)
- **`packages/preload/`** - Secure bridge between main and renderer 
- **`packages/renderer/`** - React UI (browser environment) with TanStack Router
- **`packages/integrate-renderer/`** - Build tool for creating new renderer packages
- **`packages/electron-versions/`** - Helper utilities for Electron version management

### Module System Architecture

The main process uses a **modular architecture** via `ModuleRunner` (`packages/main/src/ModuleRunner.ts`):

```typescript
const moduleRunner = createModuleRunner()
  .init(createWindowManagerModule({initConfig, openDevTools: true}))
  .init(disallowMultipleAppInstance())
  .init(terminateAppOnLastWindowClose())
  .init(hardwareAccelerationMode({enable: false}))
  .init(autoUpdater())
  .init(allowInternalOrigins(new Set([...])))
  .init(allowExternalUrls(new Set([...])))
```

Each module in `packages/main/src/modules/` implements the `AppModule` interface and handles specific functionality (security, window management, auto-updates, etc.).

## Critical Routing Configuration

**TanStack Router uses hash history for Electron compatibility** (required for `file://` protocol):

```typescript
// packages/renderer/src/main.tsx
import { createHashHistory } from '@tanstack/react-router'
const hashHistory = createHashHistory() // Critical for Electron apps

const router = createRouter({
  routeTree,
  history: hashHistory, // NOT browser history
  context: {},
  defaultPreload: false,
  defaultPreloadStaleTime: 0,
})
```

Routes are file-based in `packages/renderer/src/routes/` with auto-generation via `@tanstack/router-plugin/vite`.

## Development Workflow

### Essential Commands
- **`pnpm start`** - Start development with hot reload (launches dev-mode.js)
- **`pnpm run build`** - Build all packages for production
- **`pnpm run compile`** - Create distributable Electron app
- **`pnpm test`** - Run Playwright e2e tests
- **`pnpm run init`** - Interactive setup for new renderer packages

### Development Server Architecture
The `packages/dev-mode.js` orchestrates development:
1. Starts Vite dev server for renderer (port 3000)
2. Builds and watches main/preload packages
3. Enables hot reload for main process via `handleHotReload()` plugin
4. Provides renderer dev server to other packages via plugin API

### Hot Reload Mechanism
- **Renderer**: Standard Vite HMR
- **Main Process**: Custom plugin in `packages/main/vite.config.js` restarts Electron on file changes
- **Preload**: Rebuilds automatically, requires renderer refresh

## Security Model

### Context Isolation & Preload
The preload script (`packages/preload/src/exposed.ts`) safely exposes functions via `contextBridge`:

```typescript
// Exposes functions with base64-encoded names for security
for (const exportsKey in exports) {
  if (isExport(exportsKey)) {
    contextBridge.exposeInMainWorld(btoa(exportsKey), exports[exportsKey]);
  }
}
```

### Origin Restrictions
Security modules in main process control allowed origins:
- `allowInternalOrigins()` - Whitelists dev server and app origins
- `allowExternalUrls()` - Controls external link access
- `BlockNotAllowdOrigins` module handles enforcement

## Build System Specifics

### Package Dependencies
Uses **workspace references** (`@app/*`) for internal packages:
```json
// Root package.json
"dependencies": {
  "@app/main": "*",
  "@app/preload": "*", 
  "@app/renderer": "*"
}
```

### Vite Configuration Patterns
- **Main**: SSR build targeting Node.js with custom hot reload plugin
- **Renderer**: Standard React build with base path `./` for Electron
- **Preload**: Similar to main but without hot reload

### Electron Builder
Configuration in `electron-builder.mjs` includes:
- Workspace file filtering to include only dist folders
- Disabled code signing for development (`forceCodeSigning: false`)
- Auto-updater support with artifact naming conventions

## Testing Architecture

### E2E Tests (`tests/e2e.spec.ts`)
- Uses **Playwright with Electron** integration
- Launches compiled app from `dist/` directory
- Tests real Electron behavior, not just web components
- Fixture pattern for ElectronApplication lifecycle

## Key Conventions

### File Naming
- TypeScript files use `.ts`/`.tsx` extensions
- Module files use `.js` extension (ESM format)
- Route files follow TanStack Router conventions (`__root.tsx`, `index.tsx`)

### Import Patterns
- Use relative imports within packages
- Use workspace imports (`@app/*`) between packages
- ESM-only (no CommonJS)

### Error Handling
Renderer includes comprehensive fallback rendering when router fails:
```typescript
try {
  root.render(<RouterProvider router={router} />)
} catch (error) {
  // Fallback to static HTML
  rootElement.innerHTML = `<!-- Fallback content -->`
}
```

## When Adding Features

### New Electron Modules
Create in `packages/main/src/modules/` implementing `AppModule` interface, then register in `packages/main/src/index.ts`.

### New Routes
Add files to `packages/renderer/src/routes/` - auto-generated route tree handles registration.

### Security Changes
Update origin allowlists in `packages/main/src/index.ts` when adding external dependencies or dev servers.

### Build Process Changes
Modify `packages/dev-mode.js` for development workflow changes or package build order.
