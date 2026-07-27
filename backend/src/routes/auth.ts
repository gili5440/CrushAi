import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../lib/db";
import { AuthedRequest, requireAuth } from "../middleware/auth";

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  birthDate: z.string().refine((d) => !Number.isNaN(Date.parse(d)), "invalid_date"),
  acceptedTerms: z.literal(true),
});

function calculateAge(birthDate: string): number {
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function issueToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: "30d" });
}

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }
  const { email, password, birthDate, acceptedTerms } = parsed.data;

  if (calculateAge(birthDate) < 18) {
    return res.status(400).json({ error: "must_be_18_or_older" });
  }
  if (!acceptedTerms) {
    return res.status(400).json({ error: "must_accept_terms" });
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount) {
    return res.status(409).json({ error: "email_already_registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, auth_provider, terms_accepted_at)
     VALUES ($1, $2, 'email', now())
     RETURNING id`,
    [email, passwordHash]
  );
  const userId = result.rows[0].id;

  res.status(201).json({ token: issueToken(userId), userId, birthDate });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }
  const { email, password } = parsed.data;

  const result = await pool.query(
    "SELECT id, password_hash, is_banned FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: "invalid_credentials" });
  }
  if (user.is_banned) {
    return res.status(403).json({ error: "account_banned" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  res.json({ token: issueToken(user.id), userId: user.id });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  res.json({ userId: req.userId });
});

authRouter.delete("/me", requireAuth, async (req: AuthedRequest, res) => {
  await pool.query("DELETE FROM users WHERE id = $1", [req.userId]);
  res.status(204).send();
});
