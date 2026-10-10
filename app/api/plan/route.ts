import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";

// --------------------------------------------------
// 1. AI CONFIGURATION
// --------------------------------------------------

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from .env.local");
}

const ai = new GoogleGenAI({
  apiKey,
});

const MODEL = "gemma-4-31b-it";

// --------------------------------------------------
// 2. REQUEST VALIDATION
// --------------------------------------------------

const tripRequestSchema = z.object({
  from: z.string().trim().min(2).max(100),
  destination: z.string().trim().min(2).max(100),
  days: z.coerce.number().int().min(1).max(30),
  budget: z.coerce.number().positive().max(100_000_000),
  travellers: z.coerce.number().int().min(1).max(50),
  style: z.string().trim().min(1).max(100),
});

// --------------------------------------------------
// 3. RESPONSE VALIDATION
// --------------------------------------------------

const activitySchema = z.object({
  time: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  category: z.string(),
  estimatedCost: z.number().nonnegative(),
});

const itineraryDaySchema = z.object({
  day: z.number().int().positive(),
  title: z.string(),
  summary: z.string(),
  activities: z.array(activitySchema),
});

const budgetBreakdownSchema = z.object({
  transportation: z.number().nonnegative(),
  accommodation: z.number().nonnegative(),
  food: z.number().nonnegative(),
  activities: z.number().nonnegative(),
  localTransport: z.number().nonnegative(),
  miscellaneous: z.number().nonnegative(),
});

const tripPlanSchema = z.object({
  tripTitle: z.string(),
  introduction: z.string(),
  destination: z.string(),
  estimatedBudget: z.number().nonnegative(),
  budgetBreakdown: budgetBreakdownSchema,
  budgetAdvice: z.string(),
  itinerary: z.array(itineraryDaySchema),
  practicalTips: z.array(z.string()),
  importantDisclaimer: z.string(),
});

// --------------------------------------------------
// 4. HELPER: EXTRACT JSON
// --------------------------------------------------

function parseJsonResponse(text: string): unknown {
  // First, try parsing the response directly.
  try {
    return JSON.parse(text);
  } catch {
    // Continue to fallback parsing.
  }

  // Handle responses wrapped in Markdown code fences.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Gemma returned an invalid JSON response. Please try again."
    );
  }
}

// --------------------------------------------------
// 5. POST HANDLER
// --------------------------------------------------

