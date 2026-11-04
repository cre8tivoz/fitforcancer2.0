import { getBaselinePool } from './athenaBaseline.js';
import { safeAthenaMetadata } from './athenaPrivacy.js';
let ready: Promise<void> | undefined;
async function schema() {
  return ready ??= getBaselinePool().query(`CREATE TABLE IF NOT EXISTS athena_operations (
    id bigserial PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(),
    source text NOT NULL CHECK(source IN ('production','synthetic')), metadata jsonb NOT NULL
  )`).then(()=>getBaselinePool().query('CREATE INDEX IF NOT EXISTS athena_operations_created_idx ON athena_operations (created_at)')).then(()=>undefined).catch(e=>{ready=undefined;throw e;});
}
// Never accept conversation text, health context, IP addresses or user identifiers.
export async function recordAthenaOperation(input: Record<string, unknown>, source: 'production'|'synthetic') {
  if (!process.env.DATABASE_URL) return;
  try {
    await schema();
    await getBaselinePool().query('INSERT INTO athena_operations (source,metadata) VALUES ($1,$2::jsonb)', [source,JSON.stringify(safeAthenaMetadata(input))]);
    await getBaselinePool().query("DELETE FROM athena_operations WHERE created_at < now() - interval '28 days'");
  } catch { /* Telemetry must not turn a successful response into a chat failure. */ }
}
export async function readAthenaOperations() {
  await schema();
  const result = await getBaselinePool().query(`SELECT source,
    count(*) FILTER (WHERE created_at >= now()-interval '7 days')::int AS requests7,
    count(*)::int AS requests28,
    count(*) FILTER (WHERE metadata ? 'errorCategory')::int AS errors28,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY (metadata->>'durationMs')::numeric) AS median_ms,
    max(created_at) AS latest
    FROM athena_operations WHERE created_at >= now()-interval '28 days' GROUP BY source`);
  return { collectedAt:new Date().toISOString(), rows:result.rows,
    coverage:'SDK generation attempts recorded after this release; rejected requests and legacy transport are excluded. Counts are best-effort and may be incomplete.',
    billing:'Not connected. Token counts are not settled Google charges.' };
}
