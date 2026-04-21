# LGC Fleet Management

Web-first, shared-backend fleet operations platform for route assignment, stop execution, reporting, auditability, and later telematics-driven tracking.

## Monorepo layout

- `apps/web`: Next.js web application for admins, managers, and workers
- `apps/api`: NestJS-style API service with modular domain boundaries
- `packages/domain-types`: Shared domain entities, enums, and contracts
- `packages/config`: Shared TypeScript/config helpers
- `infra`: Local Docker services and deployment scaffolding
- `docs`: Product, architecture, and delivery documentation

## Product direction

This repository is intentionally optimized for a modular monolith:

- one API backend
- one primary PostgreSQL database with PostGIS
- Redis for queues and cache
- APIs designed for web first and mobile later
- internal modules that can split into services only if scale actually demands it

## Initial build order

1. Foundation: auth, roles, permissions, audit logs, infrastructure
2. Core data: employees, vehicles, stops, routes, assignments
3. Operations: worker stop flow, manager dashboard, override controls
4. Administration: imports, exports, conflict review
5. Telematics: Geotab sync, vehicle status, geofence events
6. Intelligence: off-route detection, alerts, map, analytics

## Getting started

Install dependencies with `npm`. The repo uses standard npm workspaces, Docker for local infrastructure, and TypeScript across apps and shared packages.

```bash
npm install
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d postgres redis
npm run db:migrate
npm run db:generate
npm run db:seed
npm run dev
```

Seeded starter credentials after `npm run db:seed`:

- email: `admin@lgc.local`
- password: `ChangeMe123!`

Shared workspace packages compile to `dist/`, so the first `npm run dev` is expected to start their TypeScript watch tasks alongside the app processes through Turbo.

If you want to begin with architecture review instead of installation, start in [docs/architecture.md](/Users/sahil/Projects/LGC/fleet-management/docs/architecture.md), [docs/roadmap.md](/Users/sahil/Projects/LGC/fleet-management/docs/roadmap.md), [docs/permission-matrix.md](/Users/sahil/Projects/LGC/fleet-management/docs/permission-matrix.md), and [docs/data-model.md](/Users/sahil/Projects/LGC/fleet-management/docs/data-model.md).
