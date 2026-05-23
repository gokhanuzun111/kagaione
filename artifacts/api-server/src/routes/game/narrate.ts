import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { gameSessionsTable, gameMessagesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { NarrateGameActionParams, NarrateGameActionBody } from "@workspace/api-zod";
import type { GameStats } from "@workspace/db";

const router = Router({ mergeParams: true });

const SYSTEM_PROMPT = `You are KAGAIONE — a cinematic narrator, world simulation engine, hidden-role orchestrator, psychological tension designer, and non-violent adult narrative controller.

You narrate immersive, cinematic stories for adult players. You maintain:
- Premium, literary prose — think prestige TV drama, not pulp fiction
- Psychological tension: power, status, ambition, secrecy, betrayal, desire, consequence
- Hidden-world mechanics: reference fictional player usernames (NOX_17, KAIR0, VANTA, SOLACE, MIRA_9, ECHO) occasionally in the narrative as mysterious forces
- Stats tracking: after narrating, always end your response with a JSON block updating stats

CONTENT RULES (strictly enforced):
- NO physical violence, gore, weapons, or killing
- NO sexual content involving minors
- NO explicit pornography — adult romance/tension must stay cinematic and emotional
- YES to: psychological tension, power games, secrets, betrayal, ambition, relationship drama, ethical dilemmas, adult desire

RESPONSE FORMAT:
1. Narrate 2-4 paragraphs of cinematic story continuation based on the player's action
2. End with this exact JSON block (no markdown):
---KAGAIONE_DATA---
{"choices":["Choice 1","Choice 2","Choice 3","Choice 4"],"stats_delta":{"influence":0,"wealth":0,"trust":0,"reputation":0,"stability":0,"desire":0,"risk":0},"world_event":null}
---END_DATA---

The choices should feel consequential and morally complex. stats_delta values are integers between -15 and +15. world_event is either null or a short string like "VANTA made a quiet move in the shadows." that hints at hidden-world events.`;

function buildStatsDelta(current: GameStats, delta: Partial<GameStats>): GameStats {
  return {
    influence: Math.max(0, Math.min(100, current.influence + (delta.influence ?? 0))),
    wealth: Math.max(0, Math.min(100, current.wealth + (delta.wealth ?? 0))),
    trust: Math.max(0, Math.min(100, current.trust + (delta.trust ?? 0))),
    reputation: Math.max(0, Math.min(100, current.reputation + (delta.reputation ?? 0))),
    stability: Math.max(0, Math.min(100, current.stability + (delta.stability ?? 0))),
    desire: Math.max(0, Math.min(100, current.desire + (delta.desire ?? 0))),
    risk: Math.max(0, Math.min(100, current.risk + (delta.risk ?? 0))),
  };
}

router.post("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const params = NarrateGameActionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const body = NarrateGameActionBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  const [session] = await db
    .select()
    .from(gameSessionsTable)
    .where(and(eq(gameSessionsTable.id, params.data.id), eq(gameSessionsTable.userId, userId)));

  if (!session) return res.status(404).json({ error: "Session not found" });

  const recentMessages = await db
    .select()
    .from(gameMessagesTable)
    .where(eq(gameMessagesTable.sessionId, session.id))
    .orderBy(desc(gameMessagesTable.createdAt))
    .limit(20);

  const messageHistory = recentMessages.reverse().map((m) => ({
    role: m.role === "narrator" ? "assistant" : "user",
    content: m.content,
  })) as Array<{ role: "user" | "assistant" | "system"; content: string }>;

  await db.insert(gameMessagesTable).values({
    sessionId: session.id,
    role: "player",
    content: body.data.playerAction,
  });

  const contextMessage = `Current stats: ${JSON.stringify(session.stats)}
Scenario: ${session.scenarioTitle} (${session.paceMode} pace)
Story summary: ${session.storySummary ?? "Story beginning"}
Player action: ${body.data.playerAction}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullContent = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 1200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messageHistory,
        { role: "user", content: contextMessage },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;
        const narrativePart = content.includes("---KAGAIONE_DATA---") ? content.split("---KAGAIONE_DATA---")[0] : content;
        if (narrativePart) {
          res.write(`data: ${JSON.stringify({ content: narrativePart })}\n\n`);
        }
      }
    }

    let choices = ["Continue carefully.", "Take a bold risk.", "Observe and wait.", "Seek information first."];
    let statsDelta: Partial<GameStats> = {};
    let worldEvent: string | null = null;

    const dataMatch = fullContent.match(/---KAGAIONE_DATA---\s*([\s\S]*?)\s*---END_DATA---/);
    if (dataMatch) {
      try {
        const parsed = JSON.parse(dataMatch[1]);
        if (parsed.choices && Array.isArray(parsed.choices)) choices = parsed.choices;
        if (parsed.stats_delta) statsDelta = parsed.stats_delta;
        if (parsed.world_event) worldEvent = parsed.world_event;
      } catch {}
    }

    const narrativeOnly = fullContent.split("---KAGAIONE_DATA---")[0].trim();
    const newStats = buildStatsDelta(session.stats as GameStats, statsDelta);

    await db.insert(gameMessagesTable).values({
      sessionId: session.id,
      role: "narrator",
      content: narrativeOnly,
      choices: JSON.stringify(choices),
      statsSnapshot: JSON.stringify(newStats),
    });

    await db
      .update(gameSessionsTable)
      .set({ stats: newStats, updatedAt: new Date() })
      .where(eq(gameSessionsTable.id, session.id));

    if (worldEvent) {
      const { worldFeedEventsTable } = await import("@workspace/db");
      const username = ["NOX_17", "KAIR0", "VANTA", "SOLACE", "MIRA_9", "ECHO"][Math.floor(Math.random() * 6)];
      await db.insert(worldFeedEventsTable).values({
        username,
        eventText: worldEvent,
        impact: "medium",
      });
    }

    res.write(`data: ${JSON.stringify({ done: true, choices, stats: newStats })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "Narrative generation failed" })}\n\n`);
    res.end();
  }
});

export default router;
