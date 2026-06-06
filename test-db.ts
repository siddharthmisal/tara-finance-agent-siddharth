import { pool } from "./src/lib/db";

async function test() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Connected to Neon!");
    console.log(result.rows);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await pool.end();
  }
}

test();