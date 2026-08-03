import OpenAI from "openai";
import type { Hotel, Review, InsertInsight } from "@workspace/db";
import { logger } from "./logger";

function getOpenAIClient(): OpenAI | null {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseURL || !apiKey) return null;
  return new OpenAI({ baseURL, apiKey });
}

function buildReviewSummary(reviews: Review[]): string {
  const byRating = reviews.map((r) => `[${r.rating}/10 ${r.sentiment}] ${r.text.slice(0, 120)}`);
  return byRating.slice(0, 30).join("\n");
}

function classifySentiment(reviews: Review[]) {
  const total = reviews.length;
  const positive = reviews.filter((r) => r.sentiment === "positive").length;
  const neutral = reviews.filter((r) => r.sentiment === "neutral").length;
  const negative = reviews.filter((r) => r.sentiment === "negative").length;
  const avgRating = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : "0";
  return { total, positive, neutral, negative, avgRating };
}

function getTopicCounts(reviews: Review[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const r of reviews) {
    if (r.topics) {
      for (const t of r.topics) {
        map[t] = (map[t] ?? 0) + 1;
      }
    }
  }
  return map;
}

function generateFallbackInsights(hotel: Hotel, reviews: Review[]): InsertInsight[] {
  const stats = classifySentiment(reviews);
  const topicMap = getTopicCounts(reviews);
  const negativeReviews = reviews.filter((r) => r.sentiment === "negative");
  const topNegativeTopics = Object.entries(
    negativeReviews.flatMap((r) => r.topics ?? []).reduce<Record<string, number>>((acc, t) => {
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  const positivePercent = stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0;

  const insights: InsertInsight[] = [
    {
      hotelId: hotel.id,
      type: "summary",
      title: `Weekly Performance Summary — ${hotel.name}`,
      content: `${hotel.name} received ${stats.total} reviews with an average rating of ${stats.avgRating}/10. ${positivePercent}% of guests rated their stay positively. The most frequently mentioned topics were: ${Object.keys(topicMap).slice(0, 4).join(", ")}.`,
      metric: `${stats.avgRating}/10 avg rating`,
    },
  ];

  if (topNegativeTopics.length > 0) {
    const negPercent = stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0;
    insights.push({
      hotelId: hotel.id,
      type: "trend_alert",
      title: `Recurring Complaint Areas Detected`,
      content: `${negPercent}% of reviews are negative. The top complaint categories are: ${topNegativeTopics.join(", ")}. Addressing these areas could meaningfully improve guest satisfaction scores.`,
      metric: `${negPercent}% negative reviews`,
    });
  }

  insights.push({
    hotelId: hotel.id,
    type: "recommendation",
    title: `Operational Recommendation`,
    content: positivePercent >= 70
      ? `${hotel.name} is performing well with ${positivePercent}% positive reviews. Focus on maintaining consistency in ${Object.keys(topicMap).slice(0, 2).join(" and ")} — your strongest areas. Consider requesting reviews from satisfied guests to grow your total count.`
      : `${hotel.name} has room to improve. Priority areas based on guest feedback: ${topNegativeTopics.slice(0, 2).join(" and ")}. A targeted staff briefing on these issues could lift the average rating by 0.5–1 point within 4 weeks.`,
    metric: `${positivePercent}% positive`,
  });

  return insights;
}

export async function generateInsightsForHotel(
  hotel: Hotel,
  reviews: Review[]
): Promise<InsertInsight[]> {
  if (reviews.length === 0) {
    return [
      {
        hotelId: hotel.id,
        type: "summary",
        title: "No reviews available",
        content: "There are no reviews for this hotel yet. Import reviews first, then generate insights.",
        metric: null,
      },
    ];
  }

  const openai = getOpenAIClient();
  if (!openai) {
    logger.warn("OpenAI not configured, using fallback insight generation");
    return generateFallbackInsights(hotel, reviews);
  }

  const stats = classifySentiment(reviews);
  const positivePercent = stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0;
  const negPercent = stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0;
  const reviewSummary = buildReviewSummary(reviews);

  const prompt = `You are a hotel analytics AI. Analyse the following guest reviews for ${hotel.name} (${hotel.location}) and generate exactly 3 JSON insights.

Stats: ${stats.total} total reviews, average ${stats.avgRating}/10, ${positivePercent}% positive, ${negPercent}% negative.

Recent reviews sample:
${reviewSummary}

Return a JSON array of exactly 3 objects, each with:
- "type": one of "summary", "recommendation", "trend_alert"
- "title": short title (max 80 chars)
- "content": detailed actionable insight (2-4 sentences, specific percentages/numbers where possible)
- "metric": key metric string (e.g. "8.2/10 avg", "42% negative") or null

Include one of each type. Be specific and actionable. Reference actual topics from the reviews.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.6-luna",
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content ?? "";
    // Extract JSON array from response
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array in response");

    const parsed = JSON.parse(match[0]) as Array<{
      type: string;
      title: string;
      content: string;
      metric: string | null;
    }>;

    return parsed.map((p) => ({
      hotelId: hotel.id,
      type: p.type,
      title: p.title,
      content: p.content,
      metric: p.metric ?? null,
    }));
  } catch (err) {
    logger.error({ err }, "OpenAI insight generation failed, using fallback");
    return generateFallbackInsights(hotel, reviews);
  }
}
