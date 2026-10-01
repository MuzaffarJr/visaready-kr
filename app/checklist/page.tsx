"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { currentRuleSet } from "@/lib/checklist-service";
import { loadChecklist, sameAnswers, saveChecklist } from "@/lib/checklist-store";
import {
  compareWithLatest,
  findFlow,
  generateChecklist,
  parseAnswers,
  type ChecklistSnapshot,
  type FlowId,
  type SnapshotDrift,
} from "@/lib/rules";

type Loaded =
  | { kind: "ok"; flowId: FlowId; snapshot: ChecklistSnapshot; ready: Record<string, boolean> }
  | { kind: "invalid-answers"; flowId: FlowId }
  | { kind: "unavailable" };

/** Resolves what to show: a saved checklist for the same answers, or a fresh one. */
function load(params: URLSearchParams): Loaded {
  const flow = findFlow(params.get("flow"));
  if (!flow) return { kind: "unavailable" };
  const selected = currentRuleSet(flow.id);
  if (!selected.ok) return { kind: "unavailable" };

  const { questions } = selected.value;
  const answersGiven = questions.some((question) => params.has(question.id));
  const answers = parseAnswers(questions, (key) => params.get(key));
  const saved = loadChecklist(flow.id);

  // A saved checklist stays pinned to the rule set version it was made with.
  if (saved && (!answersGiven || sameAnswers(saved.snapshot.answers, answers))) {
    return { kind: "ok", flowId: flow.id, snapshot: saved.snapshot, ready: saved.ready };
  }

  const fresh = generateChecklist(selected.value, answers, new Date().toISOString());
  if (!fresh.ok) return { kind: "invalid-answers", flowId: flow.id };

  // New answers replace the saved checklist; progress carries over for items that remain.
  const kept = new Set(fresh.value.items.map((item) => item.requirementId));
  const ready = Object.fromEntries(Object.entries(saved?.ready ?? {}).filter(([id]) => kept.has(id)));
  saveChecklist(flow.id, { snapshot: fresh.value, ready });
  return { kind: "ok", flowId: flow.id, snapshot: fresh.value, ready };
}

function Checklist({ params }: { params: URLSearchParams }) {
  const [loaded, setLoaded] = useState<Loaded>(() => load(params));
  const flow = loaded.kind === "unavailable" ? undefined : findFlow(loaded.flowId);
  const snapshot = loaded.kind === "ok" ? loaded.snapshot : undefined;
  const ready = loaded.kind === "ok" ? loaded.ready : {};
  const items = snapshot?.items ?? [];
  const complete = items.filter((item) => ready[item.requirementId]).length;
  const percent = items.length ? Math.round((complete / items.length) * 100) : 0;

  const latest = flow ? currentRuleSet(flow.id) : undefined;
  const drift: SnapshotDrift = snapshot && latest?.ok ? compareWithLatest(snapshot, latest.value) : { status: "current" };

  function toggle(requirementId: string) {
    if (loaded.kind !== "ok") return;
    const next = { ...loaded.ready, [requirementId]: !loaded.ready[requirementId] };
    setLoaded({ ...loaded, ready: next });
    saveChecklist(loaded.flowId, { snapshot: loaded.snapshot, ready: next });
  }

  function acceptUpdate() {
    if (loaded.kind !== "ok" || !latest?.ok) return;
    // Answers to questions the latest version dropped would fail validation.
    const known = new Set(latest.value.questions.map((question) => question.id));
    const answers = Object.fromEntries(Object.entries(loaded.snapshot.answers).filter(([id]) => known.has(id)));
    const regenerated = generateChecklist(latest.value, answers, new Date().toISOString());
    if (!regenerated.ok) return;
    const kept = new Set(regenerated.value.items.map((item) => item.requirementId));
    const nextReady = Object.fromEntries(Object.entries(loaded.ready).filter(([id]) => kept.has(id)));
    setLoaded({ ...loaded, snapshot: regenerated.value, ready: nextReady });
    saveChecklist(loaded.flowId, { snapshot: regenerated.value, ready: nextReady });
  }

  if (!flow || !snapshot) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p>
          {loaded.kind === "invalid-answers"
            ? "Some answers are missing or invalid, so the checklist could not be generated."
            : "Checklist could not be generated."}
        </p>
        <Link href={flow ? "/questionnaire?flow=" + flow.id : "/start"} className="mt-4 inline-flex text-blue-600">
          {flow ? "Answer the questions again" : "Start again"}
        </Link>
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
              Completion is a preparation indicator, not a visa approval prediction. Progress is saved in this browser only.
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
              Rules v{snapshot.ruleSetVersion} ·{" "}
              {snapshot.verifiedAt ? "verified " + snapshot.verifiedAt : "provisional, source verification pending"}
            </div>
          </div>

          {drift.status === "outdated" && (
            <div role="status" className="mb-5 rounded-[1.4rem] border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
              <strong>Rules updated to v{drift.latestVersion}.</strong>{" "}
              Your checklist still follows v{snapshot.ruleSetVersion}, the version it was created with.{" "}
              {drift.unansweredQuestions.length > 0 ? (
                <>
                  The new rules ask {drift.unansweredQuestions.length} new question(s).{" "}
                  <Link className="font-semibold underline" href={"/questionnaire?flow=" + snapshot.flowId}>
                    Answer them to update
                  </Link>
                </>
              ) : (
                <>
                  {drift.added.length} item(s) added, {drift.removed.length} removed.{" "}
                  <button type="button" onClick={acceptUpdate} className="font-semibold underline">
                    Update my checklist
                  </button>
                </>
              )}
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, index) => {
              const isReady = !!ready[item.requirementId];
              return (
                <article
                  key={item.requirementId}
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
                      onClick={() => toggle(item.requirementId)}
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
                          {item.kind}
                        </span>
                      </div>

                      <div className="mt-1 text-sm font-semibold text-slate-700">{item.koreanName}</div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium">
                        {item.sources.length > 0 ? (
                          item.sources.map((source) => (
                            <a
                              key={source.id}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-emerald-700 underline-offset-2 hover:underline"
                            >
                              <span className="size-2 rounded-full bg-emerald-500" />
                              {source.title}
                            </a>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-2 text-amber-700">
                            <span className="size-2 rounded-full bg-amber-500" />
                            Official source not yet verified
                          </span>
                        )}
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

          {snapshot.fees.length > 0 && (
            <section className="mt-6 rounded-[1.4rem] border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-950">Fees</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {snapshot.fees.map((fee) => (
                  <li key={fee.id} className="flex justify-between gap-4">
                    <span>{fee.label}</span>
                    <span className="font-semibold">₩{fee.amountKrw.toLocaleString("en-US")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {snapshot.provisional && (
            <aside className="mt-6 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <strong>Provisional checklist:</strong> these requirements come from a draft rule set. They must not be treated as an official filing checklist until every rule is mapped to a verified Korean immigration source.
            </aside>
          )}
        </div>
      </section>
    </main>
  );
}

function ChecklistRoute() {
  const params = useSearchParams();
  // Remount when the query changes so state is re-derived from the new answers.
  return <Checklist key={params.toString()} params={new URLSearchParams(params.toString())} />;
}

export default function ChecklistPage() {
  return <Suspense><ChecklistRoute /></Suspense>;
}
