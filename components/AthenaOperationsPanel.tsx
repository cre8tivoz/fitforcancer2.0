import React, { useState } from 'react';
import { OPERATION_SCENARIOS, type OperationsScenario } from '../utils/athenaOperationsChecks';
type Result = {text?:string; model?:string;durationMs?:number;checkedAt?:string;review?:{findings:string[];status:string};recommendations?:{kind?:string;id?:string;title?:string}[]};
export default function AthenaOperationsPanel({model,operations,version,runPreview}:{model:string;operations:any;version:string;runPreview:(scenario:OperationsScenario)=>Promise<Result>}) {
 const [results,setResults]=useState<Record<string,Result>>({});
 const [previous,setPrevious]=useState<Record<string,Result>>({});
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const [runVersion,setRunVersion]=useState('');
 async function run(){setBusy(true);setError('');setPrevious(results);setResults({});setRunVersion(version);
  try { for(const id of Object.keys(OPERATION_SCENARIOS) as OperationsScenario[]){try{const r=await runPreview(id);setResults(v=>({...v,[id]:r}));}catch{setResults(v=>({...v,[id]:{review:{status:'needs-attention',findings:['Generation failed. Retry this scenario using the individual preview.']}}}));}} }
  catch{setError('The checks could not finish.');}finally{setBusy(false);}
 }
 return <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
 <h2 className="text-xl font-bold">Operations overview</h2><p className="mt-2">Active model: <strong>{model || 'Unavailable'}</strong></p>
 <p className="mt-2 text-sm text-stone-600">Published version: {version}. Metrics start with this release and are best-effort SDK generation attempts, excluding rejected requests and legacy transport.</p>
 {operations ? <><p className="mt-2 text-sm">Refreshed: {new Date(operations.collectedAt).toLocaleString()}</p><div className="overflow-x-auto"><table className="mt-3 w-full text-left text-sm"><thead><tr>{['Traffic','7 days','28 days','Errors · 28 days','Median duration'].map(h=><th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{operations.rows.map((r:any)=><tr key={r.source}><td className="p-2">{r.source==='synthetic'?'Admin synthetic tests':'Production'}</td><td>{r.requests7}</td><td>{r.requests28}</td><td>{r.errors28}</td><td>{r.median_ms==null?'—':`${Math.round(Number(r.median_ms))} ms`}</td></tr>)}</tbody></table></div>{!operations.rows.length&&<p className="mt-3 text-sm">No recorded attempts yet.</p>}</> : <p className="mt-3">Metrics unavailable. Tuning remains available.</p>}
 <p className="mt-4 text-sm">Billing is not connected. These metrics are not Google’s settled charges. Test traffic is counted separately; no patient messages are stored here.</p>
 <h3 className="mt-6 font-bold">Synthetic regression review</h3><p className="mt-2 text-sm">Runs seven fixed scenarios against the current draft. Calls the paid Gemini API. Results stay on this page and are cleared on reload. Automatic flags need human review; an unflagged answer is not a clinical pass.</p>
 <button className="mt-3 min-h-11 rounded-xl bg-stone-100 px-4 font-semibold disabled:opacity-50" disabled={busy} onClick={run}>{busy?'Running checks…':'Run seven synthetic checks'}</button>
 {error&&<p role="alert">{error}</p>}{runVersion&&<p className="mt-2 text-sm">Compared with the preceding run in this session. Published version when run: {runVersion}. Draft settings are captured at the start of the run.</p>}
 <ul className="mt-4 divide-y divide-stone-200">{Object.entries(results).map(([id,r])=><li className="py-3" key={id}><details><summary className="cursor-pointer font-semibold">{OPERATION_SCENARIOS[id as OperationsScenario].label} · {r.review?.status==='needs-attention'?'Needs attention':'Human review'}{r.durationMs!=null?` · ${r.durationMs} ms`:''}</summary><p className="mt-2 text-sm">{OPERATION_SCENARIOS[id as OperationsScenario].expectation}</p>{r.review?.findings.map(f=><p className="mt-2 text-amber-900" key={f}>{f}</p>)}<p className="mt-2 whitespace-pre-wrap text-sm">{r.text}</p>{r.recommendations?.map((ref,i)=><p className="text-sm" key={i}>{ref.kind}: {ref.title||ref.id}</p>)}{previous[id]?.text&&<details className="mt-3"><summary>Previous response</summary><p className="whitespace-pre-wrap text-sm">{previous[id].text}</p><p className="text-xs">{previous[id].model} · {previous[id].durationMs} ms</p></details>}</details></li>)}</ul>
 </section>;
}
