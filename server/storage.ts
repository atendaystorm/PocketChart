import { db } from "./db";
import {
  teams, players, playerStats, users, leagues, moments, seasonRecords, depthChartEntries,
  type Team, type InsertTeam, type UpdateTeamRequest, type TeamWithPlayers,
  type Player, type InsertPlayer, type UpdatePlayerRequest, type PlayerWithStats,
  type PlayerStat, type InsertPlayerStat, type UpdatePlayerStatRequest,
  type User, type InsertUser,
  type League,
  type Moment, type InsertMoment, type UpdateMomentRequest,
  type SeasonRecord, type InsertSeasonRecord, type UpdateSeasonRecordRequest,
  type DepthChartEntry, type InsertDepthChartEntry,
} from "@shared/schema";
import { and, eq, isNull, inArray } from "drizzle-orm";

export interface IStorage {
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}
  getLeagues(userId: number): Promise<League[]>;
  upsertLeague(userId: number, name: string, imageUrl: string): Promise<League>;

  getTeams(userId: number): Promise<Team[]>;
  getTeam(id: number): Promise<TeamWithPlayers | undefined>;
  createTeam(team: InsertTeam, userId: number): Promise<Team>;
  updateTeam(id: number, updates: UpdateTeamRequest): Promise<Team>;
  deleteTeam(id: number): Promise<void>;
  claimOrphanedTeams(userId: number): Promise<void>;

  getPlayers(userId: number, teamId?: number): Promise<(Player & { team: Team })[]>;
  getPlayer(id: number): Promise<PlayerWithStats | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, updates: UpdatePlayerRequest): Promise<Player>;
  deletePlayer(id: number): Promise<void>;

  createPlayerStat(stat: InsertPlayerStat): Promise<PlayerStat>;
  updatePlayerStat(id: number, updates: UpdatePlayerStatRequest): Promise<PlayerStat>;
  deletePlayerStat(id: number): Promise<void>;

  getMomentsByTeam(teamId: number): Promise<Moment[]>;
  createMoment(data: InsertMoment): Promise<Moment>;
  updateMoment(id: number, updates: UpdateMomentRequest): Promise<Moment>;
  deleteMoment(id: number): Promise<void>;

  getSeasonRecordsByTeam(teamId: number): Promise<SeasonRecord[]>;
  createSeasonRecord(data: InsertSeasonRecord): Promise<SeasonRecord>;
  updateSeasonRecord(id: number, updates: UpdateSeasonRecordRequest): Promise<SeasonRecord>;
  deleteSeasonRecord(id: number): Promise<void>;

  getDepthChartEntriesByTeam(teamId: number): Promise<DepthChartEntry[]>;
  replaceDepthChartRoster(teamId: number, season: number, entries: Omit<InsertDepthChartEntry, "teamId" | "season">[]): Promise<DepthChartEntry[]>;
  deleteDepthChartRoster(teamId: number, season: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

 async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
}

