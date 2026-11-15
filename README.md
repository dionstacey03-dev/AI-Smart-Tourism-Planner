# 🇱🇰 CeylonAI — AI Smart Tourism Planner

CeylonAI is an AI-powered travel planning application focused on helping visitors build personalized journeys across Sri Lanka.

## Current capabilities

- Gemini-powered day-by-day itinerary generation
- Trip duration, starting location, traveler count, budget, interests and travel pace inputs
- Suggested daily activities and practical travel tips
- Indicative budget estimates displayed in Sri Lankan rupees (LKR)
- Responsive React + Vite interface
- Secure server-side Gemini API integration through a Vercel Function
- Firebase Google sign-in and owner-scoped Firestore trip persistence (requires project configuration)
- Google Maps itinerary map with advanced destination markers and driving route visualization (requires Maps credentials)
- Bounded Gemini request timeouts, retry handling and structured output validation

> Budget estimates are illustrative planning guidance, not live quotes. Weather, traffic, attraction opening hours and booking availability are not currently connected. Maps route results depend on Google Maps Platform availability and configured APIs.

## Technology

- React 19 + Vite
- Google Gemini API
- Vercel Functions (Node.js)
- Firebase Authentication and Cloud Firestore
- Google Maps Platform (Maps JavaScript API, Geocoding and Directions)

## Run locally

### 1. Requirements

- Node.js 20 or later
- npm
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
- Vercel CLI for running the API function locally

### 2. Install dependencies

```bash
git clone https://github.com/dionstacey03-dev/AI-Smart-Tourism-Planner.git
cd AI-Smart-Tourism-Planner
npm install
npm install -g vercel
```

### 3. Configure the Gemini API key

Create a local `.env.local` file in the project root using `.env.example` as a template:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Never commit `.env` or expose the Gemini key in frontend code. The repository includes `.env.example` as a template.

### 4. Start the application and API

```bash
vercel dev
```

Open the local URL printed by Vercel. The Vercel development server is required because the itinerary endpoint lives in the `/api` directory.

## Deploy to Vercel

1. Import this GitHub repository into Vercel (or use the existing connected project).
2. In **Project Settings → Environment Variables**, add `GEMINI_API_KEY`.
3. Add the variable to Preview and Production environments as needed.
4. Redeploy so the new environment variable is available to the function.

The Gemini key must be stored as a server-side Vercel environment variable, not as a `VITE_*` variable.

## API

### `POST /api/generate-itinerary`

Example request:

```json
{
  "startLocation": "Colombo",
  "days": 5,
  "travelers": 2,
  "budget": "Medium",
  "interests": "Nature & Adventure",
  "travelStyle": "Balanced"
}
```

The endpoint validates the trip preferences, asks Gemini for a structured itinerary, and returns JSON containing daily destinations, activities and practical tips.

## V2 setup and configuration

See [README-SETUP.md](./README-SETUP.md) for Firebase project creation, Firestore rules deployment, Google Maps API setup, key restrictions and Vercel environment variables. Features that depend on Firebase and Maps remain inactive until their configuration is supplied.

## Roadmap

- [x] LKR currency display
- [x] Gemini-generated itinerary connected to the planner
- [x] Bounded Gemini timeout and retry handling
- [x] Firebase client, Google sign-in and owner-only Firestore trip persistence
- [x] Google Maps destination markers and driving route layer
- [x] Responsive itinerary map panel and reduced-motion support
- [ ] Saved-trip dashboard and itinerary editing
- [ ] Places autocomplete and richer destination details
- [ ] Live weather, traffic and verified travel availability
- [ ] End-to-end tests and production security review

## Security notes

- Keep all API keys in environment variables.
- Restrict and monitor API usage in Google AI Studio / Google Cloud.
- Add Firebase-authenticated request verification and rate limiting before opening the generation endpoint to unrestricted public traffic.
- Restrict browser-exposed Google Maps keys by HTTP referrer and enabled APIs.
- Firestore rules restrict trip documents to their authenticated owner; deploy the included rules before enabling saved trips.

---

Built as a portfolio project by [Dion Stacey Sellar](https://github.com/dionstacey03-dev).
