import crypto from "crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../lib/db";
import { AuthedRequest, requireAuth } from "../middleware/auth";

export const authRouter = Router();

const OTP_TTL_MINUTES = 10;

// Twilio isn't wired up yet — until TWILIO_* env vars are set, the code is
// returned in the API response (clearly marked "dev") instead of texted, so
// the flow keeps working end-to-end while that's pending.
const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

async function sendSms(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`twilio_send_failed_${res.status}: ${errBody}`);
  }
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+972${digits.slice(1)}`; // Israeli local format
  return null;
}

function hashCode(code: string, phone: string): string {
  return crypto.createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

function issueToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: "30d" });
}

const otpRequestSchema = z.object({ phone: z.string().min(1) });

authRouter.post("/otp/request", async (req, res) => {
  const parsed = otpRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return res.status(400).json({ error: "invalid_phone" });
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  await pool.query(
    `INSERT INTO phone_otps (phone, code_hash, expires_at) VALUES ($1, $2, now() + interval '${OTP_TTL_MINUTES} minutes')`,
    [phone, hashCode(code, phone)]
  );

  if (twilioConfigured) {
    await sendSms(phone, `קוד האימות שלך ל-YourType: ${code}`);
    return res.json({ ok: true });
  }

  console.log(`[sms:dev-mode] to=${phone} code=${code}`);
  return res.json({ ok: true, devCode: code });
});

const otpVerifySchema = z.object({ phone: z.string().min(1), code: z.string().length(6) });

authRouter.post("/otp/verify", async (req, res) => {
  const parsed = otpVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return res.status(400).json({ error: "invalid_phone" });
  }

  const codeHash = hashCode(parsed.data.code, phone);
  const otpResult = await pool.query(
    `SELECT id FROM phone_otps WHERE phone = $1 AND code_hash = $2 AND used_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [phone, codeHash]
  );
  const otp = otpResult.rows[0];
  if (!otp) {
    return res.status(400).json({ error: "invalid_or_expired_code" });
  }
  await pool.query("UPDATE phone_otps SET used_at = now() WHERE id = $1", [otp.id]);

  const existing = await pool.query("SELECT id, is_banned FROM users WHERE phone = $1", [phone]);
  let userId: string;
  let isNewUser: boolean;

  if (existing.rowCount) {
    if (existing.rows[0].is_banned) {
      return res.status(403).json({ error: "account_banned" });
    }
    userId = existing.rows[0].id;
    isNewUser = false;
  } else {
    const created = await pool.query(
      `INSERT INTO users (phone, auth_provider, is_verified, terms_accepted_at) VALUES ($1, 'phone', true, now()) RETURNING id`,
      [phone]
    );
    userId = created.rows[0].id;
    isNewUser = true;
  }

  res.json({ token: issueToken(userId), userId, isNewUser });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  res.json({ userId: req.userId });
});

authRouter.delete("/me", requireAuth, async (req: AuthedRequest, res) => {
  await pool.query("DELETE FROM users WHERE id = $1", [req.userId]);
  res.status(204).send();
});
