import { z } from 'zod';
import { insertTeamSchema, teams, players, playerStats, insertPlayerSchema, insertPlayerStatSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  teams: {
    list: {
      method: 'GET' as const,
      path: '/api/teams' as const,
      responses: {
        200: z.array(z.custom<typeof teams.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/teams/:id' as const,
      responses: {
        200: z.custom<typeof teams.$inferSelect & { players?: typeof players.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/teams' as const,
      input: insertTeamSchema,
      responses: {
        201: z.custom<typeof teams.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/teams/:id' as const,
      input: insertTeamSchema.partial(),
      responses: {
        200: z.custom<typeof teams.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/teams/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  players: {
    list: {
      method: 'GET' as const,
      path: '/api/players' as const,
      input: z.object({
        teamId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof players.$inferSelect & { team?: typeof teams.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/players/:id' as const,
      responses: {
        200: z.custom<typeof players.$inferSelect & { stats?: typeof playerStats.$inferSelect[], team?: typeof teams.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/players' as const,
      input: insertPlayerSchema,
      responses: {
        201: z.custom<typeof players.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/players/:id' as const,
      input: insertPlayerSchema.partial(),
      responses: {
        200: z.custom<typeof players.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/players/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  playerStats: {
    create: {
      method: 'POST' as const,
      path: '/api/player-stats' as const,
      input: insertPlayerStatSchema,
      responses: {
        201: z.custom<typeof playerStats.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/player-stats/:id' as const,
      input: insertPlayerStatSchema.partial(),
      responses: {
        200: z.custom<typeof playerStats.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/player-stats/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type TeamInput = z.infer<typeof api.teams.create.input>;
export type TeamResponse = z.infer<typeof api.teams.create.responses[201]>;
export type TeamListResponse = z.infer<typeof api.teams.list.responses[200]>;
export type TeamDetailResponse = z.infer<typeof api.teams.get.responses[200]>;

export type PlayerInput = z.infer<typeof api.players.create.input>;
export type PlayerResponse = z.infer<typeof api.players.create.responses[201]>;
export type PlayerListResponse = z.infer<typeof api.players.list.responses[200]>;
export type PlayerDetailResponse = z.infer<typeof api.players.get.responses[200]>;

export type PlayerStatInput = z.infer<typeof api.playerStats.create.input>;
export type PlayerStatResponse = z.infer<typeof api.playerStats.create.responses[201]>;