export async function POST(request: Request) {
  try {
    // Read and validate the submitted trip.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const validation = tripRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Please check your trip details.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const trip = validation.data;

    const totalBudget = trip.budget;
    const totalTravellers = trip.travellers;

    // --------------------------------------------------
    // 6. BUILD THE AI PROMPT
    // --------------------------------------------------

    const prompt = `
You are Elsewhere, an intelligent and thoughtful AI travel planner.

Create a personalised travel plan using the traveller's requirements.

TRIP DETAILS
------------
Starting location: ${trip.from}
Destination: ${trip.destination}
Duration: ${trip.days} days
Number of travellers: ${totalTravellers}
Total trip budget: INR ${totalBudget}
Preferred travel style: ${trip.style}

YOUR OBJECTIVES
---------------

1. Create exactly ${trip.days} itinerary days.
2. Personalise the experience to the requested travel style.
3. Recommend sensible activities and group nearby attractions together.
4. Estimate transportation, accommodation, food, activities, local
   transportation and miscellaneous expenses in Indian Rupees.
5. Keep the estimated total within the stated budget whenever reasonably
   possible.
6. Account for all ${totalTravellers} travellers when estimating group costs.
7. Do not invent exact hotel availability, confirmed prices, train schedules,
   flight schedules or live route information.
8. Treat costs as estimates, not verified live prices.
9. Do not include activities that are geographically impractical for the
   requested itinerary.
10. Include practical, useful travel tips.
11. Be transparent if the requested budget is insufficient.
12. Make the itinerary feel personal and thoughtful rather than generic.

BUDGET RULES
------------

The budget breakdown must contain these six numeric fields:

- transportation
- accommodation
- food
- activities
- localTransport
- miscellaneous

All values must be non-negative numbers in INR.

The sum of these six categories must represent the estimated total trip cost
for all travellers combined.

Keep the estimated cost within INR ${totalBudget} if feasible.

If the budget is unrealistic, explain the issue in budgetAdvice. Do not
pretend an unrealistic budget is sufficient.

OUTPUT REQUIREMENTS
-------------------

Return ONLY one valid JSON object.

Do not include Markdown, code fences, explanations outside the JSON,
or additional keys.

Follow this exact structure:

{
  "tripTitle": "A short, appealing trip title",
  "introduction": "A personalised introduction",
  "destination": "${trip.destination}",
  "estimatedBudget": 10000,
  "budgetBreakdown": {
    "transportation": 2000,
    "accommodation": 3000,
    "food": 2000,
    "activities": 1500,
    "localTransport": 1000,
    "miscellaneous": 500
  },
  "budgetAdvice": "Practical advice about the budget",
  "itinerary": [
    {
      "day": 1,
      "title": "Day title",
      "summary": "A brief description of the day",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Activity title",
          "description": "What to do and why it is worthwhile",
          "location": "Place name",
          "category": "Adventure",
          "estimatedCost": 500
        }
      ]
    }
  ],
  "practicalTips": [
    "A useful travel tip"
  ],
  "importantDisclaimer": "Prices and availability are estimates and should be verified."
}

IMPORTANT:
- Generate exactly ${trip.days} itinerary entries.
- Number the days sequentially, starting at 1.
- Every activity must include all six required fields.
- Every budget category must be a number, not a string.
- estimatedBudget must equal the sum of the six budget categories.
- Activity costs are estimates and should not be added to the budget a second
  time if they are already represented in the budget breakdown.
- Return valid JSON only.
`;

    // --------------------------------------------------
    // 7. GENERATE WITH GEMMA 4
    // --------------------------------------------------

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        temperature: 0.4,
      },
    });

    if (!response.text) {
      throw new Error("Gemma returned an empty response.");
    }

    // --------------------------------------------------
    // 8. PARSE AND VALIDATE THE AI RESPONSE
    // --------------------------------------------------

    const rawPlan = parseJsonResponse(response.text);

    const planValidation = tripPlanSchema.safeParse(rawPlan);

    if (!planValidation.success) {
      console.error(
        "Gemma response validation failed:",
        planValidation.error.flatten()
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The AI generated an incomplete itinerary. Please try generating it again.",
        },
        { status: 502 }
      );
    }

    const plan = planValidation.data;

    // --------------------------------------------------
    // 9. VALIDATE THE ITINERARY LENGTH
    // --------------------------------------------------

    if (plan.itinerary.length !== trip.days) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The AI generated an incorrect number of itinerary days. Please try again.",
        },
        { status: 502 }
      );
    }

    // Ensure day numbering is sequential.
    const validDayNumbers = plan.itinerary.every(
      (day, index) => day.day === index + 1
    );

    if (!validDayNumbers) {
      return NextResponse.json(
        {
          success: false,
          error: "The generated itinerary has invalid day numbering.",
        },
        { status: 502 }
      );
    }

    // --------------------------------------------------
    // 10. CALCULATE THE FINAL ESTIMATED BUDGET
    // --------------------------------------------------

    const breakdown = plan.budgetBreakdown;

    const calculatedBudget =
      breakdown.transportation +
      breakdown.accommodation +
      breakdown.food +
      breakdown.activities +
      breakdown.localTransport +
      breakdown.miscellaneous;

    // Use the calculated value instead of trusting the model's total.
    plan.estimatedBudget = calculatedBudget;

    // --------------------------------------------------
    // 11. RETURN THE PLAN TO THE FRONTEND
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      trip,
      plan,
    });
  } catch (error) {
    console.error("Trip planning API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to generate your trip right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}