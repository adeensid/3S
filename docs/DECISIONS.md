# Architecture and product decisions

## Phase 1 — Scaffold

### Monorepo with npm workspaces

We use npm workspaces (`client`, `server`) rather than pnpm or Turborepo for Phase 1 to keep tooling familiar and CI simple. Root scripts fan out to workspaces with `npm run <script> --workspaces`.

### TypeScript project references omitted initially

Each package has its own `tsconfig.json` with strict mode. Cross-package imports are not needed yet; we avoid TS project references until shared types exist (likely a small `packages/shared` later if duplication grows).

### Server entry and graceful shutdown

Express listens only after MongoDB connects. `SIGTERM`/`SIGINT` close the HTTP server and Mongoose connection so containers shut down cleanly under orchestrators.

### Environment validation at startup

All server configuration is parsed with Zod in `server/src/config/env.ts`. The process exits with a clear log message if validation fails, so misconfiguration never reaches request handling.

### Docker multi-stage and non-root user

Both images use multi-stage builds: build stage as root, runtime as `node` (UID 1001). Client is served with nginx on port 80; server runs Node on 4000. Healthchecks hit `/api/health` and nginx `/`.

### CI skeleton before full test matrix

Phase 1 CI runs install, lint, type-check, and unit tests where present. Playwright and coverage gates expand in Phase 8.

### JWT secrets length

Zod requires access and refresh secrets to be at least 32 characters to discourage weak production secrets.

## Phase 2 — Auth

### Refresh tokens stored as hashes

Raw refresh tokens live only in httpOnly cookies. MongoDB stores SHA-256 hashes so a database leak cannot mint sessions.

### Token version on password change

`tokenVersion` on the user document invalidates outstanding access JWTs and pairs with deleting all refresh sessions when the password changes.

### Registration role assignment

Public registration always creates `developer` accounts. Elevated roles are assigned through seed data or future admin tooling, not self-service signup.

### Account lockout counters

Failed logins increment a counter on the user document. Crossing the configured threshold sets `lockUntil` rather than using a separate collection, keeping reads on the login path minimal.

## Phase 3 — Domain API

### Per-project ticket counters

`Project.ticketCounter` increments atomically with `findOneAndUpdate` so display keys stay unique under concurrent creates without a separate counter collection.

### Markdown stored sanitized

Descriptions and comments are sanitized at write time with `sanitize-html`. The API never stores raw HTML from clients.

### Tester updates without blanket edit permission

Patch handlers defer to service logic: testers may reopen closed tickets (`ticket:reopen`) but cannot change other fields unless they hold `ticket:edit`.

## Phase 4–6 — Client

### Access token in localStorage

Refresh tokens remain httpOnly cookies; access tokens live in `localStorage` for simple Bearer headers. Short TTL limits exposure.

### Optimistic Kanban status changes

Status updates patch TanStack Query cache before the network settles and roll back with a toast on failure.

### @fontsource for IBM Plex

Fonts ship from npm packages (bundled woff), not a CDN, matching self-hosting requirements.

## Phase 7 — Dashboard

Aggregations run in MongoDB on the server; the client only renders Recharts series from the API response.

## Phase 8 — Quality gates

CI runs unit tests, builds both apps, then executes Playwright against local dev servers with axe on the login screen.

## Native bcrypt on Windows CI agents

`bcryptjs` provides the same hash/compare API without native bindings. This avoids node-gyp and TLS failures on some Windows developer machines while keeping bcrypt-compatible hashes in MongoDB.

## Phase 1 extension — Work item model

### Ticket collection retained

New Jira-style fields extend the existing `Ticket` Mongoose model and `/tickets` REST routes so current clients keep working. `issueType`, `priority`, `rank`, and `revision` are first-class fields.

### LexoRank strings in MongoDB

Backlog ordering uses deterministic LexoRank-style strings (`0|body:`) sorted lexicographically. Rebalance is deferred; `rankBetween` extends strings when space runs out.

### Hierarchy validation in services

Parent, epic link, and sub-task rules run in `hierarchyService` during create and update, not in the UI. Invalid trees return `400` with explicit codes.

### Field history separate from activity log

`FieldHistory` stores one document per changed field for issue detail history tabs. `ActivityLog` remains for high-level audit events and notifications.

### Custom field definitions per project

Definitions live in `CustomFieldDefinition`; values are embedded on issues as `customFieldValues` after schema validation. Required fields are enforced only when values are submitted (create may omit until the issue form supplies them).

### Jest MongoDB databases per worker

Integration tests use `sid-jest-w{JEST_WORKER_ID}` on local Mongo so parallel route suites do not clear each other’s data. `MONGOMS_DISABLED=1` in CI still uses the host `mongo:7` service with the same naming scheme.

### Attachment registration without binary upload in phase 1

Phase 1 stores attachment metadata (name, MIME, size, storage key) after validation. Binary storage and download endpoints land with releases/import in a later phase.

## Phase 9 — Seed

`npm run seed` rebuilds demo users, two projects, and 80 tickets with realistic titles so docker-compose demos look lived-in.
