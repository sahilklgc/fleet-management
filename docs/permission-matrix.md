# Permission Matrix

This is the initial operating model. It should remain permission-driven even if the UI presents role bundles.

## Roles

- `super_admin`: full system control
- `admin`: organization-level administration
- `manager`: route, worker, vehicle, and reporting control
- `on_site_manager`: local route execution and employee support
- `worker`: assigned route execution only

## Initial permission keys

- `users.manage`
- `employees.manage`
- `vehicles.manage`
- `stops.manage`
- `routes.manage`
- `assignments.manage`
- `stop-events.write`
- `reports.export`
- `audit.read`

## Starter matrix

| Permission | Super Admin | Admin | Manager | On-Site Manager | Worker |
| --- | --- | --- | --- | --- | --- |
| `users.manage` | yes | yes | no | no | no |
| `employees.manage` | yes | yes | yes | yes | no |
| `vehicles.manage` | yes | yes | yes | limited | no |
| `stops.manage` | yes | yes | yes | limited | no |
| `routes.manage` | yes | yes | yes | limited | no |
| `assignments.manage` | yes | yes | yes | yes | no |
| `stop-events.write` | yes | yes | yes | yes | yes |
| `reports.export` | yes | yes | yes | limited | no |
| `audit.read` | yes | yes | yes | limited | no |

## Scope notes

- `limited` means branch/site-scoped access only.
- worker actions should be restricted to their current assignments, never broad write access.
- manager and site-manager override actions should require a reason and create an audit event.
- route reassignment, password reset, import apply, and manual completion should all be privileged actions.
