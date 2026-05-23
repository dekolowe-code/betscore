import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  league: text("league").notNull(),
  country: text("country").notNull().default(""),
  kickoffAt: timestamp("kickoff_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("scheduled"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;
