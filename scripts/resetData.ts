import { pool } from "../src/lib/db";

async function reset() {
  try {
    await pool.query("DELETE FROM holdings");
    await pool.query("DELETE FROM fund_nav");
    await pool.query("DELETE FROM funds");
    await pool.query("DELETE FROM transactions");

    console.log("Data cleared");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

reset();
