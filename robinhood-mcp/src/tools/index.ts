import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RobinhoodClient } from "../robinhoodClient.js";

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
}

async function firstAccountUrl(client: RobinhoodClient): Promise<string> {
  const accounts = await client.getAccounts();
  const account = accounts.results[0];
  if (!account) throw new Error("No Robinhood account found for this login.");
  return account.url;
}

export function registerTools(server: McpServer, client: RobinhoodClient) {
  server.tool(
    "get_quotes",
    "Get real-time-ish quote data (price, bid/ask, previous close) for one or more stock ticker symbols.",
    { symbols: z.array(z.string()).min(1).describe("Ticker symbols, e.g. [\"AAPL\", \"MSFT\"]") },
    async ({ symbols }) => {
      try {
        return textResult(await client.getQuotes(symbols));
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_accounts",
    "List the Robinhood brokerage accounts for the authenticated user, including buying power and cash balances.",
    {},
    async () => {
      try {
        return textResult(await client.getAccounts());
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_positions",
    "List current stock positions held in the account.",
    { nonzero_only: z.boolean().default(true).describe("Only include positions with a nonzero share count") },
    async ({ nonzero_only }) => {
      try {
        return textResult(await client.getPositions(nonzero_only));
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "get_portfolio",
    "Get portfolio-level summary (equity, market value, day change) for the account.",
    {},
    async () => {
      try {
        const accounts = await client.getAccounts();
        const account = accounts.results[0];
        if (!account) throw new Error("No Robinhood account found for this login.");
        const accountNumber = account.account_number ?? account.url.split("/").filter(Boolean).pop();
        return textResult(await client.getPortfolio(accountNumber));
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "list_orders",
    "List recent orders (open, filled, cancelled) on the account, most recent first.",
    { limit: z.number().int().min(1).max(100).default(20) },
    async ({ limit }) => {
      try {
        return textResult(await client.getOrders(limit));
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "place_order",
    "Place a buy or sell order for a stock. THIS CAN EXECUTE A REAL TRADE WITH REAL MONEY. " +
      "The `confirm` parameter must be explicitly set to true or the order will be rejected.",
    {
      symbol: z.string().describe("Ticker symbol, e.g. \"AAPL\""),
      side: z.enum(["buy", "sell"]),
      quantity: z.string().describe("Number of shares as a string, e.g. \"1\" or \"0.5\" for fractional shares"),
      order_type: z.enum(["market", "limit"]).default("market"),
      limit_price: z.string().optional().describe("Required when order_type is 'limit'"),
      time_in_force: z.enum(["gfd", "gtc"]).default("gfd").describe("gfd = good for day, gtc = good till cancelled"),
      extended_hours: z.boolean().default(false),
      confirm: z.boolean().describe("Must be set to true to actually submit the order"),
    },
    async ({ symbol, side, quantity, order_type, limit_price, time_in_force, extended_hours, confirm }) => {
      if (!confirm) {
        return errorResult(
          "Order not submitted: 'confirm' must be explicitly set to true to place a real trade."
        );
      }
      try {
        const accountUrl = await firstAccountUrl(client);
        const result = await client.placeOrder({
          accountUrl,
          symbol,
          side,
          quantity,
          orderType: order_type,
          timeInForce: time_in_force,
          limitPrice: limit_price,
          extendedHours: extended_hours,
        });
        return textResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.tool(
    "cancel_order",
    "Cancel an open order by its Robinhood order id. THIS CANCELS A REAL PENDING TRADE. " +
      "The `confirm` parameter must be explicitly set to true or the cancellation will be rejected.",
    {
      order_id: z.string(),
      confirm: z.boolean().describe("Must be set to true to actually cancel the order"),
    },
    async ({ order_id, confirm }) => {
      if (!confirm) {
        return errorResult(
          "Cancellation not submitted: 'confirm' must be explicitly set to true."
        );
      }
      try {
        return textResult(await client.cancelOrder(order_id));
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
