import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { getEmbedding } from "./embeddings";
import { toVectorLiteral } from "./db";

// Test/demo profiles so search always has someone to find while QA-ing
// without real users signed up yet. Safe to re-run — skips existing seed users,
// and repairs their photo if it's stale (wiped local-disk path, or an older
// placeholder). Photos are AI-generated faces (thispersondoesnotexist.com,
// StyleGAN2 — no real person), pre-uploaded to our own R2 bucket so they're
// permanent instead of depending on an external generator at request time.
const R2_PUBLIC_BASE = "https://pub-70dfa78fa63b416ebf4fd8f54b53ed18.r2.dev";
const SEED_PROFILES = [
  { email: "dana.seed@crushai.local", name: "דנה", age: 26, gender: "female", interestedIn: "men", region: "תל אביב", bio: "אוהבת טיולים, קפה טוב וסרטי אימה.", photoKey: "dana" },
  { email: "tom.seed@crushai.local", name: "תום", age: 29, gender: "male", interestedIn: "women", region: "רמת גן", bio: "מהנדס תוכנה בלילה, גיטריסט בסופ\"ש.", photoKey: "tom" },
  { email: "maya.seed@crushai.local", name: "מיה", age: 24, gender: "female", interestedIn: "men", region: "פתח תקווה", bio: "סטודנטית לעיצוב. אוהבת אמנות ויוגה.", photoKey: "maya" },
  { email: "itay.seed@crushai.local", name: "איתי", age: 31, gender: "male", interestedIn: "women", region: "גבעתיים", bio: "שף במקצועו. אוהב בישול, טניס וספרים.", photoKey: "itay" },
  { email: "noa.seed@crushai.local", name: "נועה", age: 27, gender: "female", interestedIn: "men", region: "חיפה", bio: "אוהבת מוזיקה חיה וערבים שקטים.", photoKey: "noa" },
  { email: "ron.seed@crushai.local", name: "רון", age: 30, gender: "male", interestedIn: "women", region: "ירושלים", bio: "רץ מרתונים, עובד בהייטק.", photoKey: "ron" },
];

export async function runSeed(pool: Pool): Promise<void> {
  const passwordHash = await bcrypt.hash("seed-account-not-for-login", 12);

  for (const p of SEED_PROFILES) {
    const photoUrl = `${R2_PUBLIC_BASE}/seed-photos/${p.photoKey}.jpg`;

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [p.email]);
    let profileId: string;

    if (existing.rowCount) {
      const profileResult = await pool.query("SELECT id FROM profiles WHERE user_id = $1", [existing.rows[0].id]);
      profileId = profileResult.rows[0].id;
    } else {
      const year = new Date().getFullYear() - p.age;
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, auth_provider, terms_accepted_at) VALUES ($1, $2, 'email', now()) RETURNING id`,
        [p.email, passwordHash]
      );
      const userId = userResult.rows[0].id;

      const profileResult = await pool.query(
        `INSERT INTO profiles (user_id, display_name, birth_date, gender, interested_in, bio, region)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [userId, p.name, `${year}-06-15`, p.gender, p.interestedIn, p.bio, p.region]
      );
      profileId = profileResult.rows[0].id;
      console.log(`seeded ${p.name} (${p.email})`);
    }

    // Re-run-safe: fixes photos left pointing at wiped local-disk paths, or at
    // an older placeholder (e.g. the dicebear cartoon avatars used previously).
    const photo = await pool.query(
      "SELECT id, storage_url, embedding FROM profile_photos WHERE profile_id = $1 AND is_primary = true",
      [profileId]
    );
    const needsEmbedding = !photo.rowCount || photo.rows[0].storage_url !== photoUrl || !photo.rows[0].embedding;

    let embeddingLiteral: string | null = null;
    if (needsEmbedding) {
      try {
        const imageBuffer = Buffer.from(await (await fetch(photoUrl)).arrayBuffer());
        embeddingLiteral = toVectorLiteral(await getEmbedding(imageBuffer));
      } catch (err) {
        console.warn(`  embedding_service_unavailable — seed photo for ${p.name} saved without one`);
      }
    }

    if (!photo.rowCount) {
      await pool.query(
        `INSERT INTO profile_photos (profile_id, storage_url, embedding, is_primary) VALUES ($1, $2, $3, true)`,
        [profileId, photoUrl, embeddingLiteral]
      );
      console.log(`  added missing photo for ${p.name}`);
    } else if (photo.rows[0].storage_url !== photoUrl) {
      await pool.query("UPDATE profile_photos SET storage_url = $1, embedding = $2 WHERE id = $3", [
        photoUrl,
        embeddingLiteral,
        photo.rows[0].id,
      ]);
      console.log(`  updated photo for ${p.name}`);
    } else if (!photo.rows[0].embedding && embeddingLiteral) {
      await pool.query("UPDATE profile_photos SET embedding = $1 WHERE id = $2", [embeddingLiteral, photo.rows[0].id]);
      console.log(`  backfilled embedding for ${p.name}`);
    }

    // Removes exact-duplicate impostor profiles left behind by some earlier,
    // non-seed-script process — same name/region/bio as the real seed profile,
    // under a different account, with a photo pointing at a wiped local-disk
    // path. Matches on all three fields plus the broken photo so this can
    // never touch a real user who happens to share a seed's display name.
    const dupes = await pool.query(
      `SELECT u.id AS user_id
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       JOIN profile_photos ph ON ph.profile_id = p.id AND ph.is_primary = true
       WHERE p.display_name = $1 AND p.region = $2 AND p.bio = $3
         AND u.email IS DISTINCT FROM $4
         AND ph.storage_url LIKE '/uploads/%'`,
      [p.name, p.region, p.bio, p.email]
    );
    for (const dupe of dupes.rows) {
      await pool.query("DELETE FROM users WHERE id = $1", [dupe.user_id]);
      console.log(`  removed duplicate impostor profile for ${p.name}`);
    }
  }
}

// CLI entrypoint for local/manual use: `npm run seed`.
// require.main check keeps this from firing when imported (e.g. by index.ts on boot).
if (require.main === module) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  runSeed(pool)
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
