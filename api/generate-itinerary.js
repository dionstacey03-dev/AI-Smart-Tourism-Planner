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
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestGemini(apiKey, prompt) {
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

  let lastError = null;

  // A bounded retry prevents the UI from waiting indefinitely during temporary overload.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const geminiResponse = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(12000),
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2600,
            responseMimeType: "application/json",
            responseSchema: itinerarySchema,
          },
        }),
      });

      const result = await geminiResponse.json().catch(() => ({}));

      if (geminiResponse.ok) return result;

      const message = result.error?.message || `Gemini returned HTTP ${geminiResponse.status}`;
      const retryable = [429, 500, 502, 503, 504].includes(geminiResponse.status);

      if (!retryable || attempt === 2) {
        const error = new Error(message);
        error.status = geminiResponse.status;
        throw error;
      }

      lastError = new Error(message);
    } catch (error) {
      lastError = error;
      const retryable =
        error.name === "TimeoutError" ||
        error.name === "AbortError" ||
        error.status === undefined ||
        [429, 500, 502, 503, 504].includes(error.status);

      if (!retryable || attempt === 2) throw error;
    }

    await sleep(900);
  }

  throw lastError || new Error("Gemini request failed.");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return response.status(503).json({
      error: "Gemini is not configured yet. Add GEMINI_API_KEY to your environment variables.",
    });
  }

  try {
    const body = typeof request.body === "string"
      ? JSON.parse(request.body)
      : request.body || {};

    const startLocation = String(body.startLocation || "Colombo").slice(0, 80);
    const days = Math.max(1, Math.min(Number(body.days) || 1, 14));
    const travelers = Math.max(1, Math.min(Number(body.travelers) || 1, 10));
    const budget = ["Budget", "Medium", "Premium"].includes(body.budget)
      ? body.budget
      : "Medium";
    const interests = String(body.interests || "Nature & Adventure").slice(0, 100);
    const travelStyle = ["Relaxed", "Balanced", "Fast Paced"].includes(body.travelStyle)
      ? body.travelStyle
      : "Balanced";

    const prompt = `
You are CeylonAI, a careful Sri Lanka travel-planning assistant.
Create a practical ${days}-day itinerary for ${travelers} traveller(s), starting in ${startLocation}.
Budget level: ${budget}. Main interest: ${interests}. Travel pace: ${travelStyle}.

Requirements:
- Plan travel only within Sri Lanka.
- Return exactly ${days} itinerary entries, numbered 1 through ${days}.
- Keep the route geographically sensible; avoid unnecessary long-distance backtracking.
- Use real, well-known Sri Lankan destinations and attractions. Never invent an attraction.
- Keep each day's description short and specific. Include exactly 2 suggested activities.
- Include one short practical travel tip each day.
- Be realistic about travel time. Do not claim live traffic, availability, weather, or current prices.
- Do not fabricate opening hours, ticket prices, or transport schedules.
- All budget discussion must use Sri Lankan rupees (LKR); avoid exact price claims unless clearly marked as rough estimates.
- If a destination is season-dependent, mention that the traveller should check conditions before visiting.
- Return only data matching the supplied JSON schema.
`;

    const result = await requestGemini(apiKey, prompt);
    const generatedText = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("");

    if (!generatedText) {
      return response.status(502).json({
        error: "Gemini returned an empty itinerary. Please try again.",
      });
    }

    let itinerary;
    try {
      itinerary = JSON.parse(generatedText);
    } catch {
      return response.status(502).json({
        error: "Gemini returned an unreadable itinerary. Please try again.",
      });
    }

    if (!Array.isArray(itinerary.itinerary) || itinerary.itinerary.length !== days) {
      return response.status(502).json({
        error: "The generated itinerary was incomplete. Please try again.",
      });
    }

    return response.status(200).json({
      ...itinerary,
      days,
      travelers,
      budget,
      interests,
      travelStyle,
      startLocation,
      currency: "LKR",
      generatedBy: "Gemini",
    });
  } catch (error) {
    console.error("Itinerary generation failed:", error.message || error);

    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return response.status(504).json({
        error: "Gemini took too long to respond. Please try again in a moment.",
      });
    }

    if ([429, 500, 502, 503, 504].includes(error.status)) {
      return response.status(503).json({
        error: "Gemini is temporarily busy. Please try again shortly.",
      });
    }

    return response.status(500).json({
      error: "We couldn't generate your itinerary. Please try again.",
    });
  }
}
