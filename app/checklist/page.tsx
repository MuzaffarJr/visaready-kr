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
    () =>
      flowId && flow
        ? buildChecklist(flowId, { addressChanged })
        : [],
    [flowId, flow, addressChanged],
  );

  const [ready, setReady] = useState<Record<string, boolean>>({});
  const complete = items.filter((item) => ready[item.id]).length;
  const percent = items.length
    ? Math.round((complete / items.length) * 100)
    : 0;

  if (!flow) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p>Checklist could not be generated.</p>
        <Link href="/start" className="mt-4 inline-flex text-blue-600">
          Start again
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 md:py-16">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold">
          VisaReady KR
        </Link>
        <Link href="/start" className="text-sm text-slate-500">
          New checklist
        </Link>
      </div>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
        <p className="text-sm font-semibold text-blue-600">{flow.label}</p>

        <div className="mt-3 flex items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Document readiness
            </h1>
            <p className="mt-2 text-slate-600">
              {complete} of {items.length} marked ready
            </p>
          </div>
          <div className="text-3xl font-semibold">{percent}%</div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: percent + "%" }}
          />
        </div>
      </section>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex gap-4">
              <input
                aria-label={"Mark " + item.englishName + " ready"}
                type="checkbox"
                checked={!!ready[item.id]}
                onChange={(event) =>
                  setReady((current) => ({
                    ...current,
                    [item.id]: event.target.checked,
                  }))
                }
                className="mt-1 size-5"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{item.englishName}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {item.type}
                  </span>
                </div>

                <div className="mt-1 text-sm font-medium text-slate-700">
                  {item.koreanName}
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.note}
                </p>

                <div className="mt-3 text-xs font-medium text-amber-700">
                  Demo requirement — official source verification pending
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        This first build intentionally uses demo requirement data. It must not
        be treated as an official filing checklist until each requirement is
        mapped to a verified Korean immigration source.
      </aside>
    </main>
  );
}

export default function ChecklistPage() {
  return (
    <Suspense>
      <Checklist />
    </Suspense>
  );
}
