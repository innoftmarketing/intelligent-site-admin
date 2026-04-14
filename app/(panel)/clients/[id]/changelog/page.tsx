import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import { listChangeLog } from "@/lib/history";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const TYPE_ICONS: Record<string, string> = {
  text: "📝",
  image: "🖼",
  product: "🛒",
  media: "🎞",
};

export default async function ChangeLogPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const rows = await listChangeLog(id);

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
          / <span>Change log</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">Change log</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length === 0
            ? "No changes recorded yet."
            : `${rows.length} recent ${rows.length === 1 ? "change" : "changes"} the agent made on behalf of this client.`}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="space-y-3 border-l pl-4">
          {rows.map((r) => (
            <li key={r.id} className="relative rounded-md border bg-card p-4">
              <span className="absolute -left-[22px] top-5 flex h-4 w-4 items-center justify-center rounded-full border bg-background text-[10px]">
                {TYPE_ICONS[r.change_type] ?? "•"}
              </span>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">
                    {r.description}
                    {r.rolled_back && (
                      <span className="ml-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                        rolled back
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {r.change_type}
                    {r.target_page && <> · page: {r.target_page}</>}
                    {r.target_element && <> · element: {r.target_element}</>}
                  </div>
                </div>
                <time className="shrink-0 text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </time>
              </div>
              {(r.before_value || r.after_value) && (
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {r.before_value && (
                    <Excerpt label="Before" value={r.before_value} tone="muted" />
                  )}
                  {r.after_value && (
                    <Excerpt label="After" value={r.after_value} tone="accent" />
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Excerpt({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "muted" | "accent";
}) {
  return (
    <div
      className={`rounded-md border p-2 text-xs ${
        tone === "muted"
          ? "bg-muted/30 text-muted-foreground"
          : "bg-emerald-50/40 border-emerald-200 text-foreground"
      }`}
    >
      <div className="mb-1 font-medium uppercase tracking-wider text-[10px]">
        {label}
      </div>
      <div className="line-clamp-6 whitespace-pre-wrap break-words">
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-muted/10">
      <p className="text-sm font-medium">No changes yet</p>
      <p className="text-xs text-muted-foreground">
        Every edit the agent makes (text, image, product, media) lands here.
      </p>
    </div>
  );
}
