import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const STATE_DIR = join(homedir(), ".robinhood-mcp");
const STATE_FILE = join(STATE_DIR, "session.json");

export interface StoredSession {
  deviceToken: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

async function readState(): Promise<StoredSession | undefined> {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    return JSON.parse(raw) as StoredSession;
  } catch {
    return undefined;
  }
}

async function writeState(state: StoredSession): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true, mode: 0o700 });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), { mode: 0o600 });
}

export async function loadSession(): Promise<StoredSession> {
  const existing = await readState();
  if (existing?.deviceToken) return existing;
  const fresh: StoredSession = { deviceToken: randomUUID() };
  await writeState(fresh);
  return fresh;
}

export async function saveTokens(
  session: StoredSession,
  tokens: { accessToken: string; refreshToken: string; expiresIn: number }
): Promise<StoredSession> {
  const updated: StoredSession = {
    ...session,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    // refresh a minute early to avoid edge-of-expiry failures
    expiresAt: Date.now() + (tokens.expiresIn - 60) * 1000,
  };
  await writeState(updated);
  return updated;
}
