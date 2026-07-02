# robinhood-mcp

An MCP (Model Context Protocol) server that exposes your Robinhood brokerage
account — quotes, positions, portfolio, order history — as tools, plus the
ability to place and cancel orders.

It is a **standalone package**: it has no dependency on the rest of this
repository and can be copied out and run on its own.

## ⚠️ Real money, unofficial API

- Robinhood has no official public trading API. This client speaks the same
  undocumented endpoints used by the Robinhood mobile/web apps (the same
  approach as the popular open-source `robin_stocks` Python library). Use at
  your own risk; Robinhood could change or block these endpoints at any time.
- `place_order` and `cancel_order` act on your **real account with real
  money**. Both tools require an explicit `confirm: true` argument as a
  safety guard — an agent calling them without setting it will have the
  call rejected.
- Only run this against an account you own, and only in a client/agent
  session you trust with trading authority.

## Setup

```bash
cd robinhood-mcp
npm install
cp .env.example .env   # then fill in your credentials
npm run build
```

### Credentials

Set these environment variables (e.g. in `.env`, or in your MCP client's
server config):

| Variable | Required | Description |
| --- | --- | --- |
| `ROBINHOOD_USERNAME` | yes | Your Robinhood login email |
| `ROBINHOOD_PASSWORD` | yes | Your Robinhood login password |
| `ROBINHOOD_MFA_SECRET` | recommended | Base32 TOTP secret from adding an authenticator app as a 2FA method on your Robinhood account. When set, MFA codes are generated automatically on every login. |

On first login, tokens are cached in `~/.robinhood-mcp/session.json`
(0600 permissions) so subsequent runs reuse the refresh token instead of
logging in from scratch. Delete that file to force a fresh login.

## Running

As a standalone process speaking MCP over stdio:

```bash
npm start
```

### Using with an MCP client (e.g. Claude Code / Claude Desktop)

Add an entry to your client's MCP server config:

```json
{
  "mcpServers": {
    "robinhood": {
      "command": "node",
      "args": ["/absolute/path/to/robinhood-mcp/dist/index.js"],
      "env": {
        "ROBINHOOD_USERNAME": "you@example.com",
        "ROBINHOOD_PASSWORD": "...",
        "ROBINHOOD_MFA_SECRET": "..."
      }
    }
  }
}
```

## Tools

| Tool | Description |
| --- | --- |
| `get_quotes` | Quote data for one or more ticker symbols |
| `get_accounts` | List brokerage accounts, buying power, cash |
| `get_positions` | Current stock positions |
| `get_portfolio` | Portfolio-level equity/market value summary |
| `list_orders` | Recent order history |
| `place_order` | Place a buy/sell order (requires `confirm: true`) |
| `cancel_order` | Cancel an open order by id (requires `confirm: true`) |
