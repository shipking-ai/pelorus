# Pelorus

A privacy-first, workspace-centric desktop browser built on Chromium (via Electron). Open source, **GPL-3.0-or-later**.

> **Status: 0.3.0 pre-release, a working foundation — not a Chrome replacement.** It browses, isolates workspaces, blocks trackers, restores sessions and has a command palette. It has **no extension support, no sync, no password manager, no AI features yet**, and has **not been security-audited or packaged/signed**. [FEATURE-MATRIX](docs/FEATURE-MATRIX.md) says exactly what is built and tested.

![Pelorus](docs/screenshots/window-dark.png)

## What makes it different (what exists today)

- **Workspaces are real isolation.** Each workspace has its own cookies, cache, storage, history and permissions. Delete a workspace and its data goes with it. Private tabs use a memory-only partition.
- **Command palette (Ctrl+K)** over tabs, history, bookmarks, workspaces and commands. Address-bar suggestions are computed **locally**; keystrokes are never sent to a search provider.
- **Privacy defaults that are visible:** Ghostery filter engine (network + cosmetic), HTTPS-first with an explicit, no-bypass failure page, tracking-parameter stripping, Global Privacy Control, deny-by-default site permissions, a dashboard showing what was blocked and what the limits are.
- **Sleeping tabs and lazy restore:** inactive tabs unload; restarts load only the active tab per workspace.
- **Safe downloads:** sanitised file names, risk flags (including disguised `.pdf.exe`), executables are never launched by the browser.
- **Hardened architecture:** tab renderers have no IPC at all; the main process re-validates every sender; internal pages are CSP-locked ([SECURITY](docs/SECURITY.md)).

## Download

