// Pure types and helpers for the clients model. This file must NOT import
// anything that pulls in `pg` (or any other Node-only module) so that client
// components can safely import from it.

export interface ClientSummary {
  id: string;
  name: string;
  phone_number: string;
  wordpress_url: string;
  active: boolean;
  locked_until: Date | string | null;
  failed_pin_attempts: number;
  session_expires_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export type ClientStatus = "active" | "inactive" | "locked";

export function resolveStatus(c: ClientSummary): ClientStatus {
  if (!c.active) return "inactive";
  if (c.locked_until && new Date(c.locked_until) > new Date()) return "locked";
  return "active";
}

export function hasLiveSession(c: ClientSummary): boolean {
  return !!c.session_expires_at && new Date(c.session_expires_at) > new Date();
}
