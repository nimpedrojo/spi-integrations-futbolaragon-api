# Project Structure

Estructura actual del repositorio, excluyendo `node_modules`, `dist` y `.git`.

```text
.
├── .data
│   └── futbol-aragon
│       ├── normalized
│       │   ├── calendars.json
│       │   ├── competitions.json
│       │   ├── matches.json
│       │   ├── rounds.json
│       │   ├── source-references.json
│       │   ├── standings.json
│       │   └── sync-runs.json
│       └── raw
│           ├── pages
│           │   ├── 2026-04-07T13-56-16.675Z--simulated-standings-page.html
│           │   ├── 2026-04-07T14-18-01.266Z--team-spike-competition-page.html
│           │   ├── 2026-04-07T14-18-01.799Z--team-spike-standings-page.html
│           │   ├── 2026-04-07T14-26-05.430Z--team-spike-competition-page.html
│           │   ├── 2026-04-07T14-26-05.849Z--team-spike-standings-page.html
│           │   ├── 2026-04-07T14-34-02.244Z--team-spike-competition-page.txt
│           │   ├── 2026-04-07T14-34-02.374Z--team-spike-standings-page.txt
│           │   └── 2026-04-07T14-36-33.297Z--team-spike-competition-page.txt
│           ├── pages.json
│           ├── snapshots
│           │   └── 2026-04-07T13-55-46.216Z--sync-team-spike-1775570146213.json
│           └── snapshots.json
├── .env
├── .gitignore
├── .raw-captures
│   ├── .DS_Store
│   └── futbol-aragon
│       ├── 2026-04-07T12-14-25.443Z--public-competition-page.html
│       ├── 2026-04-07T12-20-16.625Z--public-competition-page.html
│       ├── 2026-04-07T12-28-19.396Z--public-competition-page.html
│       └── standings-jornada-8.html
├── .tmp-raw-captures
│   └── 2026-04-07T13-43-15.133Z--test-standings.html
├── SPIKE-FAF-ingesta.md
├── docs
│   ├── adr
│   │   └── 0001-modular-service-architecture.md
│   ├── data
│   │   ├── normalized-model.md
│   │   └── raw-capture-model.md
│   ├── decisions
│   │   └── authentication-not-required.md
│   ├── discovery
│   │   ├── extraction-strategy.md
│   │   ├── functional-navigation-map.md
│   │   ├── identifiers-map.md
│   │   └── public-vs-auth-analysis.md
│   ├── mapping
│   │   └── team-identity-strategy.md
│   ├── operations
│   │   ├── error-handling-strategy.md
│   │   └── nightly-job.md
│   ├── project-structure.md
│   ├── spike
│   │   ├── next-iteration-architecture.md
│   │   └── spike-results.md
│   └── validation
│       ├── functional-coverage.md
│       ├── json-contract-consistency.md
│       ├── repeated-sync-tests.md
│       └── source-id-stability.md
├── fixtures
│   └── contracts
│       ├── calendar.sample.json
│       ├── competition.sample.json
│       ├── match.sample.json
│       ├── round.sample.json
│       └── standing.sample.json
├── package-lock.json
├── package.json
├── src
│   ├── app
│   │   ├── routes.ts
│   │   └── server.ts
│   ├── config
│   │   └── env.ts
│   ├── index.ts
│   ├── modules
│   │   ├── futbolAragon
│   │   │   ├── client
│   │   │   │   ├── auth-client.ts
│   │   │   │   ├── public-client.ts
│   │   │   │   └── session-manager.ts
│   │   │   ├── extractors
│   │   │   │   ├── calendars.extractor.ts
│   │   │   │   ├── competitions.extractor.ts
│   │   │   │   ├── matches.extractor.ts
│   │   │   │   ├── rounds.extractor.ts
│   │   │   │   └── standings.extractor.ts
│   │   │   ├── jobs
│   │   │   │   └── sync-team.job.ts
│   │   │   ├── mappers
│   │   │   │   └── team-source.mapper.ts
│   │   │   ├── normalizers
│   │   │   │   ├── calendar.normalizer.ts
│   │   │   │   ├── competition.normalizer.ts
│   │   │   │   ├── match.normalizer.ts
│   │   │   │   ├── round.normalizer.ts
│   │   │   │   └── standing.normalizer.ts
│   │   │   ├── repositories
│   │   │   │   ├── calendar.repository.ts
│   │   │   │   ├── competition.repository.ts
│   │   │   │   ├── match.repository.ts
│   │   │   │   ├── raw-capture.repository.ts
│   │   │   │   ├── round.repository.ts
│   │   │   │   ├── source-reference.repository.ts
│   │   │   │   ├── standing.repository.ts
│   │   │   │   └── sync-run.repository.ts
│   │   │   ├── services
│   │   │   │   └── sync-team.service.ts
│   │   │   └── types
│   │   │       ├── domain.types.ts
│   │   │       └── source.types.ts
│   │   └── health
│   ├── scripts
│   │   ├── capture-public-competition.ts
│   │   └── sync-team.ts
│   └── shared
│       ├── errors
│       │   └── app-error.ts
│       ├── http
│       │   ├── cookie-jar.ts
│       │   ├── fetch-http-client.ts
│       │   └── http-client.ts
│       ├── logger
│       │   └── logger.ts
│       └── utils
│           ├── async.ts
│           └── json-file-store.ts
└── tsconfig.json
```
