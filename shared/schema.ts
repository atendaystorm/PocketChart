import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, varchar, real, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const DEV_TRAITS = ["Normal", "Impact", "Star", "Elite"] as const;
export const playerDevTraitSchema = z.enum(DEV_TRAITS);
export type PlayerDevTrait = z.infer<typeof playerDevTraitSchema>;

export const PLAYER_CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior"] as const;
export const playerClassYearSchema = z.enum(PLAYER_CLASS_YEARS);
export type PlayerClassYear = z.infer<typeof playerClassYearSchema>;

export const DEPTH_CHART_POSITIONS = [
    "Quarterback",
    "Runningback",
    "Fullback",
    "Wide Receiver",
    "Tight End",
    "Left Tackle",
    "Left Guard",
    "Center",
    "Right Guard",
    "Right Tackle",
    "Left Edge",
    "Defensive Tackle",
    "Right Edge",
    "Sam",
    "Mike",
    "Will",
    "Cornerback",
    "Free Safety",
    "Strong Safety",
    "Kicker",
    "Punter",
] as const;
export const depthChartPositionSchema = z.enum(DEPTH_CHART_POSITIONS);
export type DepthChartPosition = z.infer<typeof depthChartPositionSchema>;

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").unique(),
    password: text("password").notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    token: text("token").notNull().unique(),
    expiresAt: text("expires_at").notNull(),
    used: boolean("used").notNull().default(false),
});

export const insertPasswordResetTokenSchema =
    createInsertSchema(passwordResetTokens).omit({ id: true });

export type PasswordResetToken =
    typeof passwordResetTokens.$inferSelect;

export type InsertPasswordResetToken =
    z.infer<typeof insertPasswordResetTokenSchema>;

export const leagues = pgTable("leagues", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
});

export const insertLeagueSchema = createInsertSchema(leagues).omit({ id: true });
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type League = typeof leagues.$inferSelect;

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  mascot: text("mascot").notNull(),
  conference: text("conference").notNull(),
  logoUrl: text("logo_url"),
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  gameTitle: text("game_title"),
  leagueName: text("league_name"),
  headCoachName: text("head_coach_name"),
  coachPhotoUrl: text("coach_photo_url"),
  coachAccolades: text("coach_accolades").array().default(sql`'{}'::text[]`),
  coachAwards: text("coach_awards").array().default(sql`'{}'::text[]`),
  coachRecords: text("coach_records").array().default(sql`'{}'::text[]`),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  name: text("name").notNull(),
  position: varchar("position", { length: 10 }).notNull(),
  jerseyNumber: integer("jersey_number").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  draftRound: integer("draft_round"),
  draftPick: integer("draft_pick"),
  height: text("height"),
  weight: integer("weight"),
  imageUrl: text("image_url"),
  skinTone: text("skin_tone").default("#E0AC69"),
  hairColor: text("hair_color").default("#000000"),
  hairStyle: text("hair_style").default("short"),
  facialHair: text("facial_hair").default("none"),
  accolades: text("accolades").array().default(sql`'{}'::text[]`),
  devTrait: varchar("dev_trait", { length: 20 }).default("Normal").notNull(),
  overallRating: integer("overall_rating").default(0).notNull(),
  isRedshirted: boolean("is_redshirted").default(false).notNull(),
});

export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  season: integer("season").notNull(),
  gamesPlayed: integer("games_played").default(0).notNull(),
  passingYards: integer("passing_yards").default(0).notNull(),
  rushingYards: integer("rushing_yards").default(0).notNull(),
  receivingYards: integer("receiving_yards").default(0).notNull(),
  touchdowns: integer("touchdowns").default(0).notNull(),
  passingTouchdowns: integer("passing_touchdowns").default(0).notNull(),
  rushingTouchdowns: integer("rushing_touchdowns").default(0).notNull(),
  receivingTouchdowns: integer("receiving_touchdowns").default(0).notNull(),
  tackles: integer("tackles").default(0).notNull(),
  sacks: integer("sacks").default(0).notNull(),
  interceptions: integer("interceptions").default(0).notNull(),
  tacklesForLoss: integer("tackles_for_loss").default(0).notNull(),
  forcedFumbles: integer("forced_fumbles").default(0).notNull(),
  fumbleRecoveries: integer("fumble_recoveries").default(0).notNull(),
  defensiveTouchdowns: integer("defensive_touchdowns").default(0).notNull(),
  passDeflections: integer("pass_deflections").default(0).notNull(),
  completionPercentage: real("completion_percentage").default(0).notNull(),
  passerRating: real("passer_rating").default(0).notNull(),
  carries: integer("carries").default(0).notNull(),
  brokenTackles: integer("broken_tackles").default(0).notNull(),
  fumbles: integer("fumbles").default(0).notNull(),
});

