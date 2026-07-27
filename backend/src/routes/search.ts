import { Router } from "express";
import multer from "multer";
import { pool, toVectorLiteral } from "../lib/db";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { getEmbedding } from "../lib/embeddings";
import { generateFilename, saveUploadedFile } from "../lib/storage";

export const searchRouter = Router();
searchRouter.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const PAGE_SIZE = 20;

async function fetchResultsPage(
  embeddingLiteral: string,
  userId: string,
  filters: { minAge?: number; maxAge?: number; gender?: string },
  page: number
) {
  const conditions: string[] = [
    "p.visible_in_ai_search = true",
    "p.user_id != $2",
    "NOT EXISTS (SELECT 1 FROM interactions bi WHERE bi.user_id = $2 AND bi.target_profile_id = p.id AND bi.type = 'block')",
  ];
  const params: any[] = [embeddingLiteral, userId];
  let paramIndex = 3;

  if (filters.gender) {
    conditions.push(`p.gender = $${paramIndex++}`);
    params.push(filters.gender);
  }
  if (filters.minAge) {
    conditions.push(`date_part('year', age(p.birth_date)) >= $${paramIndex++}`);
    params.push(filters.minAge);
  }
  if (filters.maxAge) {
    conditions.push(`date_part('year', age(p.birth_date)) <= $${paramIndex++}`);
    params.push(filters.maxAge);
  }

  params.push(PAGE_SIZE, page * PAGE_SIZE);

  const query = `
    SELECT p.id AS profile_id, p.display_name, p.birth_date, p.region,
           ph.storage_url AS primary_photo_url,
           (ph.embedding <=> $1) AS distance
    FROM profiles p
    JOIN LATERAL (
      SELECT embedding, storage_url FROM profile_photos
      WHERE profile_id = p.id
      ORDER BY is_primary DESC, created_at ASC
      LIMIT 1
    ) ph ON true
    WHERE ${conditions.join(" AND ")}
    ORDER BY ph.embedding <=> $1
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

searchRouter.post("/visual", upload.single("photo"), async (req: AuthedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "photo_required" });
  }

  const filters = {
    minAge: req.body.minAge ? Number(req.body.minAge) : undefined,
    maxAge: req.body.maxAge ? Number(req.body.maxAge) : undefined,
    gender: req.body.gender || undefined,
  };

  let embedding: number[];
  try {
    embedding = await getEmbedding(req.file.buffer);
  } catch (err) {
    return res.status(502).json({ error: "embedding_service_unavailable" });
  }
  const embeddingLiteral = toVectorLiteral(embedding);
  const inspirationPhotoUrl = await saveUploadedFile(req.file.buffer, generateFilename(req.file.originalname, "insp-"), req.file.mimetype);

  const searchResult = await pool.query(
    `INSERT INTO search_queries (user_id, inspiration_photo_url, embedding, filters_json)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [req.userId, inspirationPhotoUrl, embeddingLiteral, JSON.stringify(filters)]
  );
  const searchId = searchResult.rows[0].id;

  const results = await fetchResultsPage(embeddingLiteral, req.userId!, filters, 0);

  res.status(201).json({ searchId, results, page: 0, expandedSearch: results.length === 0 });
});

const RELIGION_LABELS: Record<string, string> = {
  "דתי/ה": "religious",
  "מסורתי/ת": "traditional",
  "חילוני/ת": "secular",
};
const SMOKING_LABELS: Record<string, string> = {
  "🚭 לא": "never",
  "🚬 כן": "regularly",
  "💨 רק באירועים": "sometimes",
};
const GOAL_LABELS: Record<string, string> = {
  "💍 קשר רציני": "serious",
  "☕ נזרום ונראה": "casual_open",
  "🥂 קשר קליל": "light",
  "💐 נישואין": "marriage",
};

searchRouter.post("/traits", async (req: AuthedRequest, res) => {
  const body = req.body as Record<string, string | number | undefined>;
  const ageMin = Number(body.ageMin) || 18;
  const ageMax = Number(body.ageMax) || 65;
  const religion = body.religionPref ? RELIGION_LABELS[String(body.religionPref)] : undefined;
  const smoking = body.smoking ? SMOKING_LABELS[String(body.smoking)] : undefined;
  const goal = body.goal ? GOAL_LABELS[String(body.goal)] : undefined;
  const region = body.regionPref && body.regionPref !== "לא משנה לי" ? String(body.regionPref) : undefined;

  const conditions: string[] = [
    "p.visible_in_ai_search = true",
    "p.user_id != $1",
    "NOT EXISTS (SELECT 1 FROM interactions bi WHERE bi.user_id = $1 AND bi.target_profile_id = p.id AND bi.type = 'block')",
  ];
  const params: any[] = [req.userId];
  let idx = 2;

  conditions.push(`date_part('year', age(p.birth_date)) >= $${idx++}`);
  params.push(ageMin);
  conditions.push(`date_part('year', age(p.birth_date)) <= $${idx++}`);
  params.push(ageMax === 65 ? 200 : ageMax);
  if (religion) {
    conditions.push(`p.religion = $${idx++}`);
    params.push(religion);
  }
  if (smoking) {
    conditions.push(`p.smoking = $${idx++}`);
    params.push(smoking);
  }
  if (goal) {
    conditions.push(`p.looking_for = $${idx++}`);
    params.push(goal);
  }
  if (region) {
    conditions.push(`p.region = $${idx++}`);
    params.push(region);
  }

  const filtersJson = { ageMin, ageMax, religion, smoking, goal, region, raw: body };

  const searchInsert = await pool.query(
    `INSERT INTO search_queries (user_id, filters_json) VALUES ($1, $2) RETURNING id`,
    [req.userId, JSON.stringify(filtersJson)]
  );
  const searchId = searchInsert.rows[0].id;

  const query = `
    SELECT p.id AS profile_id, p.display_name, p.birth_date, p.region, ph.storage_url AS primary_photo_url, 0 AS distance
    FROM profiles p
    LEFT JOIN LATERAL (
      SELECT storage_url FROM profile_photos WHERE profile_id = p.id ORDER BY is_primary DESC, created_at ASC LIMIT 1
    ) ph ON true
    WHERE ${conditions.join(" AND ")}
    ORDER BY p.updated_at DESC
    LIMIT 40
  `;
  const results = await pool.query(query, params);

  res.status(201).json({ searchId, results: results.rows, page: 0, expandedSearch: results.rows.length === 0 });
});

searchRouter.get("/results/:searchId", async (req: AuthedRequest, res) => {
  const page = req.query.page ? Number(req.query.page) : 0;

  const searchResult = await pool.query(
    "SELECT embedding, filters_json FROM search_queries WHERE id = $1 AND user_id = $2",
    [req.params.searchId, req.userId]
  );
  const search = searchResult.rows[0];
  if (!search) {
    return res.status(404).json({ error: "search_not_found" });
  }

  const results = await fetchResultsPage(search.embedding, req.userId!, search.filters_json, page);

  res.json({ results, page, expandedSearch: results.length === 0 && page === 0 });
});
