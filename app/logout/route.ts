import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { expiredSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const c = await expiredSessionCookie();
  const jar = await cookies();
  jar.set(c.name, c.value, c.options);
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
