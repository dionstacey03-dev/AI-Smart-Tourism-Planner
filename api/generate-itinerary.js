const MAX_DAYS = 14
const MAX_TRAVELERS = 10
const REQUEST_TIMEOUT_MS = 9000
const MAX_ATTEMPTS = 2

const itinerarySchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    summary: { type: "STRING" },
    itinerary: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          day: { type: "INTEGER" },
          place: { type: "STRING" },
          description: { type: "STRING" },
          activities: { type: "ARRAY", items: { type: "STRING" } },
          travelTip: { type: "STRING" },
        },
        required: ["day", "place", "description", "activities", "travelTip"],
      },
    },
    practicalTips: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "summary", "itinerary", "practicalTips"],
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
function normalizeInput(body = {}) {
  const days = Number(body.days)
  const travelers = Number(body.travelers)
  const budget = ["Budget", "Medium", "Premium"].includes(body.budget) ? body.budget : "Medium"
  const travelStyle = ["Relaxed", "Balanced", "Fast Paced"].includes(body.travelStyle)
    ? body.travelStyle
    : "Balanced"

  return {
    startLocation: String(body.startLocation || "Colombo").trim().slice(0, 80) || "Colombo",
    days: Number.isFinite(days) ? Math.max(1, Math.min(Math.floor(days), MAX_DAYS)) : 7,
    travelers: Number.isFinite(travelers) ? Math.max(1, Math.min(Math.floor(travelers), MAX_TRAVELERS)) : 2,
    budget,
    interests: String(body.interests || "Nature & Adventure").trim().slice(0, 100) || "Nature & Adventure",
    travelStyle,
  }
}

async function requestGemini(apiKey, prompt) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash"
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  let lastError

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 2200,
            responseMimeType: "application/json",
            responseSchema: itinerarySchema,
          },
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (response.ok) return payload

      const error = new Error(payload.error?.message || `Gemini returned HTTP ${response.status}`)
      error.status = response.status
      const retryable = [429, 500, 502, 503, 504].includes(response.status)
      if (!retryable || attempt === MAX_ATTEMPTS) throw error
      lastError = error
    } catch (error) {
      lastError = error
      const retryable = error.name === "TimeoutError"
        || error.name === "AbortError"
        || error.status === undefined
        || [429, 500, 502, 503, 504].includes(error.status)

      if (!retryable || attempt === MAX_ATTEMPTS) throw error
    }

    await sleep(250 * attempt)
  }

  throw lastError || new Error("Gemini request failed.")
}

function parseRequestBody(request) {
  if (typeof request.body === "string") return JSON.parse(request.body)
  if (request.body && typeof request.body === "object") return request.body
  return {}
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store")
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST")
    return response.status(405).json({ error: "Method not allowed." })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return response.status(503).json({
      error: "Gemini is not configured. Add GEMINI_API_KEY to the Vercel environment variables.",
    })
  }

  let input
  try {
    input = normalizeInput(parseRequestBody(request))
  } catch {
    return response.status(400).json({ error: "Please send a valid JSON request." })
  }

  const prompt = `
You are CeylonAI, a careful Sri Lanka travel-planning assistant.
Create a practical ${input.days}-day itinerary for ${input.travelers} traveller(s), starting in ${input.startLocation}.
Budget level: ${input.budget}. Main interest: ${input.interests}. Travel pace: ${input.travelStyle}.

Requirements:
- Plan travel only within Sri Lanka.
- Return exactly ${input.days} itinerary entries, numbered 1 through ${input.days}.
- Keep the route geographically sensible and avoid unnecessary backtracking.
- Use real, well-known Sri Lankan destinations and attractions; do not invent places.
- Give each day a concise description, exactly two suggested activities and one practical travel tip.
- Do not claim live traffic, availability, weather, opening hours, transport schedules or current prices.
- Express budget context in Sri Lankan rupees (LKR), and label estimates as approximate.
- Return only data matching the supplied JSON schema.
`

  const generationStartedAt = Date.now()
  try {
    const result = await requestGemini(apiKey, prompt)
    const candidate = result.candidates?.[0]
    const generatedText = candidate?.content?.parts?.map((part) => part.text || "").join("")

    if (!generatedText) {
      console.error("Gemini returned no text", candidate?.finishReason || "unknown finish reason")
      return response.status(502).json({ error: "Gemini returned an empty itinerary. Please try again." })
    }

    let itinerary
    try {
      itinerary = JSON.parse(generatedText)
    } catch {
      return response.status(502).json({ error: "Gemini returned an unreadable itinerary. Please try again." })
    }

    if (!Array.isArray(itinerary.itinerary)
      || itinerary.itinerary.length !== input.days
      || !itinerary.itinerary.every((item) => item.place && item.description
        && Array.isArray(item.activities) && item.activities.length >= 2)) {
      return response.status(502).json({ error: "The generated itinerary was incomplete. Please try again." })
    }

    const normalizedDays = itinerary.itinerary.map((item, index) => ({
      day: index + 1,
      place: String(item.place || "Sri Lanka").slice(0, 100),
      description: String(item.description || "").slice(0, 500),
      activities: item.activities.slice(0, 2).map((value) => String(value).slice(0, 160)),
      travelTip: String(item.travelTip || "").slice(0, 300),
    }))

    return response.status(200).json({
      title: String(itinerary.title || "Your Sri Lanka journey").slice(0, 120),
      summary: String(itinerary.summary || "").slice(0, 600),
      itinerary: normalizedDays,
      practicalTips: Array.isArray(itinerary.practicalTips)
        ? itinerary.practicalTips.slice(0, 8).map((tip) => String(tip).slice(0, 240))
        : [],
      ...input,
      currency: "LKR",
      generatedBy: "Gemini",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      generationMs: Date.now() - generationStartedAt,
    })
  } catch (error) {
    console.error("Itinerary generation failed:", error.message || error)

    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return response.status(504).json({ error: "Gemini timed out. Please try again; no itinerary was saved." })
    }
    if ([429, 500, 502, 503, 504].includes(error.status)) {
      return response.status(503).json({ error: "Gemini is temporarily busy. Please try again shortly." })
    }
    return response.status(500).json({ error: "We couldn't generate your itinerary. Please try again." })
  }
}
