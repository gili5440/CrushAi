import "dotenv/config";
import "express-async-errors"; // makes async route handler errors reach the error middleware instead of crashing the process
import path from "path";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pool } from "./lib/db";
import { runMigrations } from "./lib/migrate";
import { authRouter } from "./routes/auth";
import { matchesRouter } from "./routes/matches";
import { profileRouter } from "./routes/profile";
import { blocksRouter, reportsRouter } from "./routes/reports";
import { searchRouter } from "./routes/search";
import { subscriptionRouter } from "./routes/subscription";

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith("dev_only"))) {
  throw new Error("JWT_SECRET must be set to a real secret in production (see backend/.env.example)");
}

const app = express();
app.set("trust proxy", 1); // needed behind a reverse proxy (Railway/Render/etc.) for rate-limit + req.ip to work

// Standard security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.).
// CSP is left off: web/index.html relies on inline onclick="" handlers and an inline <style>
// block throughout (matching the original design), plus Google Fonts + dicebear.com images —
// a real CSP here would need those handlers refactored to addEventListener first.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors(
    isProduction
      ? {
          origin: allowedOrigins.length ? allowedOrigins : false,
        }
      : {} // permissive in dev so the phone/emulator/localhost web preview all just work
  )
);

app.use(express.json());
app.use("/uploads", express.static(path.resolve(process.env.UPLOAD_DIR || "./uploads")));
app.use(express.static(path.resolve(__dirname, "../../web")));

app.get("/health", (_req, res) => res.json({ ok: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});

app.use("/auth", authLimiter, authRouter);
app.use("/profile", generalLimiter, profileRouter);
app.use("/search", generalLimiter, searchRouter);
app.use("/matches", generalLimiter, matchesRouter);
app.use("/subscriptions", generalLimiter, subscriptionRouter);
app.use("/reports", generalLimiter, reportsRouter);
app.use("/blocks", generalLimiter, blocksRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

// Defense in depth: log but don't crash on errors outside the request cycle
// (express-async-errors above handles the normal route-handler case).
process.on("unhandledRejection", (err) => console.error("unhandledRejection", err));

const port = Number(process.env.PORT) || 4000;

// Applies any pending SQL migrations before accepting traffic — no manual
// shell step needed (Render's free tier doesn't allow shell/SSH access anyway).
runMigrations(pool)
  .then(() => {
    app.listen(port, () => {
      console.log(`CrushAI backend listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("migration failed, refusing to start", err);
    process.exit(1);
  });
