// Read-only queries for the conversations and change_log tables, scoped to
// a single client. Used by the detail page's Conversations and Change log tabs.

import "server-only";
import { query } from "@/lib/db";

export interface ConversationRow {
  id: string;
  client_id: string;
  status: "active" | "waiting_for_approval" | "completed" | "expired";
  claude_messages: unknown[];
  pending_action: unknown | null;
  pending_image_url: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ChangeLogRow {
  id: string;
  client_id: string;
  conversation_id: string | null;
  change_type: "text" | "image" | "product" | "media";
  description: string;
  target_page: string | null;
  target_element: string | null;
  before_value: string | null;
  after_value: string | null;
  rolled_back: boolean;
  created_at: Date | string;
}

export async function listConversations(
  clientId: string,
  limit = 50
): Promise<ConversationRow[]> {
  const r = await query<ConversationRow>(
    `SELECT id, client_id, status, claude_messages, pending_action,
            pending_image_url, created_at, updated_at
       FROM conversations
      WHERE client_id = $1
   ORDER BY updated_at DESC
      LIMIT $2`,
    [clientId, limit]
  );
  return r.rows;
}

export async function listChangeLog(
  clientId: string,
  limit = 100
): Promise<ChangeLogRow[]> {
  const r = await query<ChangeLogRow>(
    `SELECT id, client_id, conversation_id, change_type, description,
            target_page, target_element, before_value, after_value,
            rolled_back, created_at
       FROM change_log
      WHERE client_id = $1
   ORDER BY created_at DESC
      LIMIT $2`,
    [clientId, limit]
  );
  return r.rows;
}
