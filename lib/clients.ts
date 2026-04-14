// Server-only data access for the clients table. Do NOT import this file
// from a "use client" component — it pulls in `pg` via lib/db.ts.

import "server-only";
import { query } from "@/lib/db";
import type { ClientSummary } from "@/lib/clients-shared";

export interface ClientFull extends ClientSummary {
  wp_api_key_encrypted: string;
  wp_api_secret_encrypted: string;
  security_pin_hash: string;
  system_prompt_config: Record<string, unknown>;
  session_token: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getClient(id: string): Promise<ClientFull | null> {
  if (!UUID_RE.test(id)) return null;
  const result = await query<ClientFull>(
    `SELECT
       id,
       name,
       phone_number,
       wordpress_url,
       wp_api_key_encrypted,
       wp_api_secret_encrypted,
       security_pin_hash,
       system_prompt_config,
       session_token,
       session_expires_at,
       failed_pin_attempts,
       locked_until,
       active,
       created_at,
       updated_at
     FROM clients
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listClients(): Promise<ClientSummary[]> {
  const result = await query<ClientSummary>(
    `SELECT
       id,
       name,
       phone_number,
       wordpress_url,
       active,
       locked_until,
       failed_pin_attempts,
       session_expires_at,
       created_at,
       updated_at
     FROM clients
     ORDER BY updated_at DESC`
  );
  return result.rows;
}

// Re-export the shared types and helpers so server code can also grab them
// from this file (one-stop shop for server callers).
export { resolveStatus, hasLiveSession } from "@/lib/clients-shared";
export type { ClientSummary, ClientStatus } from "@/lib/clients-shared";
