import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "./db";

// Test/demo profiles so search always has someone to find while QA-ing
// without real users signed up yet. Safe to re-run — skips existing seed users.
const SEED_PROFILES = [
  { email: "dana.seed@crushai.local", name: "דנה", age: 26, gender: "female", interestedIn: "men", region: "תל אביב", bio: "אוהבת טיולים, קפה טוב וסרטי אימה.", seed: "Dana" },
  { email: "tom.seed@crushai.local", name: "תום", age: 29, gender: "male", interestedIn: "women", region: "רמת גן", bio: "מהנדס תוכנה בלילה, גיטריסט בסופ\"ש.", seed: "Tom" },
  { email: "maya.seed@crushai.local", name: "מיה", age: 24, gender: "female", interestedIn: "men", region: "פתח תקווה", bio: "סטודנטית לעיצוב. אוהבת אמנות ויוגה.", seed: "Maya" },
  { email: "itay.seed@crushai.local", name: "איתי", age: 31, gender: "male", interestedIn: "women", region: "גבעתיים", bio: "שף במקצועו. אוהב בישול, טניס וספרים.", seed: "Itay" },
  { email: "noa.seed@crushai.local", name: "נועה", age: 27, gender: "female", interestedIn: "men", region: "חיפה", bio: "אוהבת מוזיקה חיה וערבים שקטים.", seed: "Noa" },
  { email: "ron.seed@crushai.local", name: "רון", age: 30, gender: "male", interestedIn: "women", region: "ירושלים", bio: "רץ מרתונים, עובד בהייטק.", seed: "Ron" },
];

async function main() {
  const passwordHash = await bcrypt.hash("seed-account-not-for-login", 12);

  for (const p of SEED_PROFILES) {
    const photoUrl = `https://api.dicebear.com/9.x/lorelei/png?seed=${p.seed}&backgroundColor=2b1b42,4a3560,3a2e4a`;

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

    // Re-run-safe: fixes photos left pointing at wiped local-disk paths from
    // before object storage was configured (Render's disk resets on deploy).
    const photo = await pool.query(
      "SELECT id, storage_url FROM profile_photos WHERE profile_id = $1 AND is_primary = true",
      [profileId]
    );
    if (!photo.rowCount) {
      await pool.query(`INSERT INTO profile_photos (profile_id, storage_url, is_primary) VALUES ($1, $2, true)`, [
        profileId,
        photoUrl,
      ]);
      console.log(`  added missing photo for ${p.name}`);
    } else if (photo.rows[0].storage_url !== photoUrl && photo.rows[0].storage_url.startsWith("/uploads/")) {
      await pool.query("UPDATE profile_photos SET storage_url = $1 WHERE id = $2", [photoUrl, photo.rows[0].id]);
      console.log(`  fixed broken photo for ${p.name}`);
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
