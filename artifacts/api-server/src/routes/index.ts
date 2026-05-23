import { Router, type IRouter } from "express";
import healthRouter from "./health";
import matchesRouter from "./matches";
import couponsRouter from "./coupons";
import statsRouter from "./stats";
import leaguesRouter from "./leagues";

const router: IRouter = Router();

router.use(healthRouter);
router.use(matchesRouter);
router.use(couponsRouter);
router.use(statsRouter);
router.use(leaguesRouter);

export default router;
