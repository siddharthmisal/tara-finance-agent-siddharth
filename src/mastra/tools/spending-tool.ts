import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { pool } from "../../lib/db";

export const spendingTool = createTool({
  id: "spending-analysis",

  description:
    "Analyze user spending by category, merchant, date range, trends, distributions and transactions",

  inputSchema: z.object({
    category: z.string().optional(),
    merchant: z.string().optional(),

    limit: z.number().optional(),

    startDate: z.string().optional(),
    endDate: z.string().optional(),

    summary: z.boolean().optional(),

    trend: z.boolean().optional(),

    biggestTransactions: z.boolean().optional(),

    categoryDistribution: z.boolean().optional(),

    topMerchants: z.boolean().optional(),

    comparison: z.boolean().optional(),

    period1Start: z.string().optional(),
    period1End: z.string().optional(),

    period2Start: z.string().optional(),
    period2End: z.string().optional(),   
  }),

  outputSchema: z.object({
  total_spent: z.number(),
  category: z.string(),
  currency: z.string(),
}).optional(),

  execute: async (params) => {

  const context =
    (params as any)?.context ??
    (params as any)?.input ??
    params;

  const category = context?.category;
  const merchant = context?.merchant;

  const limit = context?.limit || 10;

  const startDate = context?.startDate;
  const endDate = context?.endDate;

  const summary = context?.summary;

  const trend = context?.trend;

  const biggestTransactions = context?.biggestTransactions;

  const categoryDistribution = context?.categoryDistribution;

  const topMerchants = context?.topMerchants;
  
  const comparison = context?.comparison;

const period1Start = context?.period1Start;
const period1End = context?.period1End;

const period2Start = context?.period2Start;
const period2End = context?.period2End;
  /*
 * SPENDING COMPARISON
 */
if (comparison) {
  const period1 = await pool.query(
    `
    SELECT
      COALESCE(SUM(amount::numeric),0) AS total_spent
    FROM transactions
    WHERE date >= $1
      AND date <= $2
    `,
    [period1Start, period1End]
  );

  const period2 = await pool.query(
    `
    SELECT
      COALESCE(SUM(amount::numeric),0) AS total_spent
    FROM transactions
    WHERE date >= $1
      AND date <= $2
    `,
    [period2Start, period2End]
  );

  const total1 = Number(period1.rows[0].total_spent);
const total2 = Number(period2.rows[0].total_spent);

const difference = total2 - total1;

const percentChange =
  total1 === 0
    ? 0
    : (difference / total1) * 100;


return {
  period1Total: total1,
  period2Total: total2,
  difference,
  percentChange,
};
}
    /*
     * MONTHLY TREND
     */
    if (trend) {
      const conditions: string[] = [];
      const values: any[] = [];

      if (startDate) {
        values.push(startDate);
        conditions.push(`date >= $${values.length}`);
      }

      if (endDate) {
        values.push(endDate);
        conditions.push(`date <= $${values.length}`);
      }

      let query = `
        SELECT
          DATE_TRUNC('month', date) AS month,
          SUM(amount::numeric) AS total_spent
        FROM transactions
      `;

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += `
        GROUP BY month
        ORDER BY month
      `;

      const result = await pool.query(query, values);

      return result.rows;
    }

    /*
     * CATEGORY DISTRIBUTION
     */
    if (categoryDistribution) {
      const conditions: string[] = [];
      const values: any[] = [];

      if (startDate) {
        values.push(startDate);
        conditions.push(`date >= $${values.length}`);
      }

      if (endDate) {
        values.push(endDate);
        conditions.push(`date <= $${values.length}`);
      }

      let query = `
        SELECT
          category,
          SUM(amount::numeric) AS total_spent
        FROM transactions
      `;

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += `
        GROUP BY category
        ORDER BY total_spent DESC
      `;

      const result = await pool.query(query, values);

      return result.rows;
    }

    /*
     * BIGGEST TRANSACTIONS
     */
    if (biggestTransactions) {
      const conditions: string[] = [];
      const values: any[] = [];

      if (startDate) {
        values.push(startDate);
        conditions.push(`date >= $${values.length}`);
      }

      if (endDate) {
        values.push(endDate);
        conditions.push(`date <= $${values.length}`);
      }

      let query = `
        SELECT
          date,
          merchant,
          category,
          amount
        FROM transactions
      `;

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      values.push(limit);

      query += `
        ORDER BY amount::numeric DESC
        LIMIT $${values.length}
      `;

      const result = await pool.query(query, values);

      return result.rows;
    }

    /*
     * TOP MERCHANTS
     */
    if (topMerchants) {
      const conditions: string[] = [];
      const values: any[] = [];

      if (category) {
        values.push(category);
        conditions.push(`category ILIKE $${values.length}`);
      }

      if (startDate) {
        values.push(startDate);
        conditions.push(`date >= $${values.length}`);
      }

      if (endDate) {
        values.push(endDate);
        conditions.push(`date <= $${values.length}`);
      }

      let query = `
        SELECT
          merchant,
          SUM(amount::numeric) AS total_spent
        FROM transactions
      `;

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += `
        GROUP BY merchant
        ORDER BY total_spent DESC
      `;

      values.push(limit);

      query += `
        LIMIT $${values.length}
      `;

      const result = await pool.query(query, values);

      return result.rows;
    }

    /*
     * TOTAL SPEND FOR A MERCHANT
     */
    if (merchant && summary) {
      const values: any[] = [];
      const conditions: string[] = [];

       values.push(`%${merchant}%`);
       conditions.push(`merchant ILIKE $${values.length}`);

      if (startDate) {
        values.push(startDate);
        conditions.push(`date >= $${values.length}`);
      }

      if (endDate) {
        values.push(endDate);
        conditions.push(`date <= $${values.length}`);
      }

      let query = `
        SELECT
          COALESCE(SUM(amount::numeric),0) AS total_spent
        FROM transactions
        WHERE ${conditions.join(" AND ")}
      `;

      const result = await pool.query(query, values);

      return result.rows;
    }

   /*
 * TOTAL SPEND FOR A CATEGORY
 */
if (category && summary) {
  const values: any[] = [];
  const conditions: string[] = [];

  values.push(`%${category}%`);
  conditions.push(`category ILIKE $${values.length}`);

  if (startDate) {
    values.push(startDate);
    conditions.push(`date >= $${values.length}`);
  }

  if (endDate) {
    values.push(endDate);
    conditions.push(`date <= $${values.length}`);
  }

  const query = `
    SELECT
      COALESCE(SUM(amount::numeric),0) AS total_spent
    FROM transactions
    WHERE ${conditions.join(" AND ")}
  `;

  const result = await pool.query(query, values);

  return {
    total_spent: Number(result.rows[0].total_spent),
    category,
    currency: "INR",
  };
}
    /*
     * TOTAL SPENDING
     */
    if (summary) {
      const conditions: string[] = [];
      const values: any[] = [];

      if (startDate) {
        values.push(startDate);
        conditions.push(`date >= $${values.length}`);
      }

      if (endDate) {
        values.push(endDate);
        conditions.push(`date <= $${values.length}`);
      }

      let query = `
        SELECT
          COALESCE(SUM(amount::numeric),0) AS total_spent
        FROM transactions
      `;

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      const result = await pool.query(query, values);

      return result.rows;
    }

    /*
     * DEFAULT CATEGORY / MERCHANT ANALYSIS
     */
    const conditions: string[] = [];
    const values: any[] = [];

    if (category) {
      values.push(category);
      conditions.push(`category ILIKE $${values.length}`);
    }

    if (merchant) {
      values.push(`%${merchant}%`);
      conditions.push(`merchant ILIKE $${values.length}`);
    }

    if (startDate) {
      values.push(startDate);
      conditions.push(`date >= $${values.length}`);
    }

    if (endDate) {
      values.push(endDate);
      conditions.push(`date <= $${values.length}`);
    }

    let query = `
      SELECT
        category,
        merchant,
        SUM(amount::numeric) AS total_spent
      FROM transactions
    `;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += `
      GROUP BY category, merchant
      ORDER BY total_spent DESC
    `;

    values.push(limit);

    query += `
      LIMIT $${values.length}
    `;

    const result = await pool.query(query, values);

    return result.rows;
  },
});