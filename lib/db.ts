import { Pool, type QueryResult, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function makePool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (and Coolify env vars in production)."
    );
  }
  return new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
}

// Lazy accessor — we intentionally do NOT create the pool at module-eval time.
// Next.js runs module code during its "Collecting page data" build step to
// figure out which routes are static vs dynamic; at that moment env vars like
// DATABASE_URL are not set, and eagerly calling `makePool()` would throw and
// break the build. Creating the pool inside `getPool()` means the connection
// is only opened when a request actually runs a query.
function getPool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = makePool();
  }
  return global.__pgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params as never);
}
