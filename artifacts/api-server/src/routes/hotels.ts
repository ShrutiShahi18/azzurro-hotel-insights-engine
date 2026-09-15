import { Router, type IRouter } from "express";
import { eq, avg, count, sql } from "drizzle-orm";
import { db, hotelsTable, reviewsTable } from "@workspace/db";
import {
  GetHotelParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/hotels", async (req, res): Promise<void> => {
  const hotels = await db
    .select()
    .from(hotelsTable)
    .orderBy(hotelsTable.id);
  res.json(hotels);
});

router.get("/hotels/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetHotelParams.safeParse({ id: Number(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const hotel = await db
    .select()
    .from(hotelsTable)
    .where(eq(hotelsTable.id, params.data.id))
    .limit(1);

  if (!hotel[0]) {
    res.status(404).json({ error: "Hotel not found" });
    return;
  }

  // Compute aggregated stats
  const stats = await db
    .select({
      averageRating: avg(reviewsTable.rating),
      totalReviews: count(reviewsTable.id),
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.hotelId, params.data.id));

  const positiveCount = await db
    .select({ count: count() })
    .from(reviewsTable)
    .where(
      sql`${reviewsTable.hotelId} = ${params.data.id} AND ${reviewsTable.sentiment} = 'positive'`
    );

  // Weekly rating change: compare last 7 days vs prior 7 days
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeek = await db
    .select({ avg: avg(reviewsTable.rating) })
    .from(reviewsTable)
    .where(
      sql`${reviewsTable.hotelId} = ${params.data.id} AND ${reviewsTable.reviewDate} >= ${weekAgo.toISOString().split("T")[0]}`
    );

  const lastWeek = await db
    .select({ avg: avg(reviewsTable.rating) })
    .from(reviewsTable)
    .where(
      sql`${reviewsTable.hotelId} = ${params.data.id} AND ${reviewsTable.reviewDate} >= ${twoWeeksAgo.toISOString().split("T")[0]} AND ${reviewsTable.reviewDate} < ${weekAgo.toISOString().split("T")[0]}`
    );

  const total = Number(stats[0]?.totalReviews ?? 0);
  const positive = Number(positiveCount[0]?.count ?? 0);
  const avgRating = Number(stats[0]?.averageRating ?? 0);
  const thisWeekAvg = Number(thisWeek[0]?.avg ?? avgRating);
  const lastWeekAvg = Number(lastWeek[0]?.avg ?? avgRating);

  res.json({
    ...hotel[0],
    averageRating: Math.round(avgRating * 10) / 10,
    totalReviews: total,
    positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0,
    weeklyRatingChange: Math.round((thisWeekAvg - lastWeekAvg) * 10) / 10,
  });
});

export default router;