export const moments = pgTable("moments", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  images: text("images").array().default(sql`'{}'::text[]`),
  createdAt: text("created_at").notNull(),
});

export const seasonRecords = pgTable("season_records", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  season: integer("season").notNull(),
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
});

export const depthChartEntries = pgTable("depth_chart_entries", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  season: integer("season").notNull(),
  position: varchar("position", { length: 30 }).notNull(),
  playerName: text("player_name").notNull(),
  classYear: varchar("class_year", { length: 20 }).default("Senior").notNull(),
  overallRating: integer("overall_rating").default(0).notNull(),
  isRedshirted: boolean("is_redshirted").default(false).notNull(),
  devTrait: varchar("dev_trait", { length: 20 }).default("Normal").notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players),
  moments: many(moments),
  seasonRecords: many(seasonRecords),
  depthChartEntries: many(depthChartEntries),
}));

export const momentsRelations = relations(moments, ({ one }) => ({
  team: one(teams, {
    fields: [moments.teamId],
    references: [teams.id],
  }),
}));

export const seasonRecordsRelations = relations(seasonRecords, ({ one }) => ({
  team: one(teams, {
    fields: [seasonRecords.teamId],
    references: [teams.id],
  }),
}));

export const depthChartEntriesRelations = relations(depthChartEntries, ({ one }) => ({
  team: one(teams, {
    fields: [depthChartEntries.teamId],
    references: [teams.id],
  }),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  }),
  stats: many(playerStats),
}));

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
  player: one(players, {
    fields: [playerStats.playerId],
    references: [players.id],
  }),
}));

export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, userId: true });
export const insertMomentSchema = createInsertSchema(moments).omit({ id: true });
export const insertSeasonRecordSchema = createInsertSchema(seasonRecords).omit({ id: true });
export const insertDepthChartEntrySchema = createInsertSchema(depthChartEntries).omit({ id: true });

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export const playerStatusSchema = z.enum(["Graduated", "Drafted", "Active"]);
export type PlayerStatus = z.infer<typeof playerStatusSchema>;
export const insertPlayerSchema = createInsertSchema(players)
  .omit({ id: true })
  .extend({
    status: playerStatusSchema,
    devTrait: playerDevTraitSchema.default("Normal"),
  });
export const insertPlayerStatSchema = createInsertSchema(playerStats).omit({ id: true });

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type UpdateTeamRequest = Partial<InsertTeam>;

export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type UpdatePlayerRequest = Partial<InsertPlayer>;

export type PlayerStat = typeof playerStats.$inferSelect;
export type InsertPlayerStat = z.infer<typeof insertPlayerStatSchema>;
export type UpdatePlayerStatRequest = Partial<InsertPlayerStat>;

export type Moment = typeof moments.$inferSelect;
export type InsertMoment = z.infer<typeof insertMomentSchema>;
export type UpdateMomentRequest = Partial<InsertMoment>;

export type SeasonRecord = typeof seasonRecords.$inferSelect;
export type InsertSeasonRecord = z.infer<typeof insertSeasonRecordSchema>;
export type UpdateSeasonRecordRequest = Partial<InsertSeasonRecord>;

export type DepthChartEntry = typeof depthChartEntries.$inferSelect;
export type InsertDepthChartEntry = z.infer<typeof insertDepthChartEntrySchema>;
export type UpdateDepthChartEntryRequest = Partial<InsertDepthChartEntry>;

export type TeamWithPlayers = Team & { players: Player[] };
export type PlayerWithStats = Player & { stats: PlayerStat[], team: Team };
