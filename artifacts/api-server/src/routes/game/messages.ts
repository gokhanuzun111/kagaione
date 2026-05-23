import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { gameMessagesTable, gameSessionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListGameMessagesParams } from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const params = ListGameMessagesParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [session] = await db
    .select()
    .from(gameSessionsTable)
    .where(and(eq(gameSessionsTable.id, params.data.id), eq(gameSessionsTable.userId, userId)));

  if (!session) return res.status(404).json({ error: "Session not found" });

  const messages = await db
    .select()
    .from(gameMessagesTable)
    .where(eq(gameMessagesTable.sessionId, params.data.id))
    .orderBy(gameMessagesTable.createdAt);

  return res.json(messages);
});

export default router;
