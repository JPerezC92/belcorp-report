import pkg from './package.json' with {type: 'json'};
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readdir} from 'node:fs/promises';

export default /** @type import('electron-builder').Configuration */
({
  directories: {
    output: 'dist',
    buildResources: 'buildResources',
  },
  generateUpdatesFilesForAllChannels: true,
  linux: {
    target: ['deb'],
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    forceCodeSigning: false,
    signAndEditExecutable: false,
  },
  /**
   * It is recommended to avoid using non-standard characters such as spaces in artifact names,
   * as they can unpredictably change during deployment, making them impossible to locate and download for update.
   */
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  files: [
    'LICENSE*',
    pkg.main,
    '!node_modules/@app/**',
    ...await getListOfFilesFromEachWorkspace(),
  ],
});

/**
 * By default, electron-builder copies each package into the output compilation entirety,
 * including the source code, tests, configuration, assets, and any other files.
 *
 * So you may get compiled app structure like this:
 * ```
 * app/
 * ├── node_modules/
 * │   └── workspace-packages/
 * │       ├── package-a/
 * │       │   ├── src/            # Garbage. May be safely removed
 * │       │   ├── dist/
 * │       │   │   └── index.js    # Runtime code
 * │       │   ├── vite.config.js  # Garbage
 * │       │   ├── .env            # some sensitive config
 * │       │   └── package.json
 * │       ├── package-b/
 * │       ├── package-c/
 * │       └── package-d/
 * ├── packages/
 * │   └── entry-point.js
 * └── package.json
 * ```
 *
 * To prevent this, we read the “files”
 * property from each package's package.json
 * and add all files that do not match the patterns to the exclusion list.
 *
 * This way,
 * each package independently determines which files will be included in the final compilation and which will not.
 *
 * So if `package-a` in its `package.json` describes
 * ```json
 * {
 *   "name": "package-a",
 *   "files": [
 *     "dist/**\/"
 *   ]
 * }
 * ```
 *
 * Then in the compilation only those files and `package.json` will be included:
 * ```
 * app/
 * ├── node_modules/
 * │   └── workspace-packages/
 * │       ├── package-a/
 * │       │   ├── dist/
 * │       │   │   └── index.js    # Runtime code
 * │       │   └── package.json
 * │       ├── package-b/
 * │       ├── package-c/
 * │       └── package-d/
 * ├── packages/
 * │   └── entry-point.js
 * └── package.json
 * ```
 */
async function getListOfFilesFromEachWorkspace() {

  /**
   * @type {Map<string, string>}
   */
  const workspaces = await getWorkspaces();

  const allFilesToInclude = [];

  for (const [name, path] of workspaces) {
    const pkgPath = join(path, 'package.json');
    const {default: workspacePkg} = await import(pathToFileURL(pkgPath), {with: {type: 'json'}});

    let patterns = workspacePkg.files || ['dist/**', 'package.json'];

    patterns = patterns.map(p => join('node_modules', name, p));
    allFilesToInclude.push(...patterns);
  }

  return allFilesToInclude;
}

/**
 * Get workspaces from pnpm-workspace.yaml or fallback to packages/* pattern
 * @returns {Promise<Map<string, string>>}
 */
async function getWorkspaces() {
  const workspaces = new Map();

  try {
    // Read packages from packages/ directory
    const packagesDir = join(process.cwd(), 'packages');
    const packageDirs = await readdir(packagesDir, { withFileTypes: true });

    for (const dir of packageDirs) {
      if (dir.isDirectory()) {
        const packagePath = join(packagesDir, dir.name);
        const pkgJsonPath = join(packagePath, 'package.json');

        try {
          const {default: workspacePkg} = await import(pathToFileURL(pkgJsonPath), {with: {type: 'json'}});
          if (workspacePkg.name) {
            workspaces.set(workspacePkg.name, packagePath);
          }
        } catch (error) {
          // Skip directories without valid package.json
          console.warn(`Skipping ${dir.name}: no valid package.json found`);
        }
      }
    }
  } catch (error) {
    console.warn('Error reading workspaces:', error.message);
  }

  return workspaces;
}
