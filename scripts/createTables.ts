import { pool } from "../src/lib/db";

async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date DATE NOT NULL,
        merchant TEXT,
        category TEXT,
        amount NUMERIC,
        currency TEXT,
        memo TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS funds (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fund_nav (
        id SERIAL PRIMARY KEY,
        fund_id TEXT REFERENCES funds(id),
        nav_date DATE,
        nav NUMERIC
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS holdings (
        id SERIAL PRIMARY KEY,
        fund_id TEXT REFERENCES funds(id),
        units NUMERIC,
        purchase_date DATE,
        purchase_nav NUMERIC
      );
    `);

    console.log("Tables created successfully!");
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

createTables();