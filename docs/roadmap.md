# Roadmap

## Phase 0: foundation

- Scaffold the monorepo and app boundaries
- Set up PostgreSQL, PostGIS, Redis, and environment handling
- Define roles, permissions, and audit requirements
- Create architecture decision records for auth, ORM, and deployment

## Phase 1: secure operational base

- Authentication and session management
- Role-based and permission-based access control
- Audit logging for all privileged actions
- Employee, vehicle, stop, route, and assignment data models

## Phase 2: first usable workflow

- Daily assignment board
- Worker route experience
- Stop status workflow
- Manager dashboard
- Manual override flow with required reasons

## Phase 3: admin efficiency

- Import preview and conflict review
- Export tooling by route, employee, date, and category
- Bulk update utilities for stop and route administration

## Phase 4: telematics integration

- Geotab sync service
- Vehicle/device mapping
- Vehicle status dashboard
- Snapshot and trip persistence

## Phase 5: operational intelligence

- Geofence arrivals
- Completion confidence rules
- Off-route and idle detection
- Alerting and exception handling

## Phase 6: visibility and expansion

- Live manager map
- Historical playback and route analysis
- Mobile worker app via React Native and Expo
- Analytics and paperless operation extensions
