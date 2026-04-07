# ADR 0001: Modular Service Architecture for `spi-integrations-futbolaragon-api`

## Context

ProcessIQ needs `spi-integrations-futbolaragon-api` as an integration service dedicated to Futbol Aragon and intentionally decoupled from the Core. The spike scope is limited to a single team of a single club, with `equipo` as the root entity and a future target of nightly daily synchronization.

The service must support two source access modes:

- public portal
- authenticated portal

The first spike needs to cover these source areas:

- competitions
- calendars
- rounds
- matches
- standings

The service is expected to preserve raw captures for traceability while also generating a normalized internal model suitable for downstream ProcessIQ usage.

## Decision

We will use a modular architecture inside the service, separating source access, extraction, normalization, mapping, persistence, and orchestration into explicit layers under `src/modules/futbolAragon`.

The service remains decoupled from the Core. It owns its source contracts, its synchronization workflow, and its persistence boundaries. Integration with other ProcessIQ services should happen through stable internal models or downstream synchronization contracts, not by coupling the Core directly to source-specific logic.

We explicitly separate the source model from the internal domain model:

- `types/source.types.ts` represents Futbol Aragon payloads and access context
- `types/domain.types.ts` represents the internal normalized contracts

We will store both:

- raw source payloads through `raw-capture.repository.ts`
- normalized entities through per-entity repositories

We support two access modes from day one:

- `public-client.ts`
- `auth-client.ts` with `session-manager.ts`

The root entity of the spike is `equipo`. Sync orchestration starts from a team context and expands into competitions, calendars, rounds, matches, and standings.

## Responsibilities by Layer

### App

- expose HTTP routes
- start the Fastify server
- keep transport concerns outside the integration logic

### Client

- access Futbol Aragon portals
- isolate public and authenticated access modes
- manage authenticated session state separately

### Extractors

- read source snapshots
- extract source-shaped fragments for each entity area
- avoid domain decisions

### Normalizers

- convert source entities into internal normalized entities
- isolate mapping rules between source and internal model

### Repositories

- persist raw captures
- persist normalized entities
- persist sync run lifecycle
- persist source-to-internal references

### Mappers

- map the root `equipo` context into source access context
- isolate source lookup and identity translation concerns

### Services

- orchestrate the end-to-end synchronization flow
- coordinate clients, extractors, normalizers, and repositories

### Jobs

- provide executable sync entry points for schedulers or manual triggering

### Shared

- host cross-cutting utilities such as HTTP abstractions, errors, logging, and helpers

## Consequences Positive

- clear separation of responsibilities makes the spike easier to evolve
- source-specific logic stays isolated from the internal model
- raw plus normalized storage improves traceability and reprocessing options
- public and authenticated access can evolve independently
- job orchestration is ready for future nightly PM2 or cron-driven execution
- the structure stays aligned with a Fastify + Node service style already used in the ecosystem

## Trade-offs

- more files and folders than a quick spike script
- some indirection appears before real scraping and persistence exist
- orchestration requires explicit wiring of dependencies instead of implicit imports

## Alternatives Discarded

### Single-layer service module

Rejected because it would mix HTTP access, parsing, normalization, and persistence in the same place, making future changes risky.

### Core-coupled integration

Rejected because ProcessIQ needs this service to remain an external integration boundary, not source-specific logic embedded in the Core.

### Source model reused as internal model

Rejected because the Futbol Aragon source shape is not a stable contract for the rest of the platform and would leak source-specific semantics.

### Store only normalized data

Rejected because raw capture is important for auditability, debugging, replay, and parser evolution during the spike and beyond.
