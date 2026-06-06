import "dotenv/config";
import { pool } from "./src/lib/db"; // adjust path if needed

async function main() {
  const result = await pool.query(
    "SELECT * FROM transactions LIMIT 5"
  );

  console.log(result.rows);
  process.exit(0);
}

main();