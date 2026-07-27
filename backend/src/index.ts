import "dotenv/config";
import path from "path";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
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

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`CrushAI backend listening on http://localhost:${port}`);
});
