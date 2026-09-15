import { Router, type IRouter } from "express";
import { eq, and, gte, sql, count, avg } from "drizzle-orm";
import { db, reviewsTable, hotelsTable } from "@workspace/db";
import {
  GetAnalyticsOverviewQueryParams,
  GetRatingTrendQueryParams,
  GetSentimentDistributionQueryParams,
  GetComplaintCategoriesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/overview", async (req, res): Promise<void> => {
  const parsed = GetAnalyticsOverviewQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { hotelId } = parsed.data;
  const whereClause = hotelId != null ? eq(reviewsTable.hotelId, hotelId) : undefined;

  const [stats, sentimentCounts] = await Promise.all([
    db
      .select({
        averageRating: avg(reviewsTable.rating),
        totalReviews: count(reviewsTable.id),
      })
      .from(reviewsTable)
      .where(whereClause),
    db
      .select({
        sentiment: reviewsTable.sentiment,
        count: count(),
      })
      .from(reviewsTable)
      .where(whereClause)
      .groupBy(reviewsTable.sentiment),
  ]);

  const total = Number(stats[0]?.totalReviews ?? 0);
  const sentimentMap = Object.fromEntries(
    sentimentCounts.map((r) => [r.sentiment, Number(r.count)])
  );
  const positive = sentimentMap["positive"] ?? 0;
  const neutral = sentimentMap["neutral"] ?? 0;
  const negative = sentimentMap["negative"] ?? 0;

  // Weekly rating change
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split("T")[0];

  const baseWhere = hotelId != null ? and(eq(reviewsTable.hotelId, hotelId), gte(reviewsTable.reviewDate, weekAgoStr)) : gte(reviewsTable.reviewDate, weekAgoStr);
  const prevWhere = hotelId != null
    ? and(eq(reviewsTable.hotelId, hotelId), gte(reviewsTable.reviewDate, twoWeeksAgoStr), sql`${reviewsTable.reviewDate} < ${weekAgoStr}`)
    : and(gte(reviewsTable.reviewDate, twoWeeksAgoStr), sql`${reviewsTable.reviewDate} < ${weekAgoStr}`);

  const [thisWeek, lastWeek] = await Promise.all([
    db.select({ avg: avg(reviewsTable.rating) }).from(reviewsTable).where(baseWhere),
    db.select({ avg: avg(reviewsTable.rating) }).from(reviewsTable).where(prevWhere),
  ]);

  const avgRating = Number(stats[0]?.averageRating ?? 0);
  const thisWeekAvg = Number(thisWeek[0]?.avg ?? avgRating);
  const lastWeekAvg = Number(lastWeek[0]?.avg ?? avgRating);

  res.json({
    averageRating: Math.round(avgRating * 10) / 10,
    weeklyRatingChange: Math.round((thisWeekAvg - lastWeekAvg) * 10) / 10,
    totalReviews: total,
    positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0,
    neutralPercent: total > 0 ? Math.round((neutral / total) * 100) : 0,
    negativePercent: total > 0 ? Math.round((negative / total) * 100) : 0,
  });
});

router.get("/analytics/rating-trend", async (req, res): Promise<void> => {
  const parsed = GetRatingTrendQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { hotelId, months = 12 } = parsed.data;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const baseConditions = [gte(reviewsTable.reviewDate, cutoffStr)];
  if (hotelId != null) baseConditions.push(eq(reviewsTable.hotelId, hotelId));

  const rows = await db
    .select({
      month: sql<string>`to_char(${reviewsTable.reviewDate}::date, 'YYYY-MM')`,
      hotelId: reviewsTable.hotelId,
      hotelName: hotelsTable.name,
      averageRating: avg(reviewsTable.rating),
      reviewCount: count(reviewsTable.id),
    })
    .from(reviewsTable)
    .innerJoin(hotelsTable, eq(reviewsTable.hotelId, hotelsTable.id))
    .where(and(...baseConditions))
    .groupBy(
      sql`to_char(${reviewsTable.reviewDate}::date, 'YYYY-MM')`,
      reviewsTable.hotelId,
      hotelsTable.name
    )
    .orderBy(sql`to_char(${reviewsTable.reviewDate}::date, 'YYYY-MM')`, reviewsTable.hotelId);

  res.json(
    rows.map((r) => ({
      ...r,
      averageRating: Math.round(Number(r.averageRating) * 10) / 10,
      reviewCount: Number(r.reviewCount),
    }))
  );
});

