import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import { listConversations } from "@/lib/history";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  waiting_for_approval: "bg-amber-50 text-amber-800 border-amber-200",
  completed: "bg-zinc-100 text-zinc-600 border-zinc-200",
  expired: "bg-zinc-100 text-zinc-400 border-zinc-200",
};

export default async function ConversationsPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const conversations = await listConversations(id);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <nav className="text-xs text-muted-foreground">
          <Link href="/clients" className="hover:text-foreground">
            Clients
          </Link>{" "}
          /{" "}
          <Link href={`/clients/${id}`} className="hover:text-foreground">
            {client.name}
          </Link>{" "}
          / <span>Conversations</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">
          Conversations
        </h1>
        <p className="text-sm text-muted-foreground">
          {conversations.length === 0
            ? "No conversations yet."
            : `${conversations.length} recent conversation${conversations.length === 1 ? "" : "s"}.`}
        </p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => {
            const messages = Array.isArray(c.claude_messages)
              ? c.claude_messages
              : [];
            const lastTextMessage = getLastUserText(messages);
            return (
              <article
                key={c.id}
                className="rounded-md border bg-card p-4 text-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      STATUS_STYLES[c.status] ?? STATUS_STYLES.expired
                    }`}
                  >
                    {c.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.updated_at).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {messages.length}{" "}
                    {messages.length === 1 ? "message" : "messages"}
                  </p>
                  {lastTextMessage && (
                    <p className="line-clamp-2 text-sm text-foreground">
                      &ldquo;{lastTextMessage}&rdquo;
                    </p>
                  )}
                  {c.pending_image_url && (
                    <p className="text-xs text-muted-foreground">
                      Pending image:{" "}
                      <a
                        href={c.pending_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        open
                      </a>
                    </p>
                  )}
                </div>
                <div className="mt-3 border-t pt-2 font-mono text-[10px] text-muted-foreground">
                  ID: {c.id}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getLastUserText(messages: unknown[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as { role?: string; content?: unknown };
    if (m?.role !== "user") continue;
    if (typeof m.content === "string") return truncate(m.content, 200);
    if (Array.isArray(m.content)) {
      for (const part of m.content) {
        const p = part as { type?: string; text?: string };
        if (p?.type === "text" && typeof p.text === "string") {
          return truncate(p.text, 200);
        }
      }
    }
  }
  return null;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

function EmptyState() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-muted/10">
      <p className="text-sm font-medium">No conversations yet</p>
      <p className="text-xs text-muted-foreground">
        The client hasn&apos;t texted the WhatsApp agent yet.
      </p>
    </div>
  );
}
