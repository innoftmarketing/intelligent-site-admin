"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, SessionBadge } from "@/components/status-badge";
import { resolveStatus, hasLiveSession } from "@/lib/clients-shared";
import type { ClientSummary } from "@/lib/clients-shared";

interface Props {
  clients: ClientSummary[];
}

function relativeTime(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function ClientsTable({ clients }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((c) => {
      const hay =
        `${c.name} ${c.phone_number} ${c.wordpress_url}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [clients, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search name, phone, or URL…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {clients.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState query={q} total={clients.length} />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">WordPress</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const status = resolveStatus(c);
                const live = hasLiveSession(c);
                return (
                  <tr
                    key={c.id}
                    className="border-b last:border-b-0 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/clients/${c.id}`}
                        className="block space-y-0.5"
                      >
                        <div className="font-medium text-foreground">
                          {c.name}
                        </div>
                        <SessionBadge live={live} />
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {formatPhone(c.phone_number)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <a
                        href={c.wordpress_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground"
                      >
                        {hostOf(c.wordpress_url)}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {relativeTime(c.updated_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatPhone(raw: string): string {
  // International format: add a "+" prefix and a thin space every 3 digits
  // for readability. Doesn't touch the underlying value.
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return raw;
  const cc = digits.slice(0, digits.length - 9);
  const rest = digits.slice(-9);
  return `+${cc} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
}

function EmptyState({ query, total }: { query: string; total: number }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-muted/10">
      <p className="text-sm font-medium">
        {total === 0 ? "No clients yet" : "No matching clients"}
      </p>
      <p className="text-xs text-muted-foreground">
        {total === 0
          ? "Click Add Client to onboard the first one."
          : query
            ? `Nothing matches “${query}”.`
            : "Adjust your filters."}
      </p>
    </div>
  );
}
