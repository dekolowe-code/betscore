import { Router } from "express";
import { db, couponsTable, matchesTable, predictionsTable } from "@workspace/db";
import { desc, eq, gte, sql } from "drizzle-orm";
import { GenerateCouponBody } from "@workspace/api-zod";

const router = Router();

function buildCoupon(
  predictions: Array<{
    matchId: number;
    homeTeam: string;
    awayTeam: string;
    market: string;
    marketLabel: string;
    selection: string;
    selectionLabel: string;
    oddValue: number;
    confidence: number;
    reasoning: string;
  }>,
  targetOdd: number,
  tolerance: number,
  minConfidence: number,
  level: string,
  bookmaker: string,
  idOffset: number
) {
  const candidates = predictions
    .filter((p) => p.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence);

  const selected: typeof candidates = [];
  let currentOdd = 1.0;

  for (const candidate of candidates) {
    if (currentOdd * candidate.oddValue <= targetOdd + tolerance) {
      selected.push(candidate);
      currentOdd *= candidate.oddValue;
    }
    if (Math.abs(currentOdd - targetOdd) <= tolerance) break;
  }

  const confidenceAvg =
    selected.length > 0
      ? selected.reduce((s, p) => s + p.confidence, 0) / selected.length
      : 0;

  const warning =
    Math.abs(currentOdd - targetOdd) > tolerance
      ? `Cote obtenue (${currentOdd.toFixed(2)}) s'écarte de la cible (${targetOdd})`
      : null;

  return {
    id: idOffset,
    targetOdd,
    actualOdd: parseFloat(currentOdd.toFixed(2)),
    selections: selected,
    confidenceAvg: parseFloat(confidenceAvg.toFixed(1)),
    bookmaker,
    status: "pending",
    level,
    warning,
    createdAt: new Date().toISOString(),
  };
}

function couponDbToResponse(c: typeof couponsTable.$inferSelect) {
  return {
    id: c.id,
    targetOdd: parseFloat(c.targetOdd as string),
    actualOdd: parseFloat(c.actualOdd as string),
    selections: c.selections as any[],
    confidenceAvg: parseFloat(c.confidenceAvg as string),
    bookmaker: c.bookmaker,
    status: c.status as "pending" | "won" | "lost",
    level: c.level as "prudent" | "standard" | "risque",
    warning: c.warning ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.post("/coupons/generate", async (req, res) => {
  const parseResult = GenerateCouponBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { targetOdd, bookmaker } = parseResult.data;
  const bm = bookmaker ?? "1xBet";

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const rows = await db
    .select({
      matchId: matchesTable.id,
      homeTeam: matchesTable.homeTeam,
      awayTeam: matchesTable.awayTeam,
      market: predictionsTable.market,
      marketLabel: predictionsTable.marketLabel,
      selection: predictionsTable.selection,
      selectionLabel: predictionsTable.selectionLabel,
      oddValue: predictionsTable.oddValue,
      confidence: predictionsTable.confidence,
      reasoning: predictionsTable.reasoning,
    })
    .from(predictionsTable)
    .innerJoin(matchesTable, eq(predictionsTable.matchId, matchesTable.id))
    .where(gte(matchesTable.kickoffAt, startOfDay));

  const preds = rows.map((r) => ({
    matchId: r.matchId,
    homeTeam: r.homeTeam,
    awayTeam: r.awayTeam,
    market: r.market,
    marketLabel: r.marketLabel,
    selection: r.selection,
    selectionLabel: r.selectionLabel,
    oddValue: parseFloat(r.oddValue as string),
    confidence: parseFloat(r.confidence as string),
    reasoning: r.reasoning,
  }));

  const prudent = buildCoupon(preds, targetOdd, 0.3, 75, "prudent", bm, 1);
  const standard = buildCoupon(preds, targetOdd, 0.5, 65, "standard", bm, 2);
  const risque = buildCoupon(preds, targetOdd, 1.0, 55, "risque", bm, 3);

  res.json({ prudent, standard, risque });
});

router.get("/coupons/today", async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const coupons = await db
    .select()
    .from(couponsTable)
    .where(gte(couponsTable.createdAt, startOfDay))
    .orderBy(desc(couponsTable.createdAt))
    .limit(10);

  res.json(coupons.map(couponDbToResponse));
});

router.get("/coupons/history", async (req, res) => {
  const coupons = await db
    .select()
    .from(couponsTable)
    .orderBy(desc(couponsTable.createdAt))
    .limit(50);

  res.json(coupons.map(couponDbToResponse));
});

export default router;