router.get("/analytics/hotel-comparison", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      hotelId: reviewsTable.hotelId,
      hotelName: hotelsTable.name,
      averageRating: avg(reviewsTable.rating),
      totalReviews: count(reviewsTable.id),
    })
    .from(reviewsTable)
    .innerJoin(hotelsTable, eq(reviewsTable.hotelId, hotelsTable.id))
    .groupBy(reviewsTable.hotelId, hotelsTable.name)
    .orderBy(reviewsTable.hotelId);

  const positiveRows = await db
    .select({
      hotelId: reviewsTable.hotelId,
      positiveCount: count(),
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.sentiment, "positive"))
    .groupBy(reviewsTable.hotelId);

  const positiveMap = Object.fromEntries(
    positiveRows.map((r) => [r.hotelId, Number(r.positiveCount)])
  );

  res.json(
    rows.map((r) => {
      const total = Number(r.totalReviews);
      const positive = positiveMap[r.hotelId] ?? 0;
      return {
        hotelId: r.hotelId,
        hotelName: r.hotelName,
        averageRating: Math.round(Number(r.averageRating) * 10) / 10,
        totalReviews: total,
        positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0,
        responseRate: Math.round(65 + Math.random() * 25), // Simulated response rate
      };
    })
  );
});

router.get("/analytics/sentiment-distribution", async (req, res): Promise<void> => {
  const parsed = GetSentimentDistributionQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { hotelId } = parsed.data;

  const hotels = hotelId != null
    ? await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId))
    : await db.select().from(hotelsTable).orderBy(hotelsTable.id);

  const result = await Promise.all(
    hotels.map(async (hotel) => {
      const rows = await db
        .select({ sentiment: reviewsTable.sentiment, count: count() })
        .from(reviewsTable)
        .where(eq(reviewsTable.hotelId, hotel.id))
        .groupBy(reviewsTable.sentiment);

      const map = Object.fromEntries(rows.map((r) => [r.sentiment, Number(r.count)]));
      return {
        hotelId: hotel.id,
        hotelName: hotel.name,
        positive: map["positive"] ?? 0,
        neutral: map["neutral"] ?? 0,
        negative: map["negative"] ?? 0,
      };
    })
  );

  res.json(result);
});

router.get("/analytics/complaint-categories", async (req, res): Promise<void> => {
  const parsed = GetComplaintCategoriesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { hotelId } = parsed.data;
  const whereClause = hotelId != null
    ? and(eq(reviewsTable.hotelId, hotelId), eq(reviewsTable.sentiment, "negative"))
    : eq(reviewsTable.sentiment, "negative");

  // Unnest topics array and count occurrences
  const rows = await db.execute(
    sql`
      SELECT
        unnest(topics) as category,
        count(*)::int as count
      FROM reviews
      WHERE sentiment = 'negative'
        ${hotelId != null ? sql`AND hotel_id = ${hotelId}` : sql``}
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `
  );

  const data = rows.rows as Array<{ category: string; count: number }>;
  const total = data.reduce((sum, r) => sum + r.count, 0);

  res.json(
    data.map((r) => ({
      category: r.category,
      count: r.count,
      percent: total > 0 ? Math.round((r.count / total) * 100) : 0,
      hotelId: hotelId ?? null,
    }))
  );
});

export default router;
