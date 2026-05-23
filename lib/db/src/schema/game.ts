import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameStatsSchema = z.object({
  influence: z.number().int().default(50),
  wealth: z.number().int().default(50),
  trust: z.number().int().default(50),
  reputation: z.number().int().default(50),
  stability: z.number().int().default(50),
  desire: z.number().int().default(50),
  risk: z.number().int().default(50),
});

export type GameStats = z.infer<typeof gameStatsSchema>;

export const gameSessionsTable = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  scenarioId: text("scenario_id").notNull(),
  scenarioTitle: text("scenario_title").notNull(),
  paceMode: text("pace_mode").notNull().default("daily"),
  status: text("status").notNull().default("active"),
  stats: jsonb("stats").notNull().$type<GameStats>(),
  storySummary: text("story_summary"),
  hiddenNotes: text("hidden_notes"),
  customPremise: text("custom_premise"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessionsTable.$inferSelect;

export const gameMessagesTable = pgTable("game_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  choices: text("choices"),
  statsSnapshot: text("stats_snapshot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameMessageSchema = createInsertSchema(gameMessagesTable).omit({ id: true, createdAt: true });
export type InsertGameMessage = z.infer<typeof insertGameMessageSchema>;
export type GameMessage = typeof gameMessagesTable.$inferSelect;

export const worldFeedEventsTable = pgTable("world_feed_events", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  eventText: text("event_text").notNull(),
  impact: text("impact").notNull().default("medium"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorldFeedEventSchema = createInsertSchema(worldFeedEventsTable).omit({ id: true, createdAt: true });
export type InsertWorldFeedEvent = z.infer<typeof insertWorldFeedEventSchema>;
export type WorldFeedEvent = typeof worldFeedEventsTable.$inferSelect;

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  username: text("username"),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  maturityLevel: text("maturity_level").notNull().default("medium"),
  narrativePace: text("narrative_pace").notNull().default("daily"),
  tier: text("tier").notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserProfileSchema = createInsertSchema(userProfilesTable).omit({ id: true, createdAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;
