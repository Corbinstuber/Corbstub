#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RobinhoodClient } from "./robinhoodClient.js";
import { registerTools } from "./tools/index.js";

async function main() {
  const server = new McpServer({ name: "robinhood-mcp", version: "0.1.0" });
  const client = new RobinhoodClient();

  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("robinhood-mcp failed to start:", err);
  process.exit(1);
});
