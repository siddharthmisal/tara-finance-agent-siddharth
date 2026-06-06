import { pool } from "../src/lib/db";

async function test() {
  const result = await pool.query(`
    SELECT
      category,
      ROUND(SUM(amount)::numeric,2) as total
    FROM transactions
    GROUP BY category
    ORDER BY total DESC
    LIMIT 10
  `);

  console.table(result.rows);

  await pool.end();
}

test();