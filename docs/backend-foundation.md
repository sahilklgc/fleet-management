# Backend Foundation

This is the order the backend should mature from here.

## 1. Database first

The initial Prisma schema models:

- identity and access: `users`, `roles`, `permissions`, `sessions`
- workforce and assets: `employees`, `vehicles`, `branches`
- client data: `master_stops`, `imports`, `import_rows`
- internal planning: `routes`, `route_stops`, `route_assignments`
- execution history: `stop_events`, `audit_logs`

That gives us enough structure to implement the first real operating loop without waiting on telematics.

## 2. Security before workflow

Auth, RBAC, and audit logging are not add-ons.

- Auth proves who is acting.
- RBAC proves whether they are allowed to act.
- Audit logging proves what happened afterward.

This is why every privileged route should carry both permission metadata and audit metadata.

## 3. First operational loop

The first usable workflow is:

1. Preview and import master stops.
2. Assign a worker and vehicle to a route.
3. Let the worker execute stops.
4. Let the manager monitor the day.

The current API scaffold includes starter endpoints for that sequence so the next pass can replace placeholder responses with Prisma-backed reads and writes.