Pre-release builds for **Windows x64** are on the [Releases page](https://github.com/shipking-ai/pelorus/releases): a per-user installer (`Pelorus-Setup-<version>.exe`, no administrator rights) and a zip you can unpack anywhere. Pelorus is a web browser: it opens websites in tabs and workspaces, blocks ads and trackers, and keeps its data on your computer. Builds are **not code-signed yet**, so Windows SmartScreen will warn about an unknown publisher; verify a download with its `SHA256SUMS.txt` or `gh attestation verify <file> --repo shipking-ai/pelorus`. What the program sends over the network is described in the [privacy policy](docs/PRIVACY.md).

## Code signing policy

Releases are currently **unsigned**. The full policy (what would be signed, from where, who approves) is in [docs/CODE-SIGNING-POLICY.md](docs/CODE-SIGNING-POLICY.md). Free code signing from SignPath.io with a certificate from SignPath Foundation has been **applied for / is planned** (only after approval will this page say "Free code signing provided by SignPath.io, certificate by SignPath Foundation").

- **Authors, reviewers and approvers:** currently one maintainer, [shipking-ai](https://github.com/shipking-ai) (a weakness, stated openly; roles are listed in the policy).
- **Privacy policy:** [docs/PRIVACY.md](docs/PRIVACY.md). Short form: this program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it; the only things it does on its own are downloading ad-blocker filter lists, and, only if you turn it on, secure-DNS lookups, plus an update check that runs only when you press the button.

## Website and Toolbox

The project site lives in [`site/`](site) (plain HTML/CSS/JS, no third-party requests) and includes **the Pelorus Toolbox**: a searchable, verified directory of open-source tools for building beautiful websites and landing pages ([how it is built and its limits](docs/WEBSITE.md)). It is published to GitHub Pages by `.github/workflows/pages.yml`; `npm run site:test` checks accessibility, layout and the filters in real Chrome.

## Requirements

Windows 10/11 (tested on Windows 11). Node.js ≥ 22.12 (developed with 26) and npm. Linux and macOS pass the automated tests in CI but nobody has used them by hand yet.

## Run

```bash
npm ci
npm start
```

Your data lives in Electron's user-data folder (shown in **Settings → About**). To use a throwaway profile: `PELORUS_USER_DATA=/tmp/pelorus-test npm start`.

## Test

```bash
npm test            # 73 unit tests incl. seeded fuzzing (plain Node, about 10 s)
npm run test:e2e    # 55 end-to-end tests: real app against a local server; only tls.test.js (5 tests) uses the internet (badssl.com) and skips when offline
npm run audit       # npm audit for production dependencies
node scripts/bench.js   # reproducible performance baseline vs. installed Chrome (see docs/PERFORMANCE.md)
```

The e2e suite drives the real application with `playwright-core`, injects keyboard input with `webContents.sendInputEvent` (never OS-level input) and writes only to temporary profiles.

## Package

```bash
npm run package     # unsigned folder build in out/ (see docs/ARCHITECTURE.md §7 for signing/updates)
node scripts/verify-package.js   # launches the packaged exe and checks it browses
```

## Repository layout

```
src/main      main process (controller, tabs, store, blocker, permissions, downloads, IPC)
src/shared    pure logic shared by everything (URLs, shortcuts, fuzzy match, filenames)
src/ui        pelorus:// pages and the design system (tokens.css)
test/unit     test/e2e
scripts       benchmark, capture and inventory tools
docs          research ledger, ADR, architecture, security, design, roadmap, benchmarks
```

## Documentation

| | |
|---|---|
| [Research ledger](docs/research/LEDGER.md) | 40+ projects checked against primary sources on 2026-10-11, with confidence levels and scores |
| [**What only you can do**](docs/OWNER-STEPS.md) | exact ordered steps for the things that need a person: signing certificate, trademark opinion, screen-reader and real-machine tests, security review |
| [**HANDOFF**](HANDOFF.md) | start here if you are picking the project up: status, how to run and verify, traps, and the full to-do list |
| [Releases](https://github.com/shipking-ai/pelorus/releases) | pre-release builds (unsigned), with SHA-256 sums, an SBOM and a build-provenance attestation you can verify with `gh attestation verify` |
| [Trademark checks](docs/TRADEMARK.md) | why the project was renamed from Nadir to Pelorus, and the US register search for the new name (not legal advice) |
| [Accessibility](docs/ACCESSIBILITY.md) | what is scanned automatically, what is not (no screen reader run), and a manual test plan |
| [Code signing policy](docs/CODE-SIGNING-POLICY.md) | what will be signed and how to verify a build today (builds are currently unsigned; check the build-provenance attestation) |
| [Release notes and signing](docs/RELEASE.md) | what is tested for packaging and signing, and what still needs a certificate, a public repository and an installer |
| [Project catalog](docs/research/CATALOG.md) | 772 open-source browser-related projects verified against the GitHub API and classified (Core / High-value / Optional / Experimental / Reference / Rejected / Out-of-scope) |
| [Discovery sweep](docs/research/SWEEP.md) | how the catalog was built, and an explicit list of what it does **not** cover — "every possible project" is not achievable |
| [ADR-0001](docs/adr/0001-architecture.md) | why Electron/Chromium, what was rejected, revisit triggers |
| [Architecture](docs/ARCHITECTURE.md) | diagrams, process model, data flows, interface contracts, build/update plan |
| [Security & privacy](docs/SECURITY.md) | threat model, tests per threat, **known gaps** |
| [Design system](docs/DESIGN.md) | name, mark, tokens, interaction principles, accessibility status |
| [Signature features](docs/SIGNATURE-FEATURES.md) | what is built vs. planned, with costs and risks |
| [Feature matrix](docs/FEATURE-MATRIX.md) | built / tested / partial / planned / blocked |
| [Performance](docs/PERFORMANCE.md) | targets (proposed), method, **measured** results, caveats |
| [Licenses](docs/LICENSES.md) | dependency licence inventory and distribution notes |
| [Decision log](docs/DECISIONS.md) · [Roadmap](docs/ROADMAP.md) | |

## Known limitations (short list)

Electron's Chromium trails upstream by a few majors (keep Pelorus updated) · no Chrome-extension support · no sync/passwords/AI yet · unsigned, no auto-update · single window · Windows only verified · accessibility not audited · "Nadir" is not trademark-cleared.

## License

GPL-3.0-or-later. Bundled third-party components keep their own licences; see [docs/LICENSES.md](docs/LICENSES.md).
