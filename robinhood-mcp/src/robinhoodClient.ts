import { generate as generateTotp } from "otplib";
import { loadSession, saveTokens, type StoredSession } from "./tokenStore.js";

const API_BASE = "https://api.robinhood.com";

// Public OAuth client id used by Robinhood's own mobile clients. It is not a
// secret (it is baked into every client that speaks to this unofficial API,
// e.g. the widely used robin_stocks library) but it is required on every
// token request.
const CLIENT_ID = "c82SH0WZOsabOXGP2sxqcj34FxkvfnWRZBKlBjFS";

export class RobinhoodAuthError extends Error {}
export class RobinhoodApiError extends Error {
  constructor(message: string, public status: number, public body: unknown) {
    super(message);
  }
}

interface Credentials {
  username: string;
  password: string;
  mfaSecret?: string;
}

function credentialsFromEnv(): Credentials {
  const username = process.env.ROBINHOOD_USERNAME;
  const password = process.env.ROBINHOOD_PASSWORD;
  if (!username || !password) {
    throw new RobinhoodAuthError(
      "ROBINHOOD_USERNAME and ROBINHOOD_PASSWORD must be set in the environment."
    );
  }
  return { username, password, mfaSecret: process.env.ROBINHOOD_MFA_SECRET };
}

export class RobinhoodClient {
  private session: StoredSession | undefined;
  private authPromise: Promise<void> | undefined;

  private async ensureAuthenticated(): Promise<StoredSession> {
    const session = this.session ?? (this.session = await loadSession());

    if (session.accessToken && session.expiresAt && session.expiresAt > Date.now()) {
      return session;
    }

    // De-dupe concurrent tool calls hitting an expired token at once.
    if (!this.authPromise) {
      this.authPromise = this.authenticate().finally(() => {
        this.authPromise = undefined;
      });
    }
    await this.authPromise;
    return this.session!;
  }

  private async authenticate(): Promise<void> {
    const session = this.session ?? (this.session = await loadSession());

    if (session.refreshToken) {
      try {
        await this.tokenRequest({
          grant_type: "refresh_token",
          refresh_token: session.refreshToken,
          client_id: CLIENT_ID,
          scope: "internal",
          device_token: session.deviceToken,
        });
        return;
      } catch {
        // fall through to a full username/password login
      }
    }

    const creds = credentialsFromEnv();
    const basePayload: Record<string, string> = {
      grant_type: "password",
      username: creds.username,
      password: creds.password,
      client_id: CLIENT_ID,
      expires_in: "86400",
      scope: "internal",
      device_token: session.deviceToken,
      challenge_type: "sms",
    };

    if (creds.mfaSecret) {
      basePayload.mfa_code = await generateTotp({ secret: creds.mfaSecret });
    }

    await this.tokenRequest(basePayload);
  }

  private async tokenRequest(payload: Record<string, string>): Promise<void> {
    const session = this.session!;
    const res = await fetch(`${API_BASE}/oauth2/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new RobinhoodAuthError(
        `Robinhood login failed (${res.status}): ${JSON.stringify(data)}`
      );
    }
    if (data.mfa_required && !payload.mfa_code) {
      throw new RobinhoodAuthError(
        "Robinhood requires an MFA code. Set ROBINHOOD_MFA_SECRET to your account's " +
          "TOTP secret (from an authenticator-app setup) so it can be generated automatically."
      );
    }
    if (!data.access_token || !data.refresh_token) {
      throw new RobinhoodAuthError(`Unexpected Robinhood auth response: ${JSON.stringify(data)}`);
    }

    this.session = await saveTokens(session, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in ?? 86400,
    });
  }

  private async request<T = any>(
    path: string,
    init: RequestInit & { query?: Record<string, string | undefined> } = {}
  ): Promise<T> {
    const session = await this.ensureAuthenticated();
    const url = new URL(path.startsWith("http") ? path : `${API_BASE}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, value);
    }

    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init.headers,
      },
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;

    if (!res.ok) {
      throw new RobinhoodApiError(`Robinhood API error on ${path} (${res.status})`, res.status, data);
    }
    return data as T;
  }

  async getQuotes(symbols: string[]) {
    return this.request<{ results: any[] }>("/quotes/", {
      query: { symbols: symbols.join(",") },
    });
  }

  async getAccounts() {
    return this.request<{ results: any[] }>("/accounts/");
  }

  async getPositions(nonzeroOnly: boolean) {
    return this.request<{ results: any[] }>("/positions/", {
      query: { nonzero: nonzeroOnly ? "true" : "false" },
    });
  }

  async getPortfolio(accountNumber: string) {
    return this.request(`/portfolios/${accountNumber}/`);
  }

  async getOrders(limit = 20) {
    const data = await this.request<{ results: any[] }>("/orders/");
    return { results: data.results.slice(0, limit) };
  }

  async getInstrumentBySymbol(symbol: string) {
    const data = await this.request<{ results: any[] }>("/instruments/", {
      query: { symbol: symbol.toUpperCase() },
    });
    const instrument = data.results[0];
    if (!instrument) {
      throw new RobinhoodApiError(`No instrument found for symbol ${symbol}`, 404, data);
    }
    return instrument;
  }

  async placeOrder(params: {
    accountUrl: string;
    symbol: string;
    side: "buy" | "sell";
    quantity: string;
    orderType: "market" | "limit";
    timeInForce: "gfd" | "gtc";
    limitPrice?: string;
    extendedHours: boolean;
  }) {
    const instrument = await this.getInstrumentBySymbol(params.symbol);
    const body: Record<string, unknown> = {
      account: params.accountUrl,
      instrument: instrument.url,
      symbol: params.symbol.toUpperCase(),
      type: params.orderType,
      time_in_force: params.timeInForce,
      trigger: "immediate",
      quantity: params.quantity,
      side: params.side,
      extended_hours: params.extendedHours,
    };
    if (params.orderType === "limit") {
      if (!params.limitPrice) {
        throw new Error("limitPrice is required for limit orders");
      }
      body.price = params.limitPrice;
    }
    return this.request("/orders/", { method: "POST", body: JSON.stringify(body) });
  }

  async cancelOrder(orderId: string) {
    return this.request(`/orders/${orderId}/cancel/`, { method: "POST" });
  }
}
