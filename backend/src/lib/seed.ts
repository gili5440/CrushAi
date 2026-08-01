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
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [p.email]);
    if (existing.rowCount) {
      console.log(`skip ${p.email} (already seeded)`);
      continue;
    }

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
    const profileId = profileResult.rows[0].id;

    const photoUrl = `https://api.dicebear.com/9.x/lorelei/png?seed=${p.seed}&backgroundColor=2b1b42,4a3560,3a2e4a`;
    await pool.query(
      `INSERT INTO profile_photos (profile_id, storage_url, is_primary) VALUES ($1, $2, true)`,
      [profileId, photoUrl]
    );

    console.log(`seeded ${p.name} (${p.email})`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
