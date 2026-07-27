import { Router } from "express";
import { z } from "zod";
import { pool } from "../lib/db";
import { AuthedRequest, requireAuth } from "../middleware/auth";

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

const reportSchema = z.object({
  reportedProfileId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

reportsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }
  const result = await pool.query(
    `INSERT INTO reports (reporter_id, reported_profile_id, reason) VALUES ($1, $2, $3) RETURNING id, status, created_at`,
    [req.userId, parsed.data.reportedProfileId, parsed.data.reason]
  );
  res.status(201).json(result.rows[0]);
});

export const blocksRouter = Router();
blocksRouter.use(requireAuth);

const blockSchema = z.object({ targetProfileId: z.string().uuid() });

blocksRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = blockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }
  const existing = await pool.query(
    "SELECT id FROM interactions WHERE user_id = $1 AND target_profile_id = $2 AND type = 'block'",
    [req.userId, parsed.data.targetProfileId]
  );
  if (existing.rowCount) {
    return res.status(200).json({ id: existing.rows[0].id, alreadyBlocked: true });
  }
  const result = await pool.query(
    `INSERT INTO interactions (user_id, target_profile_id, type) VALUES ($1, $2, 'block') RETURNING id, created_at`,
    [req.userId, parsed.data.targetProfileId]
  );
  res.status(201).json({ ...result.rows[0], alreadyBlocked: false });
});

blocksRouter.get("/", async (req: AuthedRequest, res) => {
  const result = await pool.query(
    "SELECT target_profile_id FROM interactions WHERE user_id = $1 AND type = 'block'",
    [req.userId]
  );
  res.json({ blockedProfileIds: result.rows.map((r) => r.target_profile_id) });
});
