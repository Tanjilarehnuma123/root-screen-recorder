# Repository Guidelines

## Project Structure & Module Organization

Root is a local Windows 11 screen recorder using Node.js and Edge or Chrome, with no npm dependencies.

- `server.mjs` serves the interface and recording, import, caption, and export APIs.
- Root-level modules such as `storage.mjs`, `library.mjs`, and `blur-filters.mjs` implement backend behavior.
- `public/` contains browser ES modules, CSS, icons, and Inter. `app.js` coordinates capture; `workspace.js` and `details.js` organize the library and editor. Styles load in order; `dark.css` and `dropdowns.css` provide final overrides.
- Root-level `*.test.mjs` files contain unit tests; `*-test.mjs` scripts exercise API and media workflows.
- `desktop/` contains the C# launcher and PowerShell packaging helpers. `runtime/` and `tools/` hold bundled dependencies; `recordings/` and `.thumbnails/` contain generated data.

## Build, Test, and Development Commands

Run commands from the repository root in PowerShell:

- `npm start` or `.\runtime\node.exe server.mjs`: start the local service at `http://localhost:4783`.
- `node --check public/app.js`: validate JavaScript syntax without executing it.
- `node --test blur.test.mjs keyframes.test.mjs`: run focused unit tests; substitute tests relevant to the change.
- `npm test`: invoke Node's test discovery; integration scripts may require the running server, media tools, and fixtures.
- `powershell -File desktop/Build.ps1`: rebuild the Windows launcher. Frontend changes require no compilation.

## Coding Style & Naming Conventions

Use ES modules, explicit imports, semicolons, camelCase identifiers, and kebab-case filenames. Match surrounding compact formatting; use one-space indentation in existing JavaScript blocks. No formatter or linter is configured. Keep geometry, keyboard policies, and other reusable logic in small modules. Preserve Inter, the near-black theme, mint accents, and consistent green actions.

## Testing Guidelines

Use `node:test` with `node:assert/strict`. There is no enforced coverage percentage. Test changed behavior, cancellation, invalid inputs, and regressions. Run media/API scripts against disposable recordings. For UI changes, check keyboard operation, full control hit areas, and library/editor synchronization; report when visual verification is unavailable.

## Commit & Pull Request Guidelines

The repository has no commits yet, so no historical convention exists. Use concise imperative subjects, such as `Fix blur selection deletion`. PRs should explain the problem, resulting behavior, checks performed, and relevant issue links. Include screenshots for visual changes.

## Local Data & Security

Preserve loopback-only serving and origin validation. Never commit recordings, local storage paths, downloaded tools, or runtime binaries. Respect `.gitignore`; use temporary fixtures and avoid modifying user recordings during tests.
