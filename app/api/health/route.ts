import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM clients"
    );
    return NextResponse.json({
      status: "ok",
      database: "connected",
      clientCount: parseInt(result.rows[0]?.count ?? "0", 10),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: "error", database: "unreachable", error: message },
      { status: 500 }
    );
  }
}
