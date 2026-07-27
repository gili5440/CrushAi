import { Pool } from "pg";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
