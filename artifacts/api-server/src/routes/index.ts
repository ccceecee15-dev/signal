import { Router, type IRouter } from "express";
import healthRouter from "./health";
import briefingRouter from "./briefing";
import newsRouter from "./news";

const router: IRouter = Router();

router.use(healthRouter);
router.use(newsRouter);
router.use(briefingRouter);

export default router;
