# lepre-web

Local-first Vite + React application deployed on AWS Amplify at `lepre.run`.

After Strava authorization, the browser asks the backend to relay detailed
running activities from Strava. The browser validates and classifies each
complete activity before synchronizing its selected source data into IndexedDB:

```ts
{
  id,
  performedAt,
  name,
  description,
  type,
  sport,
  durationSeconds,
  elapsedDurationSeconds,
  distanceMeters,
  averageHeartRateBpm,
  maxHeartRateBpm,
  laps
}
```

The domain reconstructs the classification from those stored source fields on
read, so an improved classifier can be rerun without another Strava request.

The UI reads only from IndexedDB and can therefore render while offline.
Synchronization updates that local source of truth when the app opens or the
user requests it. Initial import covers one year in newest-first batches, but
fetches at most one batch per synchronization attempt and waits 15 minutes
before continuing the historical backfill. Its continuation is persisted after
every batch, so closing the browser merely defers the next batch until a later
visit. Workout content is never stored by the backend, and classification runs
only in the browser. When Strava reaches a request limit, the import keeps its
checkpoint, shows a paused state and resumes automatically after the API's retry
interval.

Code follows the Clean Architecture dependency rule:

- `src/domain` contains immutable entities and value objects.
- `src/application` contains use cases and outbound ports.
- `src/infrastructure` contains HTTP and IndexedDB adapters.
- `src/composition` wires concrete adapters into use cases.
- `src/pages` contains React presentation.

IndexedDB schema version 5 deliberately resets cached workout history so the
current source fields can be reimported from Strava.

## Local verification

```bash
npm ci
npm run lint
npm test -- --run
npm run build
```

## Local mocked feed

Run the frontend with a browser-level mock of the Lepre API:

```bash
npm run dev:mock
```

Open the Vite URL shown in the terminal. The mock API returns a connected
runner and synchronizes representative interval, progressive, tempo, unknown,
and free runs into the same IndexedDB store used by the production application.
Normal `npm run dev` and production builds do not start the mock worker.

## Localization

English is the default and fallback interface language; Italian is available as
an additional presentation locale. Domain and stored workout data remain
language-neutral: classifications contain stable English identifiers and
structured numeric parameters, while React presentation formatters produce
translated labels, dates, measurements and plurals. Activity names,
descriptions and lap names received from Strava are displayed unchanged.

Amplify builds and deploys `main`. The production branch remains protected by
Amplify basic authentication during development.
