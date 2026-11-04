import { ATHENA_MODEL } from "./_lib/athenaConfig.js";
import { readAthenaOperations, recordAthenaOperation } from "./_lib/athenaOperations.js";
import { OPERATION_SCENARIOS, assessOperationsResult } from "../utils/athenaOperationsChecks.js";
import { isSameOriginRequest, verifyBaselineRequest } from "./_lib/athenaBaselineAuth.js";
import { normaliseBaselineSettings, publishBaseline, readBaseline, rollbackBaseline, saveDraft, type BaselineScenario } from "./_lib/athenaBaseline.js";
import { runAthenaBaselinePreview } from "./_lib/athenaPreview.js";

type Request = { method?: string; headers?: Record<string, string | string[] | undefined>; body?: unknown };
type Response = { status(code: number): Response; json(body: unknown): void; setHeader?(key: string, value: string): void };
const asRecord = (value: unknown): Record<string, unknown> => typeof value === "string" ? JSON.parse(value) : value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const summary = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 240) || "Baseline update" : "Baseline update";

export default async function handler(req: Request, res: Response) {
  res.setHeader?.("Cache-Control", "private, no-store");
  if (req.method !== "GET" && !isSameOriginRequest(req.headers)) return res.status(403).json({ error: "Request origin rejected" });
  const user = await verifyBaselineRequest(req.headers);
  if (user === "forbidden") return res.status(403).json({ error: "Access denied" });
  if (!user) return res.status(401).json({ error: "Authentication required" });

  try {
    if (req.method === "GET") return res.status(200).json({...await readBaseline(), model:ATHENA_MODEL, operations:await readAthenaOperations().catch(()=>null)});
    if (req.method === "PUT") {
      const body = asRecord(req.body);
      if (body.action !== "saveDraft") return res.status(400).json({ error: "Invalid action" });
      const settings = normaliseBaselineSettings(body.settings);
      if (!settings) return res.status(400).json({ error: "Invalid baseline settings" });
      await saveDraft(settings);
      return res.status(200).json({ ok: true });
    }
    if (req.method === "POST") {
      const body = asRecord(req.body);
      if (body.action === "preview") {
        const scenario = body.scenario;
        const settings = normaliseBaselineSettings(body.settings);
        if (!settings || !(typeof scenario === "string" && Object.hasOwn(OPERATION_SCENARIOS, scenario))) {
          return res.status(400).json({ error: "Invalid preview request" });
        }
        const started = Date.now();
        try {
          const result = await runAthenaBaselinePreview(scenario as BaselineScenario, settings);
          const durationMs = Date.now()-started;
          await recordAthenaOperation({model:ATHENA_MODEL,durationMs,finishReason:"stop"},"synthetic");
          return res.status(200).json({...result,model:ATHENA_MODEL,durationMs,checkedAt:new Date().toISOString(),review:assessOperationsResult(scenario as BaselineScenario,result.text,result.recommendations)});
        } catch(e) {
          await recordAthenaOperation({model:ATHENA_MODEL,durationMs:Date.now()-started,errorCategory:"upstream"},"synthetic"); throw e;
        }
      }
      if (body.action === "publish") {
        const settings = normaliseBaselineSettings(body.settings);
        if (!settings) return res.status(400).json({ error: "Invalid baseline settings" });
        await publishBaseline(settings, user.email, "publish", summary(body.summary));
        return res.status(200).json({ ok: true });
      }
      if (body.action === "rollback") {
        const settings = await rollbackBaseline(user.email, summary(body.summary));
        return res.status(200).json({ ok: true, settings });
      }
      return res.status(400).json({ error: "Invalid action" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch {
    return res.status(503).json({ error: "Baseline service is temporarily unavailable" });
  }
}
