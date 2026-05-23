import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { worldFeedEventsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const WORLD_USERNAMES = ["NOX_17", "KAIR0", "VANTA", "SOLACE", "MIRA_9", "ECHO"];

router.get("/", async (req, res) => {
  const events = await db
    .select()
    .from(worldFeedEventsTable)
    .orderBy(desc(worldFeedEventsTable.createdAt))
    .limit(20);
  return res.json(events);
});

router.post("/generate", requireAuth(), async (req, res) => {
  const context = req.body?.context ?? null;

  const username = WORLD_USERNAMES[Math.floor(Math.random() * WORLD_USERNAMES.length)];

  const prompt = `Generate a single mysterious world-feed event for a cinematic narrative simulation. 
The event is attributed to username "${username}".
It should hint at power moves, secrets, influence, or hidden-world dynamics — never violence.
Keep it under 15 words. Be cryptic and cinematic.
Context: ${context ?? "general world simulation"}
Output only the event text, nothing else.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 60,
      messages: [{ role: "user", content: prompt }],
    });

    const eventText = completion.choices[0]?.message?.content?.trim() ?? `${username} made a quiet move.`;

    const impacts = ["low", "medium", "high"] as const;
    const impact = impacts[Math.floor(Math.random() * 3)];

    const [event] = await db
      .insert(worldFeedEventsTable)
      .values({ username, eventText, impact })
      .returning();

    return res.status(201).json(event);
  } catch {
    const fallbackEvents = [
      "released a statement that changed the market mood.",
      "made a private move. Its effect is not yet visible.",
      "gained influence inside the circle.",
      "started a quiet campaign.",
      "disappeared from the public channel.",
      "secured an alliance no one expected.",
    ];
    const eventText = `${username} ${fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)]}`;
    const [event] = await db
      .insert(worldFeedEventsTable)
      .values({ username, eventText, impact: "medium" })
      .returning();
    return res.status(201).json(event);
  }
});

export default router;
