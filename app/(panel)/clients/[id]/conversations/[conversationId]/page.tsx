import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import { getConversation } from "@/lib/history";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; conversationId: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  waiting_for_approval: "bg-amber-50 text-amber-800 border-amber-200",
  completed: "bg-zinc-100 text-zinc-600 border-zinc-200",
  expired: "bg-zinc-100 text-zinc-400 border-zinc-200",
};

// ─── Anthropic message shape helpers ─────────────────────────────────────────
// A message has a role and either a string content or an array of parts.
// Parts can be: { type: "text", text }, { type: "tool_use", id, name, input },
// { type: "tool_result", tool_use_id, content }, or { type: "image", ... }.
interface TextPart {
  type: "text";
  text: string;
}
interface ToolUsePart {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}
interface ToolResultPart {
  type: "tool_result";
  tool_use_id: string;
  content: unknown;
}
interface ImagePart {
  type: "image";
  source?: { type?: string; media_type?: string; data?: string };
}
type MessagePart = TextPart | ToolUsePart | ToolResultPart | ImagePart | { type: string };

interface Message {
  role: "user" | "assistant";
  content: string | MessagePart[];
}

export default async function ConversationDetailPage({ params }: PageProps) {
  const { id, conversationId } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const conv = await getConversation(conversationId);
  if (!conv || conv.client_id !== id) notFound();

  const messages = (Array.isArray(conv.claude_messages)
    ? (conv.claude_messages as unknown as Message[])
    : []) as Message[];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="space-y-1">
        <nav className="text-xs text-muted-foreground">
          <Link href="/clients" className="hover:text-foreground">
            Clients
          </Link>{" "}
          /{" "}
          <Link href={`/clients/${id}`} className="hover:text-foreground">
            {client.name}
          </Link>{" "}
          /{" "}
          <Link
            href={`/clients/${id}/conversations`}
            className="hover:text-foreground"
          >
            Conversations
          </Link>{" "}
          /{" "}
          <code className="text-[10px]">{conversationId.slice(0, 8)}</code>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">
          Conversation
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 font-medium ${
              STATUS_STYLES[conv.status] ?? STATUS_STYLES.expired
            }`}
          >
            {conv.status.replace(/_/g, " ")}
          </span>
          <span>
            {messages.length}{" "}
            {messages.length === 1 ? "message" : "messages"}
          </span>
          <span>
            Started {new Date(conv.created_at).toLocaleString()}
          </span>
          <span>
            Last update {new Date(conv.updated_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Transcript */}
      {messages.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/10 p-6 text-center text-sm text-muted-foreground">
          This conversation has no messages yet.
        </div>
      ) : (
        <ol className="space-y-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} index={i} message={m} />
          ))}
        </ol>
      )}

      {conv.pending_image_url && (
        <div className="rounded-md border bg-amber-50 p-4 text-xs text-amber-900">
          <div className="mb-1 font-medium uppercase tracking-wider">
            Pending image (awaiting approval)
          </div>
          <a
            href={conv.pending_image_url}
            target="_blank"
            rel="noreferrer"
            className="break-all hover:underline"
          >
            {conv.pending_image_url}
          </a>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Message rendering
// ───────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  index,
}: {
  message: Message;
  index: number;
}) {
  const isUser = message.role === "user";
  return (
    <li
      className={`flex gap-3 ${isUser ? "flex-row" : "flex-row-reverse"}`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold uppercase tracking-wider ${
          isUser
            ? "border-zinc-200 bg-zinc-100 text-zinc-600"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
        title={isUser ? "Owner (via WhatsApp)" : "Agent (Claude)"}
      >
        {isUser ? "U" : "A"}
      </div>
      <div
        className={`min-w-0 flex-1 space-y-1 ${isUser ? "" : "flex flex-col items-end"}`}
      >
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{isUser ? "Owner" : "Agent"}</span>
          <span>·</span>
          <span>#{index + 1}</span>
        </div>
        <div
          className={`max-w-[85%] space-y-2 rounded-lg border px-4 py-3 text-sm ${
            isUser
              ? "rounded-tl-sm bg-card"
              : "rounded-tr-sm bg-emerald-50/40"
          }`}
        >
          <MessageContent content={message.content} />
        </div>
      </div>
    </li>
  );
}

function MessageContent({ content }: { content: Message["content"] }) {
  if (typeof content === "string") {
    return <PlainText text={content} />;
  }
  if (!Array.isArray(content)) {
    return (
      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-muted-foreground">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  }
  return (
    <div className="space-y-3">
      {content.map((part, i) => (
        <MessagePart key={i} part={part as MessagePart} />
      ))}
    </div>
  );
}

function MessagePart({ part }: { part: MessagePart }) {
  if ("type" in part && part.type === "text") {
    return <PlainText text={(part as TextPart).text} />;
  }
  if ("type" in part && part.type === "tool_use") {
    const p = part as ToolUsePart;
    return (
      <div className="rounded-md border border-emerald-200/60 bg-white/60 p-3">
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-700">
          <span>↪ Tool call</span>
          <code className="rounded bg-emerald-100 px-1 py-0.5 font-mono text-[10px]">
            {p.name}
          </code>
        </div>
        {p.input && Object.keys(p.input).length > 0 && (
          <details className="mt-1">
            <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
              Show input
            </summary>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted/40 p-2 font-mono text-[10px]">
              {JSON.stringify(p.input, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }
  if ("type" in part && part.type === "tool_result") {
    const p = part as ToolResultPart;
    const text = stringifyToolResult(p.content);
    return (
      <div className="rounded-md border border-zinc-200/60 bg-white/60 p-3">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-600">
          ↩ Tool result
        </div>
        <details>
          <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
            {text.length > 120 ? `${text.slice(0, 120)}…` : text || "(empty)"}
          </summary>
          <pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/40 p-2 font-mono text-[10px]">
            {text}
          </pre>
        </details>
      </div>
    );
  }
  if ("type" in part && part.type === "image") {
    return (
      <div className="rounded-md border border-blue-200/60 bg-blue-50/40 p-2 text-[11px] text-blue-900">
        🖼 image attached
      </div>
    );
  }
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-[10px] text-muted-foreground">
      {JSON.stringify(part, null, 2)}
    </pre>
  );
}

function PlainText({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {text}
    </p>
  );
}

function stringifyToolResult(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === "string") return c;
        if (c && typeof c === "object" && "text" in c && typeof (c as { text: unknown }).text === "string") {
          return (c as { text: string }).text;
        }
        return JSON.stringify(c);
      })
      .join("\n");
  }
  if (content && typeof content === "object") {
    return JSON.stringify(content, null, 2);
  }
  return String(content ?? "");
}
