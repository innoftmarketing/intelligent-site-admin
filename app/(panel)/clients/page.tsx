import Link from "next/link";
import { listClients } from "@/lib/clients";
import { ClientsTable } from "@/components/clients-table";

export const dynamic = "force-dynamic"; // always fetch fresh

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length === 1
              ? "1 client registered."
              : `${clients.length} clients registered.`}
          </p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Add client
        </Link>
      </div>

      <ClientsTable clients={clients} />
    </div>
  );
}
