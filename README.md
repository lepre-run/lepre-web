# lepre-web

Local-first Vite + React application deployed on AWS Amplify at `lepre.run`.

After Strava authorization, the app synchronizes the workout entity into
IndexedDB:

```ts
{ id, performedAt, name, durationSeconds, distanceMeters }
```

The UI reads only from IndexedDB and can therefore render while offline.
Synchronization updates that local source of truth when the app opens or the
user requests it. Workout content is never stored by the backend.

Code follows the Clean Architecture dependency rule:

- `src/domain` contains immutable entities and value objects.
- `src/application` contains use cases and outbound ports.
- `src/infrastructure` contains HTTP and IndexedDB adapters.
- `src/composition` wires concrete adapters into use cases.
- `src/pages` contains React presentation.

IndexedDB schema version 2 deliberately resets the pre-entity development
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
