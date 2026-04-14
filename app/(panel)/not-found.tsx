import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Not found
      </h1>
      <p className="text-sm text-muted-foreground">
        That page doesn&apos;t exist.
      </p>
      <Link
        href="/clients"
        className="mt-3 inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-muted"
      >
        Back to Clients
      </Link>
    </div>
  );
}
