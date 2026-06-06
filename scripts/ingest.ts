import fs from "fs";
import path from "path";
import { pool } from "../src/lib/db";

const DATA_DIR = process.env.DATA_DIR || "./data/sample_a";

async function ingest() {
  try {
    console.log(`Loading data from ${DATA_DIR}`);
    await pool.query(`
TRUNCATE TABLE
transactions,
fund_nav,
holdings,
funds
RESTART IDENTITY CASCADE
`);

    // TRANSACTIONS

    const transactions = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "transactions.json"), "utf8")
    );

    let transactionCount = 0;

    for (const txn of transactions) {
      try {
        await pool.query(
          `
          INSERT INTO transactions
          (id, date, merchant, category, amount, currency, memo)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (id) DO NOTHING
          `,
          [
            txn.id,
            txn.date,
            txn.merchant,
            txn.category,
            txn.amount,
            txn.currency,
            txn.memo,
          ]
        );

        transactionCount++;

        if (transactionCount % 100 === 0) {
          console.log(`Inserted ${transactionCount} transactions...`);
        }
      } catch (err) {
        console.error("Transaction insert failed:");
        console.error(txn);
        console.error(err);
        throw err;
      }
    }

    console.log(`Inserted ${transactionCount} transactions`);

    // FUNDS

    const funds = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "funds.json"), "utf8")
    );

    let fundCount = 0;
    let navCount = 0;

    for (const fund of funds) {
      try {
        await pool.query(
          `
          INSERT INTO funds
          (id, name, category)
          VALUES ($1,$2,$3)
          ON CONFLICT (id) DO NOTHING
          `,
          [fund.id, fund.name, fund.category]
        );

        fundCount++;

        for (const nav of fund.nav) {
          await pool.query(
            `
            INSERT INTO fund_nav
            (fund_id, nav_date, nav)
            VALUES ($1,$2,$3)
            `,
            [fund.id, nav.date, nav.value]
          );

          navCount++;
        }
      } catch (err) {
        console.error("Fund insert failed:");
        console.error(fund.id);
        console.error(err);
        throw err;
      }
    }

    console.log(`Inserted ${fundCount} funds`);
    console.log(`Inserted ${navCount} NAV records`);

    // HOLDINGS
  
    const holdings = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "holdings.json"), "utf8")
    );

    let holdingsCount = 0;

    for (const holding of holdings) {
      try {
        await pool.query(
          `
          INSERT INTO holdings
          (fund_id, units, purchase_date, purchase_nav)
          VALUES ($1,$2,$3,$4)
          `,
          [
            holding.fund_id,
            holding.units,
            holding.purchase_date,
            holding.purchase_nav,
          ]
        );

        holdingsCount++;
      } catch (err) {
        console.error("Holding insert failed:");
        console.error(holding);
        console.error(err);
        throw err;
      }
    }

    console.log(`Inserted ${holdingsCount} holdings`);

    console.log("Ingestion complete!");
  } catch (error) {
    console.error("INGESTION FAILED");
    console.error(error);
  } finally {
    await pool.end();
  }
}

ingest();