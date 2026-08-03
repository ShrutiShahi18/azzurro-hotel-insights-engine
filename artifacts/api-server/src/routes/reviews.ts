import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike, sql, desc, count } from "drizzle-orm";
import { db, reviewsTable, hotelsTable } from "@workspace/db";
import {
  ListReviewsQueryParams,
  GetReviewParams,
  ImportReviewsBody,
} from "@workspace/api-zod";
import { generateReviews } from "../lib/reviewGenerator";

const router: IRouter = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const parsed = ListReviewsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { hotelId, sentiment, search, dateFrom, dateTo, page = 1, pageSize = 20 } = parsed.data;

  const conditions = [];
  if (hotelId != null) conditions.push(eq(reviewsTable.hotelId, hotelId));
  if (sentiment) conditions.push(eq(reviewsTable.sentiment, sentiment));
  if (search) conditions.push(ilike(reviewsTable.text, `%${search}%`));
  if (dateFrom) conditions.push(gte(reviewsTable.reviewDate, dateFrom));
  if (dateTo) conditions.push(lte(reviewsTable.reviewDate, dateTo));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, rows] = await Promise.all([
    db.select({ count: count() }).from(reviewsTable).where(whereClause),
    db
      .select({
        id: reviewsTable.id,
        hotelId: reviewsTable.hotelId,
        hotelName: hotelsTable.name,
        reviewerName: reviewsTable.reviewerName,
        reviewerCountry: reviewsTable.reviewerCountry,
        rating: reviewsTable.rating,
        sentiment: reviewsTable.sentiment,
        text: reviewsTable.text,
        positives: reviewsTable.positives,
        negatives: reviewsTable.negatives,
        stayType: reviewsTable.stayType,
        topics: reviewsTable.topics,
        reviewDate: reviewsTable.reviewDate,
        createdAt: reviewsTable.createdAt,
      })
      .from(reviewsTable)
      .innerJoin(hotelsTable, eq(reviewsTable.hotelId, hotelsTable.id))
      .where(whereClause)
      .orderBy(desc(reviewsTable.reviewDate))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);

  res.json({
    reviews: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

router.post("/reviews/import", async (req, res): Promise<void> => {
  const parsed = ImportReviewsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { hotelId, count: reviewCount = 50 } = parsed.data;

  const hotel = await db
    .select()
    .from(hotelsTable)
    .where(eq(hotelsTable.id, hotelId))
    .limit(1);

  if (!hotel[0]) {
    res.status(404).json({ error: "Hotel not found" });
    return;
  }

  const generated = generateReviews(hotel[0], reviewCount);
  let inserted = 0;
  let skipped = 0;

  for (const review of generated) {
    try {
      await db.insert(reviewsTable).values(review).onConflictDoNothing({ target: reviewsTable.externalId });
      inserted++;
    } catch {
      skipped++;
    }
  }

  res.json({ inserted, skipped, total: generated.length });
});

router.get("/reviews/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetReviewParams.safeParse({ id: Number(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      id: reviewsTable.id,
      hotelId: reviewsTable.hotelId,
      hotelName: hotelsTable.name,
      reviewerName: reviewsTable.reviewerName,
      reviewerCountry: reviewsTable.reviewerCountry,
      rating: reviewsTable.rating,
      sentiment: reviewsTable.sentiment,
      text: reviewsTable.text,
      positives: reviewsTable.positives,
      negatives: reviewsTable.negatives,
      stayType: reviewsTable.stayType,
      topics: reviewsTable.topics,
      reviewDate: reviewsTable.reviewDate,
      createdAt: reviewsTable.createdAt,
    })
    .from(reviewsTable)
    .innerJoin(hotelsTable, eq(reviewsTable.hotelId, hotelsTable.id))
    .where(eq(reviewsTable.id, params.data.id))
    .limit(1);

  if (!rows[0]) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  res.json(rows[0]);
});

export default router;
