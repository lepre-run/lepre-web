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
  sport,
  durationSeconds,
  elapsedDurationSeconds,
  distanceMeters,
  laps
}
```

The domain reconstructs the classification from those stored source fields on
read, so an improved classifier can be rerun without another Strava request.

The UI reads only from IndexedDB and can therefore render while offline.
Synchronization updates that local source of truth when the app opens or the
user requests it. Initial import covers one year in newest-first batches and
persists its continuation after every batch. Workout content is never stored by
the backend, and classification runs only in the browser. When Strava reaches a
request limit, the import keeps its checkpoint, shows a paused state and resumes
automatically after the API's retry interval.

Code follows the Clean Architecture dependency rule:

- `src/domain` contains immutable entities and value objects.
- `src/application` contains use cases and outbound ports.
- `src/infrastructure` contains HTTP and IndexedDB adapters.
- `src/composition` wires concrete adapters into use cases.
- `src/pages` contains React presentation.

IndexedDB schema version 3 deliberately resets the pre-feed development
schema; there is no production migration because the app has no users yet.

## Local verification

```bash
npm ci
npm run lint
npm test -- --run
npm run build
```

Amplify builds and deploys `main`. The production branch remains protected by
Amplify basic authentication during development.
