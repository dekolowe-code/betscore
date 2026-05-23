import { Router } from "express";
import { db, matchesTable, predictionsTable } from "@workspace/db";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import {
  GetTodaysMatchesQueryParams,
  GetMatchParams,
  GetMatchAnalysisParams,
} from "@workspace/api-zod";

const router = Router();

function toMatchResponse(match: typeof matchesTable.$inferSelect, topPrediction?: typeof predictionsTable.$inferSelect) {
  return {
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
    country: match.country,
    kickoffAt: match.kickoffAt.toISOString(),
    status: match.status,
    homeScore: match.homeScore ?? null,
    awayScore: match.awayScore ?? null,
    topPrediction: topPrediction?.selectionLabel ?? topPrediction?.selection ?? "Analyse en cours",
    topOdd: topPrediction ? parseFloat(topPrediction.oddValue as string) : 1.5,
    confidence: topPrediction ? parseFloat(topPrediction.confidence as string) : 0,
    isValueBet: topPrediction?.isValueBet ?? false,
  };
}

router.get("/matches/today", async (req, res) => {
  const parseResult = GetTodaysMatchesQueryParams.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { league, status } = parseResult.data;
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const conditions = [
    gte(matchesTable.kickoffAt, startOfDay),
    lt(matchesTable.kickoffAt, endOfDay),
  ];

  if (status) conditions.push(eq(matchesTable.status, status));
  if (league) conditions.push(eq(matchesTable.league, league));

  const matches = await db
    .select()
    .from(matchesTable)
    .where(and(...conditions))
    .orderBy(matchesTable.kickoffAt);

  const matchIds = matches.map((m) => m.id);
  let predictions: (typeof predictionsTable.$inferSelect)[] = [];
  if (matchIds.length > 0) {
    predictions = await db
      .select()
      .from(predictionsTable)
      .where(sql`${predictionsTable.matchId} = ANY(ARRAY[${sql.join(matchIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      .orderBy(predictionsTable.confidence);
  }

  const predByMatch: Record<number, typeof predictionsTable.$inferSelect> = {};
  for (const p of predictions) {
    if (!predByMatch[p.matchId] || parseFloat(p.confidence as string) > parseFloat(predByMatch[p.matchId].confidence as string)) {
      predByMatch[p.matchId] = p;
    }
  }

  const result = matches.map((m) => toMatchResponse(m, predByMatch[m.id]));
  res.json(result);
});

router.get("/matches/:id", async (req, res) => {
  const parseResult = GetMatchParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const match = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.id, parseResult.data.id))
    .limit(1);

  if (!match[0]) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const predictions = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.matchId, parseResult.data.id))
    .orderBy(predictionsTable.confidence);

  const topPred = predictions.reduce<typeof predictionsTable.$inferSelect | undefined>((best, p) => {
    if (!best || parseFloat(p.confidence as string) > parseFloat(best.confidence as string)) return p;
    return best;
  }, undefined);

  res.json({
    ...toMatchResponse(match[0], topPred),
    homeForm: "WDWWL",
    awayForm: "LWWDW",
    predictions: predictions.map((p) => ({
      market: p.market,
      marketLabel: p.marketLabel,
      selection: p.selection,
      selectionLabel: p.selectionLabel,
      confidence: parseFloat(p.confidence as string),
      reasoning: p.reasoning,
      oddValue: parseFloat(p.oddValue as string),
      isValueBet: p.isValueBet,
    })),
    odds: predictions.map((p) => ({
      bookmaker: "1xBet",
      market: p.market,
      selection: p.selection,
      oddValue: parseFloat(p.oddValue as string),
    })),
  });
});

router.get("/matches/:id/analysis", async (req, res) => {
  const parseResult = GetMatchAnalysisParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const predictions = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.matchId, parseResult.data.id))
    .orderBy(predictionsTable.confidence);

  if (predictions.length === 0) {
    res.status(404).json({ error: "No analysis found" });
    return;
  }

  res.json(
    predictions.map((p) => ({
      market: p.market,
      marketLabel: p.marketLabel,
      selection: p.selection,
      selectionLabel: p.selectionLabel,
      confidence: parseFloat(p.confidence as string),
      reasoning: p.reasoning,
      oddValue: parseFloat(p.oddValue as string),
      isValueBet: p.isValueBet,
    }))
  );
});

export default router;
