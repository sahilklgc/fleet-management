# Architecture

## Strategic choice

The platform should begin as a modular monolith:

- one backend codebase
- one PostgreSQL database with PostGIS enabled
- one Redis instance for cache, queues, and ephemeral operational state
- one shared domain layer for contracts used by web and future mobile clients

This preserves delivery speed and reduces operational overhead while keeping module boundaries strong enough to split later if growth requires it.

## Repository layout

```text
apps/
  api/        NestJS API
  web/        Next.js application
packages/
  config/     Shared environment and config helpers
  domain-types/ Shared enums, contracts, and domain vocabulary
infra/
  docker-compose.yml
docs/
  architecture.md
  roadmap.md
```

## Backend module boundaries

The API should be organized around internal business modules rather than technical layers alone:

- Database and Prisma access
- Auth and sessions
- Users, roles, permissions
- Employees
- Vehicles
- Master stops
- Internal routes
- Daily assignments
- Stop execution and events
- Imports and exports
- Audit logs
- Notifications
- Geotab sync
- Geofence engine
- Deviation and idle monitoring

## Data model principles

### Keep client stops and internal routes separate

Master stops are imported operational reference data. Internal routes are your workforce planning model. A stop can move between routes over time without mutating the client record.

### Track events, not just current status

Stop completion, arrival, skip, issue reporting, reassignment, and overrides should all produce events. Current state can be derived or denormalized for fast reads, but the audit history must remain intact.

### Permissions should be additive and explicit

Roles are convenience bundles for UI and onboarding. Enforcement should still operate on permission keys so site-manager scope can evolve without role rewrites.

## Delivery principle

The first release is successful when the system handles the daily workflow reliably:

1. Import stops
2. Create and maintain routes
3. Assign worker and vehicle to a route for a date
4. Let the worker execute the stop list
5. Let the manager monitor progress and intervene safely

Everything after that should build on the same contracts and audit trail.

## Current implementation base

The repository now includes:

- npm workspaces for the monorepo
- Prisma schema for the first operational entities
- Nest auth structure for login and JWT validation
- permission decorators and guards
- audit decorator and interceptor plumbing
- starter endpoints for import preview, daily assignments, worker route flow, and manager dashboard
