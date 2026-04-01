import { Pool, type QueryResult } from "pg";

const pool = new Pool({
  host: process.env.NCLOUD_DB_HOST || "223.130.141.26",
  port: Number(process.env.NCLOUD_DB_PORT) || 5432,
  database: process.env.NCLOUD_DB_NAME || "foodagent_db",
  user: process.env.NCLOUD_DB_USER || "foodagent",
  password: process.env.NCLOUD_DB_PASSWORD || "FoodAgent2026",
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
});

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result: QueryResult = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rowCount || 0;
  } finally {
    client.release();
  }
}

export function useNcloudDb(): boolean {
  const envVal = process.env.USE_NCLOUD_DB;
  if (envVal !== undefined) return envVal === "true";
  return true;
}

export { pool };
