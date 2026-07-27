import { Router } from "express";
import { z } from "zod";
import { pool } from "../lib/db";
import { AuthedRequest, requireAuth } from "../middleware/auth";

export const matchesRouter = Router();
matchesRouter.use(requireAuth);

const DAILY_LIMIT = 3;

async function isPremium(userId: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT 1 FROM subscriptions WHERE user_id = $1 AND tier = 'premium' AND status = 'active' AND (current_period_end IS NULL OR current_period_end > now())",
    [userId]
  );
  return (result.rowCount ?? 0) > 0;
}

matchesRouter.get("/", async (req: AuthedRequest, res) => {
  const result = await pool.query(
    `SELECT m.id, m.created_at,
            CASE WHEN m.user_a_id = $1 THEN m.user_b_id ELSE m.user_a_id END AS other_user_id,
            p.display_name, ph.storage_url AS primary_photo_url,
            lm.content AS last_message, lm.created_at AS last_message_at
     FROM matches m
     JOIN profiles p ON p.user_id = CASE WHEN m.user_a_id = $1 THEN m.user_b_id ELSE m.user_a_id END
     LEFT JOIN LATERAL (
       SELECT storage_url FROM profile_photos WHERE profile_id = p.id ORDER BY is_primary DESC, created_at ASC LIMIT 1
     ) ph ON true
     LEFT JOIN LATERAL (
       SELECT content, created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1
     ) lm ON true
     WHERE (m.user_a_id = $1 OR m.user_b_id = $1) AND m.status = 'active'
     ORDER BY COALESCE(lm.created_at, m.created_at) DESC`,
    [req.userId]
  );
  res.json({ matches: result.rows });
});

const createSchema = z.object({ targetProfileId: z.string().uuid() });

matchesRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }

  const targetResult = await pool.query("SELECT user_id, display_name FROM profiles WHERE id = $1", [
    parsed.data.targetProfileId,
  ]);
  const target = targetResult.rows[0];
  if (!target) {
    return res.status(404).json({ error: "profile_not_found" });
  }
  if (target.user_id === req.userId) {
    return res.status(400).json({ error: "cannot_match_self" });
  }

  const existing = await pool.query(
    "SELECT id FROM matches WHERE (user_a_id = $1 AND user_b_id = $2) OR (user_a_id = $2 AND user_b_id = $1)",
    [req.userId, target.user_id]
  );
  if (existing.rowCount) {
    return res.status(200).json({ id: existing.rows[0].id, alreadyMatched: true });
  }

  const premium = await isPremium(req.userId!);
  if (!premium) {
    const todayCount = await pool.query(
      "SELECT count(*)::int AS count FROM matches WHERE user_a_id = $1 AND created_at::date = now()::date",
      [req.userId]
    );
    const used = todayCount.rows[0].count;
    if (used >= DAILY_LIMIT) {
      return res.status(403).json({ error: "daily_limit_reached", used, limit: DAILY_LIMIT });
    }
  }

  const created = await pool.query(
    "INSERT INTO matches (user_a_id, user_b_id) VALUES ($1, $2) RETURNING id, created_at",
    [req.userId, target.user_id]
  );

  res.status(201).json({ id: created.rows[0].id, alreadyMatched: false, otherDisplayName: target.display_name });
});

async function assertParticipant(matchId: string, userId: string) {
  const result = await pool.query("SELECT user_a_id, user_b_id FROM matches WHERE id = $1", [matchId]);
  const match = result.rows[0];
  if (!match || (match.user_a_id !== userId && match.user_b_id !== userId)) {
    return false;
  }
  return true;
}

matchesRouter.get("/:id/messages", async (req: AuthedRequest, res) => {
  if (!(await assertParticipant(req.params.id, req.userId!))) {
    return res.status(404).json({ error: "match_not_found" });
  }
  const result = await pool.query(
    "SELECT id, sender_id, content, created_at FROM messages WHERE match_id = $1 ORDER BY created_at ASC",
    [req.params.id]
  );
  res.json({ messages: result.rows });
});

const messageSchema = z.object({ content: z.string().min(1).max(2000) });

matchesRouter.post("/:id/messages", async (req: AuthedRequest, res) => {
  if (!(await assertParticipant(req.params.id, req.userId!))) {
    return res.status(404).json({ error: "match_not_found" });
  }
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }
  const result = await pool.query(
    "INSERT INTO messages (match_id, sender_id, content) VALUES ($1, $2, $3) RETURNING id, sender_id, content, created_at",
    [req.params.id, req.userId, parsed.data.content]
  );
  res.status(201).json(result.rows[0]);
});
