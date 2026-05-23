import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { matchesTable } from "./matches";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matchesTable.id),
  market: text("market").notNull(),
  marketLabel: text("market_label").notNull().default(""),
  selection: text("selection").notNull(),
  selectionLabel: text("selection_label").notNull().default(""),
  confidence: numeric("confidence", { precision: 5, scale: 2 }).notNull(),
  reasoning: text("reasoning").notNull().default(""),
  oddValue: numeric("odd_value", { precision: 6, scale: 2 }).notNull(),
  isValueBet: boolean("is_value_bet").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true, createdAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
