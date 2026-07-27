import { Router } from "express";
import { z } from "zod";
import { pool } from "../lib/db";
import { AuthedRequest, requireAuth } from "../middleware/auth";

export const subscriptionRouter = Router();
subscriptionRouter.use(requireAuth);

subscriptionRouter.get("/me", async (req: AuthedRequest, res) => {
  const result = await pool.query("SELECT tier, status, current_period_end FROM subscriptions WHERE user_id = $1", [
    req.userId,
  ]);
  res.json(result.rows[0] ?? { tier: "free", status: "active", current_period_end: null });
});

const PLAN_DAYS: Record<string, number> = { weekly: 7, monthly: 30, yearly: 365 };

// Demo purchase flow — no App Store / Google Play billing wired up yet.
// This lets the rest of the Premium gating (daily chat limit, badges) be real and testable.
const purchaseSchema = z.object({ plan: z.enum(["weekly", "monthly", "yearly"]) });

subscriptionRouter.post("/me/purchase", async (req: AuthedRequest, res) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }
  const days = PLAN_DAYS[parsed.data.plan];

  const result = await pool.query(
    `INSERT INTO subscriptions (user_id, tier, status, current_period_end)
     VALUES ($1, 'premium', 'active', now() + ($2 || ' days')::interval)
     ON CONFLICT (user_id) DO UPDATE SET
       tier = 'premium', status = 'active', current_period_end = now() + ($2 || ' days')::interval
     RETURNING tier, status, current_period_end`,
    [req.userId, days]
  );
  res.json(result.rows[0]);
});
