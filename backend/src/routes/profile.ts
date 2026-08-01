import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { pool, toVectorLiteral } from "../lib/db";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { getEmbedding } from "../lib/embeddings";
import { deleteUploadedFile, generateFilename, saveUploadedFile } from "../lib/storage";

export const profileRouter = Router();
profileRouter.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("only_images_allowed"));
    }
    cb(null, true);
  },
});

profileRouter.get("/me", async (req: AuthedRequest, res) => {
  const profileResult = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [req.userId]);
  const profile = profileResult.rows[0];
  if (!profile) {
    return res.status(404).json({ error: "profile_not_found" });
  }
  const photos = await pool.query(
    "SELECT id, storage_url, is_primary FROM profile_photos WHERE profile_id = $1 ORDER BY is_primary DESC, created_at ASC",
    [profile.id]
  );
  res.json({ ...profile, photos: photos.rows });
});

const profileSchema = z.object({
  displayName: z.string().min(1).max(60),
  birthDate: z.string(),
  gender: z.string(),
  interestedIn: z.string(),
  bio: z.string().max(500).optional(),
  profession: z.string().optional(),
  education: z.string().optional(),
  lookingFor: z.string().optional(),
  region: z.string().optional(),
  heightCm: z.number().int().positive().optional(),
  religion: z.string().optional(),
  smoking: z.enum(["never", "sometimes", "regularly"]).optional(),
  lifestyleTags: z.array(z.string()).optional(),
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

profileRouter.put("/me", async (req: AuthedRequest, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input", details: parsed.error.flatten() });
  }
  const d = parsed.data;

  if (Number.isNaN(Date.parse(d.birthDate)) || calculateAge(d.birthDate) < 18) {
    return res.status(400).json({ error: "must_be_18_or_older" });
  }

  const result = await pool.query(
    `INSERT INTO profiles (
       user_id, display_name, birth_date, gender, interested_in, bio, profession,
       education, looking_for, region, height_cm, religion, smoking, lifestyle_tags, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
     ON CONFLICT (user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       birth_date = EXCLUDED.birth_date,
       gender = EXCLUDED.gender,
       interested_in = EXCLUDED.interested_in,
       bio = EXCLUDED.bio,
       profession = EXCLUDED.profession,
       education = EXCLUDED.education,
       looking_for = EXCLUDED.looking_for,
       region = EXCLUDED.region,
       height_cm = EXCLUDED.height_cm,
       religion = EXCLUDED.religion,
       smoking = EXCLUDED.smoking,
       lifestyle_tags = EXCLUDED.lifestyle_tags,
       updated_at = now()
     RETURNING *`,
    [
      req.userId,
      d.displayName,
      d.birthDate,
      d.gender,
      d.interestedIn,
      d.bio ?? null,
      d.profession ?? null,
      d.education ?? null,
      d.lookingFor ?? null,
      d.region ?? null,
      d.heightCm ?? null,
      d.religion ?? null,
      d.smoking ?? null,
      d.lifestyleTags ?? [],
    ]
  );

  res.json(result.rows[0]);
});

profileRouter.post("/me/photos", upload.single("photo"), async (req: AuthedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "photo_required" });
  }

  const profileResult = await pool.query("SELECT id FROM profiles WHERE user_id = $1", [req.userId]);
  const profile = profileResult.rows[0];
  if (!profile) {
    return res.status(404).json({ error: "profile_not_found_create_profile_first" });
  }

  // If the AI embedding service is down, still save the photo — it just won't
  // be findable by visual search until it's re-processed. Keeps profile setup
  // (and testing) unblocked when that service isn't running.
  let embeddingLiteral: string | null = null;
  try {
    embeddingLiteral = toVectorLiteral(await getEmbedding(req.file.buffer));
  } catch (err) {
    console.warn("embedding_service_unavailable — saving photo without an embedding");
  }

  const storageUrl = await saveUploadedFile(req.file.buffer, generateFilename(req.file.originalname), req.file.mimetype);

  const existingCount = await pool.query(
    "SELECT count(*)::int AS count FROM profile_photos WHERE profile_id = $1",
    [profile.id]
  );
  const isPrimary = existingCount.rows[0].count === 0;

  const result = await pool.query(
    `INSERT INTO profile_photos (profile_id, storage_url, embedding, is_primary)
     VALUES ($1, $2, $3, $4)
     RETURNING id, storage_url, is_primary, created_at`,
    [profile.id, storageUrl, embeddingLiteral, isPrimary]
  );

  res.status(201).json(result.rows[0]);
});

profileRouter.delete("/me/photos/:id", async (req: AuthedRequest, res) => {
  const profileResult = await pool.query("SELECT id FROM profiles WHERE user_id = $1", [req.userId]);
  const profile = profileResult.rows[0];
  if (!profile) {
    return res.status(404).json({ error: "profile_not_found" });
  }

  const photoResult = await pool.query(
    "DELETE FROM profile_photos WHERE id = $1 AND profile_id = $2 RETURNING storage_url",
    [req.params.id, profile.id]
  );
  if (!photoResult.rowCount) {
    return res.status(404).json({ error: "photo_not_found" });
  }

  await deleteUploadedFile(photoResult.rows[0].storage_url);

  res.status(204).send();
});

profileRouter.get("/me/export", async (req: AuthedRequest, res) => {
  const [user, profile, photos, matches, messages, interactions] = await Promise.all([
    pool.query("SELECT id, email, auth_provider, created_at FROM users WHERE id = $1", [req.userId]),
    pool.query("SELECT * FROM profiles WHERE user_id = $1", [req.userId]),
    pool.query(
      "SELECT ph.storage_url, ph.is_primary, ph.created_at FROM profile_photos ph JOIN profiles p ON p.id = ph.profile_id WHERE p.user_id = $1",
      [req.userId]
    ),
    pool.query("SELECT * FROM matches WHERE user_a_id = $1 OR user_b_id = $1", [req.userId]),
    pool.query("SELECT id, match_id, content, created_at FROM messages WHERE sender_id = $1", [req.userId]),
    pool.query(
      "SELECT type, target_profile_id, created_at FROM interactions WHERE user_id = $1",
      [req.userId]
    ),
  ]);

  res.setHeader("Content-Disposition", "attachment; filename=crushai-my-data.json");
  res.json({
    exportedAt: new Date().toISOString(),
    user: user.rows[0],
    profile: profile.rows[0] ?? null,
    photos: photos.rows,
    matches: matches.rows,
    messagesSent: messages.rows,
    interactions: interactions.rows,
  });
});

profileRouter.put("/me/visibility", async (req: AuthedRequest, res) => {
  const schema = z.object({ visible: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_input" });
  }

  const result = await pool.query(
    "UPDATE profiles SET visible_in_ai_search = $1, updated_at = now() WHERE user_id = $2 RETURNING visible_in_ai_search",
    [parsed.data.visible, req.userId]
  );
  if (!result.rowCount) {
    return res.status(404).json({ error: "profile_not_found" });
  }

  res.json(result.rows[0]);
});
