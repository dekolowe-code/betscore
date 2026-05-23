import { pgTable, text, serial, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  targetOdd: numeric("target_odd", { precision: 6, scale: 2 }).notNull(),
  actualOdd: numeric("actual_odd", { precision: 6, scale: 2 }).notNull(),
  selections: jsonb("selections").notNull(),
  confidenceAvg: numeric("confidence_avg", { precision: 5, scale: 2 }).notNull(),
  bookmaker: text("bookmaker").notNull().default("1xBet"),
  status: text("status").notNull().default("pending"),
  level: text("level").notNull().default("standard"),
  warning: text("warning"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCouponSchema = createInsertSchema(couponsTable).omit({ id: true, createdAt: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof couponsTable.$inferSelect;
