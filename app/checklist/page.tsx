"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buildChecklist, flows, type FlowId } from "@/lib/visa";

function Checklist() {
  const params = useSearchParams();
  const flowId = params.get("flow") as FlowId | null;
  const flow = flows.find((item) => item.id === flowId);
  const addressChanged = params.get("addressChanged") === "true";
  const items = useMemo(
    () => (flowId && flow ? buildChecklist(flowId, { addressChanged }) : []),
    [flowId, flow, addressChanged],
  );
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const complete = items.filter((item) => ready[item.id]).length;
  const percent = items.length ? Math.round((complete / items.length) * 100) : 0;

  if (!flow) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p>Checklist could not be generated.</p>
        <Link href="/start" className="mt-4 inline-flex text-blue-600">Start again</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <header className="vr-shell flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">V</span>
          VisaReady KR
        </Link>
        <Link href="/start" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300">
          New checklist
        </Link>
      </header>

      <section className="vr-shell mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[1.6rem] bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,.14)]">
            <div className="text-xs font-semibold uppercase tracking-[.16em] text-blue-300">Application</div>
            <h1 className="mt-2 text-2xl font-semibold">{flow.label}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">Your current preparation status based on the checklist below.</p>

            <div className="mt-8 flex items-end justify-between">
              <div>
                <div className="text-5xl font-semibold tracking-[-0.05em]">{percent}%</div>
                <div className="mt-2 text-sm text-slate-400">{complete} of {items.length} ready</div>
              </div>
              <div className="grid size-12 place-items-center rounded-full bg-white/10 text-lg">✓</div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: percent + "%" }} />
            </div>

            <div className="mt-8 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400">
              Completion is a preparation indicator, not a visa approval prediction.
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-600">Personalized document list</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-slate-950">Prepare these documents</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
              Demo data · source verification pending
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const isReady = !!ready[item.id];
              return (
                <article
                  key={item.id}
                  className={
                    "rounded-[1.4rem] border bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,.035)] " +
                    (isReady ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200")
                  }
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      aria-label={"Mark " + item.englishName + " ready"}
                      aria-pressed={isReady}
                      onClick={() => setReady((current) => ({ ...current, [item.id]: !isReady }))}
                      className={
                        "grid size-11 shrink-0 place-items-center rounded-2xl border font-semibold " +
                        (isReady
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-400 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700")
                      }
                    >
                      {isReady ? "✓" : String(index + 1).padStart(2, "0")}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-tight text-slate-950">{item.englishName}</h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          {item.type}
                        </span>
                      </div>

                      <div className="mt-1 text-sm font-semibold text-slate-700">{item.koreanName}</div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium">
                        <span className="inline-flex items-center gap-2 text-amber-700">
                          <span className="size-2 rounded-full bg-amber-500" />
                          Official source not yet verified
                        </span>
                        <span className={isReady ? "text-emerald-700" : "text-slate-400"}>
                          {isReady ? "Marked ready" : "Not marked ready"}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="mt-6 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <strong>Development notice:</strong> these entries are intentionally labeled as demo requirements. They must not be treated as an official filing checklist until every rule is mapped to a verified Korean immigration source.
          </aside>
        </div>
      </section>
    </main>
  );
}

export default function ChecklistPage() {
  return <Suspense><Checklist /></Suspense>;
}
