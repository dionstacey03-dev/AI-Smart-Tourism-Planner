const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

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
          activities: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          travelTip: { type: "STRING" },
        },
        required: ["day", "place", "description", "activities", "travelTip"],
      },
    },
    practicalTips: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
  required: ["title", "summary", "itinerary", "practicalTips"],
};

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
- Make each day's description useful and specific. Include 2-4 suggested activities.
- Include a concise practical travel tip each day.
- Be realistic about travel time. Do not claim live traffic, availability, weather, or current prices.
- Do not fabricate opening hours, ticket prices, or transport schedules.
- All budget discussion must use Sri Lankan rupees (LKR); avoid exact price claims unless clearly marked as rough estimates.
- If a destination is season-dependent, mention that the traveller should check conditions before visiting.
- Return only data matching the supplied JSON schema.
`;

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 5000,
            responseMimeType: "application/json",
            responseSchema: itinerarySchema,
          },
        }),
      },
    );

    const result = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", result.error?.message || geminiResponse.status);
      return response.status(502).json({
        error: "Gemini could not generate the itinerary. Please try again.",
      });
    }

    const generatedText = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("");

    if (!generatedText) {
      return response.status(502).json({
        error: "Gemini returned an empty itinerary. Please try again.",
      });
    }

    const itinerary = JSON.parse(generatedText);
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
    console.error("Itinerary generation failed:", error);
    return response.status(400).json({
      error: "Invalid request or unexpected server error. Please try again.",
    });
  }
}
