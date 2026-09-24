import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { depthChartPositionSchema, playerClassYearSchema, playerDevTraitSchema, playerStatusSchema, type PlayerDevTrait } from "@shared/schema";import { z } from "zod";
import crypto from "crypto";
import { db } from "./db";
import { Resend } from "resend";
import { users, teamRecords } from "@shared/schema";
import { eq } from "drizzle-orm";

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed admin user from env vars and claim any orphaned teams
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "pocketroster";
  let adminUser = await storage.getUserByUsername(ADMIN_USERNAME);
  if (!adminUser) {
    adminUser = await storage.createUser({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  }
  await storage.claimOrphanedTeams(adminUser.id);

    app.post("/api/auth/signup", async (req, res) => {
        const { username, email, password } = req.body;

        if (!email || typeof email !== "string" || !email.includes("@")) {
            return res.status(400).json({ message: "A valid email is required." });
        }

        const clean = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        const existing = await storage.getUserByUsername(clean);
        const existingEmail = await storage.getUserByEmail(cleanEmail);
        if (existing) {
            return res.status(409).json({ message: "That username is already taken." });
        }

        if (existingEmail) {
            return res.status(409).json({ message: "That email is already registered." });
        }
        const user = await storage.createUser({
            username: clean,
            email: cleanEmail,
            password,
        });
        req.session.userId = user.id;
        req.session.username = user.username;
        res.status(201).json({ isAdmin: true, userId: user.id, username: user.username });
    });

    app.post("/api/auth/login", async (req, res) => {
        const { username, password } = req.body;
        const user = await storage.getUserByUsername(username);
        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ isAdmin: true, userId: user.id, username: user.username });
    });

    app.post("/api/auth/forgot-password", async (req, res) => {
        const { email } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).json({ message: "Email is required." });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await storage.getUserByEmail(cleanEmail);

        if (!user) {
            return res.json({
                message: "If an account exists with that email, a reset link has been created.",
            });
        }

        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        await storage.createPasswordResetToken({
            userId: user.id,
            token,
            expiresAt,
            used: false,
        });

        const resetUrl = `http://localhost:5000/reset-password?token=${token}`;

        if (resend) {
            const { error } = await resend.emails.send({
                from: "PocketRoster <onboarding@resend.dev>",
                to: cleanEmail,
                subject: "Reset your PocketRoster password",
                html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your PocketRoster Password</h2>
        <p>We received a request to reset your PocketRoster password.</p>
        <p>Click the button below to choose a new password:</p>
        <p>
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 12px 20px; background: #111827; color: white; text-decoration: none; border-radius: 6px;"
          >
            Reset Password
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
            });

            if (error) {
                console.error("[PASSWORD RESET EMAIL ERROR]", error);
            }
        } else {
            console.log(`[PASSWORD RESET] ${resetUrl}`);
        }
        return res.json({
            message: "If an account exists with that email, a reset link has been created.",
        });
    });

    app.post("/api/auth/reset-password", async (req, res) => {
        const { token, password } = req.body;

        if (!token || typeof token !== "string") {
            return res.status(400).json({ message: "Reset token is required." });
        }

        if (!password || typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters.",
            });
        }

        const resetToken = await storage.getPasswordResetToken(token);

        if (
            !resetToken ||
            resetToken.used ||
            new Date(resetToken.expiresAt) < new Date()
        ) {
            return res.status(400).json({
                message: "This password reset link is invalid or expired.",
            });
        }

        await db
            .update(users)
            .set({ password })
            .where(eq(users.id, resetToken.userId));

        await storage.markPasswordResetTokenUsed(resetToken.id);

        return res.json({
            message: "Your password has been reset successfully.",
        });
    });

    app.post("/api/auth/logout", (req, res) => {
        req.session.destroy(() => {
            res.json({ ok: true });
        });
    });

  app.get("/api/auth/me", (req, res) => {
    if (req.session.userId) {
      res.json({ isAdmin: true, userId: req.session.userId, username: req.session.username });
    } else {
      res.json({ isAdmin: false });
    }
  });

  app.get(api.teams.list.path, requireAuth, async (req, res) => {
    const teams = await storage.getTeams(req.session.userId!);
    res.json(teams);
  });

  app.get(api.teams.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const team = await storage.getTeam(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json(team);
  });

  app.post(api.teams.create.path, async (req, res) => {
    try {
      const bodySchema = api.teams.create.input.extend({
        wins: z.coerce.number().optional(),
        losses: z.coerce.number().optional(),
        coachPhotoUrl: z.string().optional(),
        coachAccolades: z.array(z.string()).optional(),
        coachAwards: z.array(z.string()).optional(),
        coachRecords: z.array(z.string()).optional(),
      });
      const input = bodySchema.parse(req.body);
      const team = await storage.createTeam(input, req.session.userId!);
      res.status(201).json(team);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.teams.update.path, async (req, res) => {
    try {
      const bodySchema = api.teams.update.input.extend({
        wins: z.coerce.number().optional(),
        losses: z.coerce.number().optional(),
        coachPhotoUrl: z.string().optional(),
        coachAccolades: z.array(z.string()).optional(),
        coachAwards: z.array(z.string()).optional(),
        coachRecords: z.array(z.string()).optional(),
      });
      const input = bodySchema.parse(req.body);
      const team = await storage.updateTeam(Number(req.params.id), input);
      res.json(team);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(404).json({ message: 'Team not found' });
    }
  });

app.delete("/api/teams/:teamId/records/:recordId", requireAuth, async (req, res) => {
  try {
    const result = await db
      .delete(teamRecords)
      .where(eq(teamRecords.id, Number(req.params.recordId)));

    console.log("RECORD DELETE ROUTE HIT", req.params.recordId);
console.log("Deleted records:", result.rowCount);

    res.sendStatus(204);
  } catch (err) {
    throw err;
  }
});

  app.delete(api.teams.delete.path, async (req, res) => {
    try {
      await storage.deleteTeam(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ message: 'Team not found' });
    }
  });

  app.get(api.players.list.path, requireAuth, async (req, res) => {
    const teamId = req.query.teamId ? Number(req.query.teamId) : undefined;
    const players = await storage.getPlayers(req.session.userId!, teamId);
    res.json(players);
  });

  app.get(api.players.get.path, async (req, res) => {
    const player = await storage.getPlayer(Number(req.params.id));
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json(player);
  });

  app.post(api.players.create.path, async (req, res) => {
    try {
      const bodySchema = api.players.create.input.extend({
        teamId: z.coerce.number(),
        jerseyNumber: z.coerce.number(),
        weight: z.coerce.number().optional(),
        skinTone: z.string().optional(),
        hairColor: z.string().optional(),
        facialHair: z.string().optional(),
        accolades: z.array(z.string()).optional(),
        hairStyle: z.string().optional(),
        draftRound: z.coerce.number().optional(),
        draftPick: z.coerce.number().optional(),
        imageUrl: z.string().optional(),
        devTrait: playerDevTraitSchema.default("Normal"),
        overallRating: z.coerce.number().int().min(0).max(99).default(0),
        isRedshirted: z.boolean().default(false),
      });
      const input = bodySchema.parse(req.body);
      const player = await storage.createPlayer(input);
      res.status(201).json(player);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.players.update.path, async (req, res) => {
    try {
      const bodySchema = api.players.update.input.extend({
        teamId: z.coerce.number().optional(),
        jerseyNumber: z.coerce.number().optional(),
        weight: z.coerce.number().optional(),
        skinTone: z.string().optional(),
        hairColor: z.string().optional(),
        facialHair: z.string().optional(),
        accolades: z.array(z.string()).optional(),
        hairStyle: z.string().optional(),
        status: playerStatusSchema.optional(),
        draftRound: z.coerce.number().optional(),
        draftPick: z.coerce.number().optional(),
        imageUrl: z.string().optional(),
        devTrait: playerDevTraitSchema.optional(),
        overallRating: z.coerce.number().int().min(0).max(99).optional(),
        isRedshirted: z.boolean().optional(),
      });
      const input = bodySchema.parse(req.body);
      const player = await storage.updatePlayer(Number(req.params.id), input);
      res.json(player);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(404).json({ message: 'Player not found' });
    }
  });

  app.delete(api.players.delete.path, async (req, res) => {
    try {
      await storage.deletePlayer(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ message: 'Player not found' });
    }
  });

  app.post(api.playerStats.create.path, async (req, res) => {
    try {
      const bodySchema = api.playerStats.create.input.extend({
        playerId: z.coerce.number(),
        season: z.coerce.number(),
        gamesPlayed: z.coerce.number().optional(),
        passingYards: z.coerce.number().optional(),
        rushingYards: z.coerce.number().optional(),
        receivingYards: z.coerce.number().optional(),
        touchdowns: z.coerce.number().optional(),
        passingTouchdowns: z.coerce.number().optional(),
        rushingTouchdowns: z.coerce.number().optional(),
        receivingTouchdowns: z.coerce.number().optional(),
        tackles: z.coerce.number().optional(),
        sacks: z.coerce.number().optional(),
        interceptions: z.coerce.number().optional(),
        tacklesForLoss: z.coerce.number().optional(),
        forcedFumbles: z.coerce.number().optional(),
        fumbleRecoveries: z.coerce.number().optional(),
        defensiveTouchdowns: z.coerce.number().optional(),
        passDeflections: z.coerce.number().optional(),
        completionPercentage: z.coerce.number().optional(),
        passerRating: z.coerce.number().optional(),
        carries: z.coerce.number().optional(),
        brokenTackles: z.coerce.number().optional(),
        fumbles: z.coerce.number().optional(),
      });
      const input = bodySchema.parse(req.body);
      const stat = await storage.createPlayerStat(input);
      res.status(201).json(stat);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.playerStats.update.path, async (req, res) => {
    try {
      const bodySchema = api.playerStats.update.input.extend({
        playerId: z.coerce.number().optional(),
        season: z.coerce.number().optional(),
        gamesPlayed: z.coerce.number().optional(),
        passingYards: z.coerce.number().optional(),
        rushingYards: z.coerce.number().optional(),
        receivingYards: z.coerce.number().optional(),
        touchdowns: z.coerce.number().optional(),
        passingTouchdowns: z.coerce.number().optional(),
        rushingTouchdowns: z.coerce.number().optional(),
        receivingTouchdowns: z.coerce.number().optional(),
        tackles: z.coerce.number().optional(),
        sacks: z.coerce.number().optional(),
        interceptions: z.coerce.number().optional(),
        tacklesForLoss: z.coerce.number().optional(),
        forcedFumbles: z.coerce.number().optional(),
        fumbleRecoveries: z.coerce.number().optional(),
        defensiveTouchdowns: z.coerce.number().optional(),
        passDeflections: z.coerce.number().optional(),
        completionPercentage: z.coerce.number().optional(),
        passerRating: z.coerce.number().optional(),
        carries: z.coerce.number().optional(),
        brokenTackles: z.coerce.number().optional(),
        fumbles: z.coerce.number().optional(),
      });
      const input = bodySchema.parse(req.body);
      const stat = await storage.updatePlayerStat(Number(req.params.id), input);
      res.json(stat);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(404).json({ message: 'Stat not found' });
    }
  });

  app.delete(api.playerStats.delete.path, async (req, res) => {
    try {
      await storage.deletePlayerStat(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ message: 'Stat not found' });
    }
  });

  // Moments routes
  app.get("/api/teams/:teamId/moments", requireAuth, async (req, res) => {
    const moments = await storage.getMomentsByTeam(Number(req.params.teamId));
    res.json(moments);
  });

  app.post("/api/teams/:teamId/moments", requireAuth, async (req, res) => {
    try {
      const bodySchema = z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        images: z.array(z.string()).default([]),
      });
      const input = bodySchema.parse(req.body);
      const moment = await storage.createMoment({
        teamId: Number(req.params.teamId),
        title: input.title,
        body: input.body,
        images: input.images,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json(moment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/moments/:id", requireAuth, async (req, res) => {
    try {
      const bodySchema = z.object({
        title: z.string().min(1).optional(),
        body: z.string().min(1).optional(),
        images: z.array(z.string()).optional(),
      });
      const input = bodySchema.parse(req.body);
      const moment = await storage.updateMoment(Number(req.params.id), input);
      res.json(moment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Moment not found" });
    }
  });

  app.delete("/api/moments/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteMoment(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ message: "Moment not found" });
    }
  });

  // Season record routes
  app.get("/api/teams/:teamId/season-records", async (req, res) => {
    const records = await storage.getSeasonRecordsByTeam(Number(req.params.teamId));
    res.json(records);
  });

  app.post("/api/teams/:teamId/season-records", requireAuth, async (req, res) => {
    try {
      const bodySchema = z.object({
        season: z.coerce.number().int().min(0),
        wins: z.coerce.number().int().min(0),
        losses: z.coerce.number().int().min(0),
      });
      const input = bodySchema.parse(req.body);
      const record = await storage.createSeasonRecord({
        teamId: Number(req.params.teamId),
        ...input,
      });
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

    // Team records routes
  app.get("/api/teams/:teamId/records/:recordType", async (req, res) => {
    const records = await storage.getTeamRecords(
      Number(req.params.teamId),
      req.params.recordType
    );
    res.json(records);
  });

  app.post("/api/teams/:teamId/records", requireAuth, async (req, res) => {
    try {
      const bodySchema = z.object({
        recordType: z.enum(["Game", "Season", "Career"]),
        category: z.enum([
          "Passing Yards",
          "Passing Touchdowns",
          "Rushing Yards",
          "Rushing Touchdowns",
          "Receiving Yards",
          "Receiving Touchdowns",
          "Sacks",
          "Interceptions",
        ]),
        playerName: z.string().min(1),
        value: z.coerce.number().int(),
        season: z.coerce.number().int().min(0),
      });

      const input = bodySchema.parse(req.body);

      const record = await storage.createTeamRecord({
        teamId: Number(req.params.teamId),
        ...input,
      });

      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

    // Team awards routes
  app.get("/api/teams/:teamId/awards/team", async (req, res) => {
    const awards = await storage.getTeamAwards(Number(req.params.teamId));
    res.json(awards);
  });

  app.post("/api/teams/:teamId/awards/team", requireAuth, async (req, res) => {
    try {
      const bodySchema = z.object({
        awardType: z.enum([
          "Conference Championship",
          "Bowl Victory",
          "CFP Victory",
          "National Championship",
        ]),
        opponent: z.string().min(1),
        finalScore: z.string().min(1),
        season: z.coerce.number().int().min(0),
      });

      const input = bodySchema.parse(req.body);

      const award = await storage.createTeamAward({
        teamId: Number(req.params.teamId),
        ...input,
      });

      res.status(201).json(award);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

    // Personal awards routes
  app.get("/api/teams/:teamId/awards/personal", async (req, res) => {
    const awards = await storage.getPersonalAwards(Number(req.params.teamId));
    res.json(awards);
  });

  app.post("/api/teams/:teamId/awards/personal", requireAuth, async (req, res) => {
    try {
      const bodySchema = z.object({
        playerName: z.string().min(1),
        award: z.string().min(1),
        season: z.coerce.number().int().min(0),
      });

      const input = bodySchema.parse(req.body);

      const award = await storage.createPersonalAward({
        teamId: Number(req.params.teamId),
        ...input,
      });

      res.status(201).json(award);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/season-records/:id", requireAuth, async (req, res) => {
    try {
      const bodySchema = z.object({
        season: z.coerce.number().int().min(0).optional(),
        wins: z.coerce.number().int().min(0).optional(),
        losses: z.coerce.number().int().min(0).optional(),
      });
      const input = bodySchema.parse(req.body);
      const record = await storage.updateSeasonRecord(Number(req.params.id), input);
      res.json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Season record not found" });
    }
  });

  app.delete("/api/season-records/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSeasonRecord(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ message: "Season record not found" });
    }
  });

  // Depth chart roster archive routes
  app.get("/api/teams/:teamId/depth-chart", async (req, res) => {
    const entries = await storage.getDepthChartEntriesByTeam(Number(req.params.teamId));
    res.json(entries);
  });

  app.post("/api/teams/:teamId/depth-chart", requireAuth, async (req, res) => {
    try {
      const bodySchema = z.object({
        season: z.coerce.number().int().min(0),
        entries: z.array(z.object({
          position: depthChartPositionSchema,
          playerName: z.string().trim().min(1),
          classYear: playerClassYearSchema.default("Senior"),
          overallRating: z.coerce.number().int().min(0).max(99).default(0),
isRedshirted: z.boolean().default(false),
devTrait: playerDevTraitSchema.default("Normal"),
        })).max(200),
      });
      const input = bodySchema.parse(req.body);
      const entries = await storage.replaceDepthChartRoster(
        Number(req.params.teamId),
        input.season,
        input.entries,
      );
      res.status(201).json(entries);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete("/api/teams/:teamId/depth-chart/:season", requireAuth, async (req, res) => {
    try {
      const season = z.coerce.number().int().min(0).parse(req.params.season);
      await storage.deleteDepthChartRoster(Number(req.params.teamId), season);
      res.status(204).send();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // League image routes
  app.get("/api/leagues", requireAuth, async (req, res) => {
    const data = await storage.getLeagues(req.session.userId!);
    res.json(data);
  });

  app.put("/api/leagues/:name", requireAuth, async (req, res) => {
    const { imageUrl } = req.body;
    if (typeof imageUrl !== "string") {
      return res.status(400).json({ message: "imageUrl must be a string" });
    }
    const league = await storage.upsertLeague(
      req.session.userId!,
      decodeURIComponent(String(req.params.name)),
      imageUrl
    );
    res.json(league);
  });
  
  return httpServer;
}
