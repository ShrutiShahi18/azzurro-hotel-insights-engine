import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, insightsTable, hotelsTable, reviewsTable } from "@workspace/db";
import {
  ListInsightsQueryParams,
  GenerateInsightsBody,
} from "@workspace/api-zod";
import { generateInsightsForHotel } from "../lib/insightGenerator";

const router: IRouter = Router();

router.get("/insights", async (req, res): Promise<void> => {
  const parsed = ListInsightsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { hotelId, type } = parsed.data;

  const conditions = [];
  if (hotelId != null) conditions.push(eq(insightsTable.hotelId, hotelId));
  if (type) conditions.push(eq(insightsTable.type, type));

  const rows = await db
    .select({
      id: insightsTable.id,
      hotelId: insightsTable.hotelId,
      hotelName: hotelsTable.name,
      type: insightsTable.type,
      title: insightsTable.title,
      content: insightsTable.content,
      metric: insightsTable.metric,
      createdAt: insightsTable.createdAt,
    })
    .from(insightsTable)
    .innerJoin(hotelsTable, eq(insightsTable.hotelId, hotelsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(insightsTable.createdAt));

  res.json(rows);
});

router.post("/insights/generate", async (req, res): Promise<void> => {
  const parsed = GenerateInsightsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { hotelId } = parsed.data;

  const hotel = await db
    .select()
    .from(hotelsTable)
    .where(eq(hotelsTable.id, hotelId))
    .limit(1);

  if (!hotel[0]) {
    res.status(404).json({ error: "Hotel not found" });
    return;
  }

  const recentReviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.hotelId, hotelId))
    .orderBy(desc(reviewsTable.reviewDate))
    .limit(50);

  const newInsights = await generateInsightsForHotel(hotel[0], recentReviews);

  const inserted = await db
    .insert(insightsTable)
    .values(newInsights)
    .returning();

  const withHotelName = inserted.map((ins) => ({
    ...ins,
    hotelName: hotel[0].name,
  }));

  res.json(withHotelName);
});

export default router;
