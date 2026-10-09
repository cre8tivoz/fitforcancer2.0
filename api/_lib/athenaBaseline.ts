import { Pool } from "@neondatabase/serverless";

export type AthenaBaselineSettings = {
  warmth: "low" | "balanced" | "high";
  responseLength: "concise" | "balanced" | "detailed";
  clarifyTendency: "ask_when_needed" | "prefer_direct";
  suggestionCount: 1 | 2 | 3;
  extraGuidance: string;
};

export const DEFAULT_ATHENA_BASELINE: AthenaBaselineSettings = Object.freeze({
  warmth: "balanced",
  responseLength: "balanced",
  clarifyTendency: "ask_when_needed",
  suggestionCount: 3,
  extraGuidance: "",
});

export type BaselineScenario = "fatigue7-movement" | "low-energy-meal" | "general-chat";

export const normaliseBaselineSettings = (input: unknown): AthenaBaselineSettings | null => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  if (!(["low", "balanced", "high"] as unknown[]).includes(value.warmth)) return null;
  if (!(["concise", "balanced", "detailed"] as unknown[]).includes(value.responseLength)) return null;
  if (!(["ask_when_needed", "prefer_direct"] as unknown[]).includes(value.clarifyTendency)) return null;
  if (![1, 2, 3].includes(value.suggestionCount as number)) return null;
  if (typeof value.extraGuidance !== "string" || value.extraGuidance.length > 500) return null;
  return {
    warmth: value.warmth as AthenaBaselineSettings["warmth"],
    responseLength: value.responseLength as AthenaBaselineSettings["responseLength"],
    clarifyTendency: value.clarifyTendency as AthenaBaselineSettings["clarifyTendency"],
    suggestionCount: value.suggestionCount as 1 | 2 | 3,
    extraGuidance: value.extraGuidance.trim(),
  };
};

let pool: Pool | undefined;
export const getBaselinePool = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Baseline database is not configured");
  return pool ??= new Pool({ connectionString, max: 2, connectionTimeoutMillis: 800, query_timeout: 1800 });
};

let schemaReady: Promise<void> | undefined;
const ensureSchema = async () => schemaReady ??= (async () => {
  const db = getBaselinePool();
  await db.query(`CREATE TABLE IF NOT EXISTS athena_baseline_state (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    draft jsonb NOT NULL,
    published jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS athena_baseline_history (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    author_email text NOT NULL,
    action text NOT NULL CHECK (action IN ('publish','rollback')),
    summary text NOT NULL,
    settings jsonb NOT NULL
  )`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS athena_baseline_initial_history_unique
    ON athena_baseline_history (summary) WHERE author_email = 'system' AND summary = 'Initial approved baseline'`);
  await db.query(`INSERT INTO athena_baseline_state (singleton, draft, published)
    VALUES (true, $1::jsonb, $1::jsonb) ON CONFLICT (singleton) DO NOTHING`, [JSON.stringify(DEFAULT_ATHENA_BASELINE)]);
  await db.query(`INSERT INTO athena_baseline_history (author_email, action, summary, settings)
    SELECT 'system', 'publish', 'Initial approved baseline', published FROM athena_baseline_state
    WHERE singleton = true AND NOT EXISTS (SELECT 1 FROM athena_baseline_history WHERE author_email = 'system' AND summary = 'Initial approved baseline')
    ON CONFLICT DO NOTHING`);
})().catch((error) => { schemaReady = undefined; throw error; });

export const readBaseline = async () => {
  await ensureSchema();
  const db = getBaselinePool();
  const [state, history] = await Promise.all([
    db.query("SELECT draft, published FROM athena_baseline_state WHERE singleton = true"),
    db.query("SELECT id, created_at, author_email, action, summary, settings FROM athena_baseline_history ORDER BY id DESC LIMIT 20"),
  ]);
  const row = state.rows[0];
  return {
    draft: normaliseBaselineSettings(row?.draft) ?? DEFAULT_ATHENA_BASELINE,
    published: normaliseBaselineSettings(row?.published) ?? DEFAULT_ATHENA_BASELINE,
    history: history.rows.map((item) => ({
      id: String(item.id), createdAt: item.created_at, authorEmail: item.author_email,
      action: item.action, summary: item.summary,
      settings: normaliseBaselineSettings(item.settings) ?? DEFAULT_ATHENA_BASELINE,
    })),
  };
};

let publishedCache: { value: AthenaBaselineSettings; expiresAt: number } | undefined;
let publishedRead: Promise<AthenaBaselineSettings> | undefined;
export const getPublishedBaseline = async () => {
  if (publishedCache && publishedCache.expiresAt > Date.now()) return publishedCache.value;
  const read = publishedRead ??= (async () => {
    try {
      await ensureSchema();
      const result = await getBaselinePool().query("SELECT published FROM athena_baseline_state WHERE singleton = true");
      const value = normaliseBaselineSettings(result.rows[0]?.published) ?? DEFAULT_ATHENA_BASELINE;
      publishedCache = { value, expiresAt: Date.now() + 5_000 };
      return value;
    } catch {
      return DEFAULT_ATHENA_BASELINE;
    } finally { publishedRead = undefined; }
  })();
  return Promise.race([
    read,
    new Promise<AthenaBaselineSettings>((resolve) => setTimeout(() => resolve(DEFAULT_ATHENA_BASELINE), 350)),
  ]);
};

export const saveDraft = async (settings: AthenaBaselineSettings) => {
  await ensureSchema();
  await getBaselinePool().query("UPDATE athena_baseline_state SET draft = $1::jsonb, updated_at = now() WHERE singleton = true", [JSON.stringify(settings)]);
};

export const publishBaseline = async (settings: AthenaBaselineSettings, authorEmail: string, action: "publish" | "rollback", summary: string) => {
  await ensureSchema();
  const client = await getBaselinePool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT published FROM athena_baseline_state WHERE singleton=true FOR UPDATE");
    await client.query("UPDATE athena_baseline_state SET draft=$1::jsonb, published=$1::jsonb, updated_at=now() WHERE singleton=true", [JSON.stringify(settings)]);
    await client.query("INSERT INTO athena_baseline_history (author_email, action, summary, settings) VALUES ($1,$2,$3,$4::jsonb)", [authorEmail, action, summary, JSON.stringify(settings)]);
    await client.query("COMMIT");
    publishedCache = { value: settings, expiresAt: Date.now() + 5_000 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
};

export const rollbackBaseline = async (authorEmail: string, summary: string) => {
  await ensureSchema();
  const client = await getBaselinePool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT published FROM athena_baseline_state WHERE singleton=true FOR UPDATE");
    const previous = await client.query("SELECT settings FROM athena_baseline_history WHERE action IN ('publish','rollback') ORDER BY id DESC LIMIT 1 OFFSET 1");
    const settings = normaliseBaselineSettings(previous.rows[0]?.settings);
    if (!settings) throw new Error("There is no prior published baseline to restore");
    await client.query("UPDATE athena_baseline_state SET draft=$1::jsonb, published=$1::jsonb, updated_at=now() WHERE singleton=true", [JSON.stringify(settings)]);
    await client.query("INSERT INTO athena_baseline_history (author_email, action, summary, settings) VALUES ($2,'rollback',$3,$1::jsonb)", [JSON.stringify(settings), authorEmail, summary]);
    await client.query("COMMIT");
    publishedCache = { value: settings, expiresAt: Date.now() + 5_000 };
    return settings;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
};

export const clearPublishedBaselineCache = () => { publishedCache = undefined; };
