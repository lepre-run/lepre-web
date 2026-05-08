# lepre-web

Vite + React + TypeScript single-page app on AWS Amplify at `lepre.dev`.

Three pages (slice 1):

- `/` — `Join with Strava` button (anchor → Lambda `/v1/auth/strava/start`)
- `/connected` — static success page
- `/connect-failed?reason=…&id=…` — error page with closed reason-slug set

See `~/opt/adventures/lepre-api/plans/001-strava-join.md` for the ADR.

## Local

```bash
npm ci
npm run dev          # vite dev server
npm test             # vitest run
npm run lint         # biome
npm run build        # tsc + vite build
```

## Deploy

Amplify's GitHub source integration triggers on push to `main`. Build
command (set on the Amplify app, not in this repo): `npm ci && npm run lint
&& npm test -- --run && npm run build`. Output: `dist/`.

There is no GitHub Actions workflow in this repo for slice 1 — Amplify's
build runs the lint + tests before deploying. A PR-only workflow is a
follow-up once branching matters.
