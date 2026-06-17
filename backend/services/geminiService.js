import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildEmissionContext, calculateScores, getUserActivities } from "./analyticsService.js";

let genAI = null;

function getGemini() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Build a context-rich system prompt for the Carbon Coach.
 */
function buildCoachPrompt(context, userMessage) {
  const breakdownLines = Object.entries(context.breakdown)
    .map(([cat, pct]) => `${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${pct}%`)
    .join("\n");

  return `You are Carbon Coach, an expert sustainability advisor for CarbonTrack.

User Profile:
- Name: ${context.userName}
- Country: ${context.country}
- Sustainability Goal: ${context.goal}
- Annual Target: ${context.annualTarget} kg CO2e

Emission Breakdown (last 30 days):
${breakdownLines || "No data yet"}

Trend: ${context.trend}
Top Emission Sources: ${context.topSources.join(", ") || "None logged"}
Total Recent Emissions: ${context.totalRecentKg} kg CO2e

Provide personalized, actionable sustainability advice. Be concise, friendly, and specific.
Reference the user's data when relevant. Suggest concrete next steps.
Keep responses under 200 words unless the user asks for detail.

User question: ${userMessage}`;
}

function isGeminiQuotaError(error) {
  const message = String(error?.message || "");
  return message.includes("429") || message.toLowerCase().includes("quota");
}

function buildCoachFallbackAnswer(context, userMessage) {
  const topCategory = Object.entries(context.breakdown).sort((a, b) => b[1] - a[1])[0];
  const category = topCategory ? topCategory[0] : "transportation";

  return [
    "I’m having trouble reaching the AI service right now, but I can still help based on your logged activity.",
    `Your biggest impact area appears to be ${category}.`,
    `For "${userMessage}", try one small change this week: reduce ${category} by 10%, swap one meal to plant-based, or log activities daily to spot patterns.`,
    `You have ${context.activityCount} recent activities and ${context.totalRecentKg} kg CO2e logged in the last 30 days.`
  ].join(" ");
}

/**
 * Generate a Carbon Coach response using Gemini.
 */
export async function generateCoachResponse(user, userMessage) {
  const activities = await getUserActivities(user.firebaseUID);
  const context = buildEmissionContext(user, activities);
  const prompt = buildCoachPrompt(context, userMessage);

  if (!process.env.GEMINI_API_KEY) {
    return {
      answer: buildCoachFallbackAnswer(context, userMessage),
      context,
      aiGenerated: false
    };
  }

  try {
    const model = getGemini().getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return { answer: text, context, aiGenerated: true };
  } catch (error) {
    if (isGeminiQuotaError(error)) {
      console.warn("Gemini quota reached, using fallback Carbon Coach response.");
    } else {
      console.warn("Gemini request failed, using fallback Carbon Coach response.");
    }

    return {
      answer: buildCoachFallbackAnswer(context, userMessage),
      context,
      aiGenerated: false
    };
  }
}

/**
 * Generate AI insights for the dashboard.
 */
export async function generateInsights(user) {
  const activities = await getUserActivities(user.firebaseUID);
  const context = buildEmissionContext(user, activities);
  const scores = calculateScores(user, activities);

  const fallback = buildFallbackInsights(context, scores);

  if (!process.env.GEMINI_API_KEY) {
    return { ...fallback, aiGenerated: false };
  }

  try {
    const prompt = `You are a sustainability analyst. Based on this user data, generate JSON with these fields:
- weeklySummary (1-2 sentences)
- monthlySummary (1-2 sentences)
- topOpportunities (array of 3 strings)
- predictedSavings (string describing kg CO2e savings potential)
- recommendation (1 actionable tip)

User: ${context.userName}
Breakdown: ${JSON.stringify(context.breakdown)}
Trend: ${context.trend}
Carbon Score: ${scores.carbonScore}/100
Sustainability Score: ${scores.sustainabilityScore}/100
Annual Pace: ${scores.annualPace} kg

Respond ONLY with valid JSON, no markdown.`;

    const model = getGemini().getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(text);

    return {
      weeklySummary: parsed.weeklySummary || fallback.weeklySummary,
      monthlySummary: parsed.monthlySummary || fallback.monthlySummary,
      topOpportunities: parsed.topOpportunities || fallback.topOpportunities,
      predictedSavings: parsed.predictedSavings || fallback.predictedSavings,
      recommendation: parsed.recommendation || fallback.recommendation,
      carbonScore: scores.carbonScore,
      sustainabilityScore: scores.sustainabilityScore,
      annualPace: scores.annualPace,
      weeklyTotal: scores.weeklyTotal,
      monthlyTotal: scores.monthlyTotal,
      breakdown: context.breakdown,
      trend: context.trend,
      aiGenerated: true
    };
  } catch {
    return { ...fallback, aiGenerated: false };
  }
}

function buildFallbackInsights(context, scores) {
  const topCategory = Object.entries(context.breakdown).sort((a, b) => b[1] - a[1])[0];
  const catName = topCategory ? topCategory[0] : "transportation";

  return {
    weeklySummary: `Your emissions trend is ${context.trend.toLowerCase()} this week with ${context.totalRecentKg} kg logged recently.`,
    monthlySummary: `You have ${context.activityCount} activities logged in the last 30 days. Focus on reducing ${catName} emissions.`,
    topOpportunities: [
      `Reduce ${catName} usage by 10%`,
      "Switch one meal per week to plant-based",
      "Log activities daily for better tracking"
    ],
    predictedSavings: `Up to ${Math.round(scores.annualPace * 0.15)} kg CO2e annually with moderate changes`,
    recommendation: `Your biggest impact area is ${catName}. Start with small, consistent changes.`,
    carbonScore: scores.carbonScore,
    sustainabilityScore: scores.sustainabilityScore,
    annualPace: scores.annualPace,
    weeklyTotal: scores.weeklyTotal,
    monthlyTotal: scores.monthlyTotal,
    breakdown: context.breakdown,
    trend: context.trend
  };
}

/**
 * Suggested questions for the Carbon Coach chat interface.
 */
export function getSuggestedQuestions(context) {
  const top = Object.entries(context.breakdown).sort((a, b) => b[1] - a[1])[0];
  const category = top ? top[0] : "transportation";

  return [
    `How can I reduce my ${category} emissions?`,
    "What's my biggest improvement opportunity?",
    "Am I on track for my annual target?",
    "Suggest 3 easy changes for this week"
  ];
}
