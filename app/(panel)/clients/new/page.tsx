import Link from "next/link";
import { AddClientForm } from "@/components/add-client-form";

export const dynamic = "force-dynamic";

export default function AddClientPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <nav className="text-xs text-muted-foreground">
          <Link href="/clients" className="hover:text-foreground">
            Clients
          </Link>{" "}
          / <span>Add</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">Add client</h1>
        <p className="text-sm text-muted-foreground">
          Onboard a new business. Fields map 1:1 to{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            scripts/onboard-client.ts
          </code>
          .
        </p>
      </div>

      <AddClientForm />
    </div>
  );
}