async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
}

  async getLeagues(userId: number): Promise<League[]> {
    return await db.select().from(leagues).where(eq(leagues.userId, userId));
  }

  async upsertLeague(userId: number, name: string, imageUrl: string): Promise<League> {
    const [existing] = await db
      .select()
      .from(leagues)
        .where(and(eq(leagues.userId, userId), eq(leagues.name, name)));
    if (existing) {
      const [updated] = await db
        .update(leagues)
        .set({ imageUrl })
        .where(eq(leagues.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(leagues).values({ userId, name, imageUrl }).returning();
    return created;
  }

  async getTeams(userId: number): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.userId, userId));
  }

  async getTeam(id: number): Promise<TeamWithPlayers | undefined> {
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, id),
      with: { players: true },
    });
    return team;
  }

  async createTeam(team: InsertTeam, userId: number): Promise<Team> {
    const [created] = await db.insert(teams).values({ ...team, userId }).returning();
    return created;
  }

  async updateTeam(id: number, updates: UpdateTeamRequest): Promise<Team> {
    const [updated] = await db.update(teams).set(updates).where(eq(teams.id, id)).returning();
    if (!updated) throw new Error("Team not found");
    return updated;
  }

  async deleteTeam(id: number): Promise<void> {
    await db.delete(moments).where(eq(moments.teamId, id));
    await db.delete(seasonRecords).where(eq(seasonRecords.teamId, id));
    await db.delete(depthChartEntries).where(eq(depthChartEntries.teamId, id));
    await db.delete(teams).where(eq(teams.id, id));
  }

  async claimOrphanedTeams(userId: number): Promise<void> {
    await db.update(teams).set({ userId }).where(isNull(teams.userId));
  }

  async getPlayers(userId: number, teamId?: number): Promise<(Player & { team: Team })[]> {
    const userTeams = await db.query.teams.findMany({
      where: eq(teams.userId, userId),
      columns: { id: true },
    });
    const teamIds = userTeams.map(t => t.id);
    if (teamIds.length === 0) return [];
    if (teamId !== undefined) {
      if (!teamIds.includes(teamId)) return [];
      return await db.query.players.findMany({
        where: eq(players.teamId, teamId),
        with: { team: true },
      });
    }
    return await db.query.players.findMany({
      where: inArray(players.teamId, teamIds),
      with: { team: true },
    });
  }

  async getPlayer(id: number): Promise<PlayerWithStats | undefined> {
    const player = await db.query.players.findFirst({
      where: eq(players.id, id),
      with: { stats: true, team: true },
    });
    return player;
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [created] = await db.insert(players).values(player).returning();
    return created;
  }

  async updatePlayer(id: number, updates: UpdatePlayerRequest): Promise<Player> {
    const [updated] = await db.update(players).set(updates).where(eq(players.id, id)).returning();
    if (!updated) throw new Error("Player not found");
    return updated;
  }

  async deletePlayer(id: number): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  async createPlayerStat(stat: InsertPlayerStat): Promise<PlayerStat> {
    const [created] = await db.insert(playerStats).values(stat).returning();
    return created;
  }

  async updatePlayerStat(id: number, updates: UpdatePlayerStatRequest): Promise<PlayerStat> {
    const [updated] = await db.update(playerStats).set(updates).where(eq(playerStats.id, id)).returning();
    if (!updated) throw new Error("Stat not found");
    return updated;
  }

  async deletePlayerStat(id: number): Promise<void> {
    await db.delete(playerStats).where(eq(playerStats.id, id));
  }

  async getMomentsByTeam(teamId: number): Promise<Moment[]> {
    return await db.select().from(moments).where(eq(moments.teamId, teamId));
  }

  async createMoment(data: InsertMoment): Promise<Moment> {
    const [created] = await db.insert(moments).values(data).returning();
    return created;
  }

  async updateMoment(id: number, updates: UpdateMomentRequest): Promise<Moment> {
    const [updated] = await db.update(moments).set(updates).where(eq(moments.id, id)).returning();
    if (!updated) throw new Error("Moment not found");
    return updated;
  }

  async deleteMoment(id: number): Promise<void> {
    await db.delete(moments).where(eq(moments.id, id));
  }

  async getSeasonRecordsByTeam(teamId: number): Promise<SeasonRecord[]> {
    return await db.select().from(seasonRecords).where(eq(seasonRecords.teamId, teamId));
  }

  async createSeasonRecord(data: InsertSeasonRecord): Promise<SeasonRecord> {
    const [created] = await db.insert(seasonRecords).values(data).returning();
    return created;
  }

  async updateSeasonRecord(id: number, updates: UpdateSeasonRecordRequest): Promise<SeasonRecord> {
    const [updated] = await db
      .update(seasonRecords)
      .set(updates)
      .where(eq(seasonRecords.id, id))
      .returning();
    if (!updated) throw new Error("Season record not found");
    return updated;
  }

  async deleteSeasonRecord(id: number): Promise<void> {
    await db.delete(seasonRecords).where(eq(seasonRecords.id, id));
  }

  async getDepthChartEntriesByTeam(teamId: number): Promise<DepthChartEntry[]> {
    return await db
      .select()
      .from(depthChartEntries)
      .where(eq(depthChartEntries.teamId, teamId));
  }

  async replaceDepthChartRoster(
    teamId: number,
    season: number,
    entries: Omit<InsertDepthChartEntry, "teamId" | "season">[],
  ): Promise<DepthChartEntry[]> {
    return await db.transaction(async (tx) => {
      await tx
        .delete(depthChartEntries)
        .where(and(eq(depthChartEntries.teamId, teamId), eq(depthChartEntries.season, season)));

      if (entries.length === 0) return [];

      return await tx
        .insert(depthChartEntries)
        .values(entries.map(entry => ({ ...entry, teamId, season })))
        .returning();
    });
  }

  async deleteDepthChartRoster(teamId: number, season: number): Promise<void> {
    await db
      .delete(depthChartEntries)
      .where(and(eq(depthChartEntries.teamId, teamId), eq(depthChartEntries.season, season)));
  }
}

export const storage = new DatabaseStorage();
