import { pgTable, serial, integer, text, real, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hotelsTable } from "./hotels";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .notNull()
    .references(() => hotelsTable.id),
  reviewerName: text("reviewer_name").notNull(),
  reviewerCountry: text("reviewer_country"),
  rating: real("rating").notNull(),
  sentiment: text("sentiment").notNull(), // positive | neutral | negative
  text: text("text").notNull(),
  positives: text("positives"),
  negatives: text("negatives"),
  stayType: text("stay_type"),
  topics: text("topics").array().notNull().default([]),
  reviewDate: date("review_date", { mode: "string" }).notNull(),
  externalId: text("external_id").unique(), // for deduplication
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
