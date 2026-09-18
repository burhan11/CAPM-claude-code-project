# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A SAP Cloud Application Programming Model (CAP) project for Node.js, created from the `cds init` scaffold and converted to TypeScript via `cds add typescript`. The `package.json` name is `burhan-claude`; the working directory is `burhan-claude`. As of this writing `app/` and `srv/` are still mostly unauthored — the domain model in `db/` exists but the service layer still needs to be built.

## Language — TypeScript

Service handlers and custom logic are written in TypeScript (`.ts`), not JavaScript. `cds-serve`/`cds watch` transpile `.ts` on the fly via `tsx` (no separate build step needed for local dev). Key pieces added by `cds add typescript`:

- `tsconfig.json` — `NodeNext` module resolution, `strict: true`, path aliases for `@sap/cds` types (`@cap-js/cds-types`) and `#cds-models/*` (generated typed entity models).
- `@cap-js/cds-typer` (devDependency) — generates typed model classes into `@cds-models/` (gitignored, regenerated automatically) from `.cds` files; import them via the `#cds-models/<service-or-schema-name>` subpath.
- Do not add `.js` files under `srv/` — write `.ts` and let the CAP runtime handle transpilation.

## Commands

- `npm start` — runs `cds-serve` (production-style serve).
- `npx cds watch` — primary dev loop: serves the app, recompiles and restarts on `.cds`/`.ts` changes, serves an in-memory SQLite DB with mock auth. Use this while developing.
- `npx cds serve --with-mocks --in-memory?` — one-off serve with mocked required services and a throwaway in-memory DB (same as the VS Code "cds serve" task/launch config).
- `npx cds compile srv/ --to sql` (or `--to edmx`, `--to json`) — inspect the compiled model without running the server.
- `npx cds deploy --to sqlite` — materialize a persistent `.sqlite` file from the model + `db/data/` CSVs.
- `npx eslint .` — lint. Config is `eslint.config.mjs`, which just re-exports `@sap/cds/eslint.config.mjs` recommended rules.
- `npx cds repl` — interactive REPL against the loaded model.

There is no test setup in this project yet. If adding tests, the CAP convention is `@cap-js/cds-test` (or `cds.test`) with Jest/Mocha; run a single test with the runner's usual filter (e.g. `npx jest -t "<name>"`).

## Architecture / conventions

CAP is convention-driven. The three top-level folders have fixed roles and are auto-discovered by `cds`:

- `db/` — domain model. `db/schema.cds` defines entities/types in CDL; namespaced (e.g. `namespace my.app;`). Seed data goes in `db/data/<namespace>-<Entity>.csv`.
- `srv/` — service layer. `srv/*.cds` files declare services that project onto db entities (`service CatalogService { entity Books as projection on my.app.Books; }`). Custom logic goes in a sibling `srv/<service-name>.ts` exporting `export default (srv: cds.ApplicationService) => { srv.on('READ', ...); srv.before(...); srv.after(...) }` — filename must match the `.cds` service file for auto-wiring.
- `app/` — UI content (Fiori elements annotations, HTML). CAP serves an index and OData v4 endpoints at `/<service-path>` automatically.

Key points for being productive:

- OData/REST endpoints, CRUD handlers, `$expand`, filtering, pagination are generated from the model. Only write handlers in `srv/*.ts` for custom behavior — don't reimplement CRUD.
- Persistence: `@cap-js/sqlite` (devDependency) backs local dev. No DB config in `package.json` means `cds watch` defaults to in-memory SQLite; add a `cds.requires.db` block when you need persistence or another database.
- Generated artifacts (`gen/`, `@cds-models/` from cds-typer, `*.db`/`*.sqlite`) are gitignored — never edit them by hand.
- This directory is not a git repository.

## Related tooling

A Codex config exists at `~/.codex/config.toml`. To import compatible items (MCP servers, slash commands, subagents, skills, instructions) into Claude Code, reply `/import` to scan and list what's importable, then `/import --yes=<digest>` to apply. If `/import` isn't available here, run `claude import` from a terminal.
