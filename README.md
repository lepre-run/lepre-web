# lepre-web

Local-first Vite + React application deployed on AWS Amplify at `lepre.run`.

After Strava authorization, the app synchronizes the minimum workout record
into IndexedDB:

```ts
{ id, date, name }
```

The Strava activity id exists only to make updates and deletions idempotent.
Workout content is not stored by the backend. The UI can read its local data
while offline and synchronizes when opened or when the user requests it.

## Local verification

```bash
npm ci
npm run lint
npm test -- --run
npm run build
```

Amplify builds and deploys `main`. The production branch remains protected by
Amplify basic authentication during development.
