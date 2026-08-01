import "dotenv/config";
import { Pool } from "pg";
import { getEmbedding } from "./embeddings";
import { toVectorLiteral } from "./db";

// One-off: compute embeddings for profile_photos rows that don't have one yet
// (seed/demo profiles created before the AI embedding service was live).
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(
    "SELECT id, storage_url FROM profile_photos WHERE embedding IS NULL"
  );
  console.log(`${rows.length} photo(s) missing an embedding`);

  for (const row of rows) {
    try {
      const res = await fetch(row.storage_url);
      if (!res.ok) throw new Error(`fetch_failed_${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const embedding = await getEmbedding(buffer);
      await pool.query("UPDATE profile_photos SET embedding = $1 WHERE id = $2", [
        toVectorLiteral(embedding),
        row.id,
      ]);
      console.log(`embedded ${row.id}`);
    } catch (err) {
      console.error(`failed ${row.id} (${row.storage_url}):`, err);
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
