import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { gameSessionsTable, gameMessagesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  CreateGameSessionBody,
  GetGameSessionParams,
  UpdateGameSessionParams,
  UpdateGameSessionBody,
  DeleteGameSessionParams,
} from "@workspace/api-zod";
import type { GameStats } from "@workspace/db";

const router = Router();

const defaultStats: GameStats = {
  influence: 50,
  wealth: 50,
  trust: 50,
  reputation: 50,
  stability: 50,
  desire: 50,
  risk: 30,
};

router.get("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const sessions = await db
    .select()
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.userId, userId))
    .orderBy(desc(gameSessionsTable.updatedAt));

  return res.json(
    sessions.map((s) => ({
      ...s,
      stats: s.stats as GameStats,
    }))
  );
});

router.post("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateGameSessionBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { scenarioId, scenarioTitle, paceMode, customPremise } = parsed.data;

  const [session] = await db
    .insert(gameSessionsTable)
    .values({
      userId,
      scenarioId,
      scenarioTitle,
      paceMode,
      customPremise: customPremise ?? null,
      status: "active",
      stats: defaultStats,
    })
    .returning();

  return res.status(201).json({ ...session, stats: session.stats as GameStats });
});

router.get("/:id", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const params = GetGameSessionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [session] = await db
    .select()
    .from(gameSessionsTable)
    .where(and(eq(gameSessionsTable.id, params.data.id), eq(gameSessionsTable.userId, userId)));

  if (!session) return res.status(404).json({ error: "Session not found" });

  const messages = await db
    .select()
    .from(gameMessagesTable)
    .where(eq(gameMessagesTable.sessionId, session.id))
    .orderBy(gameMessagesTable.createdAt);

  return res.json({
    ...session,
    stats: session.stats as GameStats,
    messages,
  });
});

router.patch("/:id", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const params = UpdateGameSessionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const body = UpdateGameSessionBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  const [existing] = await db
    .select()
    .from(gameSessionsTable)
    .where(and(eq(gameSessionsTable.id, params.data.id), eq(gameSessionsTable.userId, userId)));
  if (!existing) return res.status(404).json({ error: "Session not found" });

  const updateData: Partial<typeof gameSessionsTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (body.data.stats) updateData.stats = body.data.stats as GameStats;
  if (body.data.storySummary !== undefined) updateData.storySummary = body.data.storySummary;
  if (body.data.hiddenNotes !== undefined) updateData.hiddenNotes = body.data.hiddenNotes;
  if (body.data.status !== undefined) updateData.status = body.data.status;

  const [updated] = await db
    .update(gameSessionsTable)
    .set(updateData)
    .where(eq(gameSessionsTable.id, params.data.id))
    .returning();

  return res.json({ ...updated, stats: updated.stats as GameStats });
});

router.delete("/:id", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const params = DeleteGameSessionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [existing] = await db
    .select()
    .from(gameSessionsTable)
    .where(and(eq(gameSessionsTable.id, params.data.id), eq(gameSessionsTable.userId, userId)));
  if (!existing) return res.status(404).json({ error: "Session not found" });

  await db.delete(gameMessagesTable).where(eq(gameMessagesTable.sessionId, params.data.id));
  await db.delete(gameSessionsTable).where(eq(gameSessionsTable.id, params.data.id));

  return res.status(204).send();
});

export default router;
