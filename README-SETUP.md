# CeylonAI V2 setup

## Install

```bash
npm install
cp .env.example .env.local
```

Fill in the variables in `.env.local`. Never commit real credentials.

## Firebase

1. Create a project at https://console.firebase.google.com/.
2. Add a Web app and copy its configuration into the `VITE_FIREBASE_*` variables.
3. In Authentication > Sign-in method, enable Google.
4. Create Cloud Firestore in **Singapore (asia-southeast1)** if offered. Choose the closest suitable region carefully because the database location cannot simply be changed later.
5. Install and sign in to the Firebase CLI (`npm install -g firebase-tools`, then `firebase login`).
6. Select your project with `firebase use --add` and deploy the included rules and indexes with `firebase deploy --only firestore`.
7. Add `localhost` and your production domain to Authentication > Settings > Authorized domains.

Firebase browser configuration is not a server secret. Firestore access is controlled by Authentication and Security Rules. Enable App Check before public launch.

## Google Maps

1. Create/select a Google Cloud project at https://console.cloud.google.com/.
2. Attach a billing account and enable Maps JavaScript API, Geocoding API, Directions API and Places API (New).
3. Create a browser API key.
4. Restrict its application to HTTP referrers for localhost and your production domain.
5. Restrict API access to Maps JavaScript API, Geocoding API, Directions API and Places API (New).
6. Create a Map ID in Google Cloud and set `VITE_GOOGLE_MAPS_MAP_ID` (the demo map ID is only a development fallback).
7. Put the key in `VITE_GOOGLE_MAPS_API_KEY` locally and in Vercel's environment variables.

Do not reuse the Gemini key for Maps. Configure quotas and budget alerts in Google Cloud. Maps API usage can incur charges.

## Gemini

Set `GEMINI_API_KEY` as a server-side environment variable in Vercel (Preview and Production as required). Do not expose it through a `VITE_` variable.

Optional: set `GEMINI_MODEL`; the default is `gemini-2.5-flash`. The API uses bounded timeouts and a single bounded retry for transient upstream failures.

## Local checks

```bash
npm run lint
npm run build
npm run dev
```

The map displays a setup message until a Maps key is configured. Firebase sign-in and trip saving remain disabled until the Firebase web app configuration is supplied.
