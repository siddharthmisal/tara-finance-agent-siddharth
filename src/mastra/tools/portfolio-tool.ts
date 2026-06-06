import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { pool } from "../../lib/db";

export const portfolioTool = createTool({
  id: "portfolio-analysis",

  description:
    "Returns portfolio holdings, values and mutual fund performance",

  inputSchema: z.object({
    bestFund: z.boolean().optional(),
    worstFund: z.boolean().optional(),
    rankFunds: z.boolean().optional(),
    holdingReturns: z.boolean().optional(),
    largestHolding: z.boolean().optional(),
  }),

  outputSchema: z.any(),

  execute: async (params) => {
    const context =
      (params as any)?.context ??
      (params as any)?.input ??
      params;

    const bestFund = context?.bestFund;
    const worstFund = context?.worstFund;
    const rankFunds = context?.rankFunds;
    const holdingReturns = context?.holdingReturns;
    const largestHolding = context?.largestHolding;

    const query = `
      SELECT
        f.name,
        h.units,
        h.purchase_nav,
        fn.nav AS current_nav,

        ROUND(
          (h.units * h.purchase_nav)::numeric,
          2
        ) AS purchase_value,

        ROUND(
          (h.units * fn.nav)::numeric,
          2
        ) AS current_value,

        ROUND(
          (
            ((fn.nav - h.purchase_nav)
            / h.purchase_nav) * 100
          )::numeric,
          2
        ) AS return_percent,

        ROUND(
          (
            (h.units * fn.nav)
            - (h.units * h.purchase_nav)
          )::numeric,
          2
        ) AS profit_loss

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
    `;

    const result = await pool.query(query);

    /*
     * BEST FUND
     */
    if (bestFund) {
      return result.rows.sort(
        (a, b) =>
          Number(b.return_percent) -
          Number(a.return_percent)
      )[0];
    }

    /*
     * WORST FUND
     */
    if (worstFund) {
      return result.rows.sort(
        (a, b) =>
          Number(a.return_percent) -
          Number(b.return_percent)
      )[0];
    }

    /*
     * FUND RANKING
     */
    if (rankFunds) {
      return result.rows.sort(
        (a, b) =>
          Number(b.return_percent) -
          Number(a.return_percent)
      );
    }

    /*
     * HOLDING RETURNS
     */
    if (holdingReturns) {
      return result.rows.map((row) => ({
        fund: row.name,
        purchase_value: row.purchase_value,
        current_value: row.current_value,
        profit_loss: row.profit_loss,
        return_percent: row.return_percent,
      }));
    }

    /*
 * LARGEST HOLDING
 */
if (largestHolding) {
  return result.rows.sort(
    (a, b) =>
      Number(b.current_value) -
      Number(a.current_value)
  )[0];
}

    /*
     * DEFAULT PORTFOLIO VIEW
     */
    return result.rows;
  },
});