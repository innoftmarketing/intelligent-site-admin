import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { freshSessionCookie } from "@/lib/session";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

async function loginAction(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/clients");

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    redirect("/login?error=server");
  }

  if (password !== expected) {
    redirect(`/login?error=invalid&next=${encodeURIComponent(next)}`);
  }

  const cookie = await freshSessionCookie();
  const jar = await cookies();
  jar.set(cookie.name, cookie.value, cookie.options);

  redirect(next || "/clients");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next ?? "/clients";
  const error = params.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Intelligent Website
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            Enter the admin password to continue.
          </p>
        </div>

        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {error === "invalid" && (
            <p className="text-sm text-destructive">
              That password isn&apos;t right. Try again.
            </p>
          )}
          {error === "server" && (
            <p className="text-sm text-destructive">
              Server is misconfigured (ADMIN_PASSWORD missing).
            </p>
          )}

          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Private operational tool. All activity is logged.
        </p>
      </div>
    </div>
  );
}
