# Initial Data Model

The first release should model only what we need for secure daily operations, while keeping room for telematics and geospatial expansion.

## Core entities

### Identity and access

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `sessions`

### Workforce and assets

- `employees`
- `vehicles`
- `branches`

### Client reference data

- `master_stops`
- `imports`
- `import_rows`

### Internal planning

- `routes`
- `route_stops`
- `route_assignments`

### Execution and history

- `stop_events`
- `stop_completions`
- `audit_logs`

## Design rules

### `master_stops`

This is the imported source-of-truth dataset from Houston Metro or another client feed.

Suggested columns:

- `id`
- `client_stop_id`
- `name`
- `latitude`
- `longitude`
- `category`
- `service_frequency`
- `is_active`
- `manual_override`
- `imported_at`

### `routes`

Routes represent internal operational planning, not client-owned records.

Suggested columns:

- `id`
- `branch_id`
- `code`
- `name`
- `is_active`

### `route_stops`

This is the ordered relationship between an internal route and a master stop.

Suggested columns:

- `id`
- `route_id`
- `master_stop_id`
- `sequence_number`
- `planned_service_minutes`
- `is_active`

### `route_assignments`

Daily assignment should bind route, employee, and vehicle at a point in time.

Suggested columns:

- `id`
- `route_id`
- `employee_id`
- `vehicle_id`
- `assignment_date`
- `assigned_by_user_id`
- `started_at`
- `completed_at`

### `stop_events`

Track every meaningful transition rather than storing status alone.

Suggested columns:

- `id`
- `route_assignment_id`
- `master_stop_id`
- `event_type`
- `status`
- `occurred_at`
- `created_by_user_id`
- `reason`
- `metadata_json`

## Future expansion

The following tables can be added after the core workflow stabilizes:

- `geotab_devices`
- `trip_snapshots`
- `geofence_events`
- `idle_events`
- `deviation_events`
- `notifications`
- `exports`
