import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import { EditableClient, type EditableClient as EC } from "@/components/editable-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const full = await getClient(id);
  if (!full) notFound();

  // Strip the sensitive fields and expose only what the client component needs.
  const client: EC = {
    id: full.id,
    name: full.name,
    phone_number: full.phone_number,
    wordpress_url: full.wordpress_url,
    active: full.active,
    locked_until: full.locked_until,
    failed_pin_attempts: full.failed_pin_attempts,
    session_expires_at: full.session_expires_at,
    created_at: full.created_at,
    updated_at: full.updated_at,
    system_prompt_config: full.system_prompt_config,
    wp_credentials_present: !!full.wp_api_key_encrypted && !!full.wp_api_secret_encrypted,
    pin_hash_present: !!full.security_pin_hash,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <nav className="text-xs text-muted-foreground">
          <Link href="/clients" className="hover:text-foreground">
            Clients
          </Link>{" "}
          / <span>{full.name}</span>
        </nav>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{full.name}</h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {full.phone_number}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/clients/${full.id}/conversations`}
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
            >
              Conversations
            </Link>
            <Link
              href={`/clients/${full.id}/changelog`}
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
            >
              Change log
            </Link>
          </div>
        </div>
      </div>

      <EditableClient client={client} />
    </div>
  );
}
