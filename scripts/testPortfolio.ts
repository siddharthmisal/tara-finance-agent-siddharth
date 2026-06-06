import { pool } from "../src/lib/db";

async function test() {
  const result = await pool.query(`
    SELECT
      f.name,
      h.units,
      h.purchase_nav,
      fn.nav as current_nav,
      ROUND(
        (h.units * fn.nav)::numeric,
        2
      ) as current_value
    FROM holdings h
    JOIN funds f
      ON h.fund_id = f.id
    JOIN (
      SELECT DISTINCT ON (fund_id)
        fund_id,
        nav
      FROM fund_nav
      ORDER BY fund_id, nav_date DESC
    ) fn
      ON fn.fund_id = h.fund_id
    ORDER BY current_value DESC
  `);

  console.table(result.rows);

  await pool.end();
}

test();