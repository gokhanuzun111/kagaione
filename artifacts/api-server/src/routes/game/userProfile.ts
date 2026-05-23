import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateUserProfileBody } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  let [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));

  if (!profile) {
    [profile] = await db
      .insert(userProfilesTable)
      .values({
        userId,
        soundEnabled: true,
        maturityLevel: "medium",
        narrativePace: "daily",
        tier: "free",
      })
      .returning();
  }

  return res.json(profile);
});

router.patch("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const body = UpdateUserProfileBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  let [existing] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));

  if (!existing) {
    [existing] = await db
      .insert(userProfilesTable)
      .values({
        userId,
        soundEnabled: true,
        maturityLevel: "medium",
        narrativePace: "daily",
        tier: "free",
      })
      .returning();
  }

  const [updated] = await db
    .update(userProfilesTable)
    .set({ ...body.data })
    .where(eq(userProfilesTable.userId, userId))
    .returning();

  return res.json(updated);
});

export default router;
