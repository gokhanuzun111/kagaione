import { Router } from "express";
import sessionsRouter from "./sessions";
import narrateRouter from "./narrate";
import messagesRouter from "./messages";
import worldFeedRouter from "./worldFeed";
import userProfileRouter from "./userProfile";

const router = Router();

router.use("/sessions", sessionsRouter);
router.use("/sessions/:id/narrate", narrateRouter);
router.use("/sessions/:id/messages", messagesRouter);
router.use("/world-feed", worldFeedRouter);
router.use("/user-profile", userProfileRouter);

export default router;
