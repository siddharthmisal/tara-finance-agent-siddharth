import { pool } from "../src/lib/db";

async function check() {
  const transactions = await pool.query(
    "SELECT COUNT(*) FROM transactions"
  );

  const funds = await pool.query(
    "SELECT COUNT(*) FROM funds"
  );

  const holdings = await pool.query(
    "SELECT COUNT(*) FROM holdings"
  );

  console.log("Transactions:", transactions.rows[0]);
  console.log("Funds:", funds.rows[0]);
  console.log("Holdings:", holdings.rows[0]);

  await pool.end();
}

check();