import { Router, type IRouter } from "express";
import healthRouter from "./health";
import hotelsRouter from "./hotels";
import reviewsRouter from "./reviews";
import analyticsRouter from "./analytics";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(hotelsRouter);
router.use(reviewsRouter);
router.use(analyticsRouter);
router.use(insightsRouter);

export default router;
