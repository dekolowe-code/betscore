import { Router } from "express";
import { db, leaguesTable, matchesTable } from "@workspace/db";
import { eq, gte, and, lt } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/leagues", async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const leagues = await db.select().from(leaguesTable);

  const counts = await db
    .select({
      league: matchesTable.league,
      count: sql<number>`count(*)::int`,
    })
    .from(matchesTable)
    .where(and(gte(matchesTable.kickoffAt, startOfDay), lt(matchesTable.kickoffAt, endOfDay)))
    .groupBy(matchesTable.league);

  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.league] = c.count;

  const result = leagues.map((l) => ({
    id: l.id,
    name: l.name,
    country: l.country,
    matchCount: countMap[l.name] ?? 0,
    logo: l.logo,
  }));

  res.json(result);
});

export default router;
