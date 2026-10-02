"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "../../_components/site-header";
import { useLocale } from "../../_components/use-locale";
import { currentRuleSet } from "@/lib/checklist-service";
import { loadChecklist, sameAnswers, saveChecklist } from "@/lib/checklist-store";
import { feeLabel, flowText, format, localePath, requirementText } from "@/lib/i18n";
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
  const { locale, m: messages } = useLocale();
  const m = messages.checklist;
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
        <p>{loaded.kind === "invalid-answers" ? m.invalidAnswers : m.failed}</p>
        <Link
          href={localePath(locale, flow ? "/questionnaire?flow=" + flow.id : "/start")}
          className="mt-4 inline-flex text-blue-600"
        >
          {flow ? m.answerAgain : m.startAgain}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <SiteHeader locale={locale}>
        <Link
          href={localePath(locale, "/start")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
        >
          {messages.common.newChecklist}
        </Link>
      </SiteHeader>

      <section className="vr-shell mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[1.6rem] bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,.14)]">
            <div className="text-xs font-semibold uppercase tracking-[.16em] text-blue-300">{m.application}</div>
            <h1 className="mt-2 text-2xl font-semibold">{flowText(locale, flow).label}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">{m.statusLead}</p>

            <div className="mt-8 flex items-end justify-between">
              <div>
                <div className="text-5xl font-semibold tracking-[-0.05em]">{percent}%</div>
                <div className="mt-2 text-sm text-slate-400">{format(m.progress, { complete, total: items.length })}</div>
              </div>
              <div className="grid size-12 place-items-center rounded-full bg-white/10 text-lg">✓</div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: percent + "%" }} />
            </div>

            <div className="mt-8 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400">
              {m.progressNote}
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-600">{m.eyebrow}</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-slate-950">{m.title}</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
              {format(m.rulesVersion, { version: snapshot.ruleSetVersion })} ·{" "}
              {snapshot.verifiedAt ? format(m.verifiedOn, { date: snapshot.verifiedAt }) : m.provisionalPending}
            </div>
          </div>

          {drift.status === "outdated" && (
            <div role="status" className="mb-5 rounded-[1.4rem] border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
              <strong>{format(m.updatedTitle, { version: drift.latestVersion })}</strong>{" "}
              {format(m.updatedBody, { version: snapshot.ruleSetVersion })}{" "}
              {drift.unansweredQuestions.length > 0 ? (
                <>
                  {format(m.newQuestions, { count: drift.unansweredQuestions.length })}{" "}
                  <Link className="font-semibold underline" href={localePath(locale, "/questionnaire?flow=" + snapshot.flowId)}>
                    {m.answerToUpdate}
                  </Link>
                </>
              ) : (
                <>
                  {format(m.itemChanges, { added: drift.added.length, removed: drift.removed.length })}{" "}
                  <button type="button" onClick={acceptUpdate} className="font-semibold underline">
                    {m.acceptUpdate}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, index) => {
              const isReady = !!ready[item.requirementId];
              const text = requirementText(locale, snapshot, item);
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
                      aria-label={format(m.markReady, { name: text.name })}
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
                        <h3 className="text-lg font-semibold tracking-tight text-slate-950">{text.name}</h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          {item.kind === "required" ? m.kindRequired : m.kindConditional}
                        </span>
                      </div>

                      <div lang="ko" className="mt-1 text-sm font-semibold text-slate-700">{item.koreanName}</div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{text.note}</p>

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
                            {m.sourcePending}
                          </span>
                        )}
                        <span className={isReady ? "text-emerald-700" : "text-slate-400"}>
                          {isReady ? m.markedReady : m.notMarkedReady}
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
              <h3 className="font-semibold text-slate-950">{m.fees}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {snapshot.fees.map((fee) => (
                  <li key={fee.id} className="flex justify-between gap-4">
                    <span>{feeLabel(locale, snapshot, fee)}</span>
                    <span className="font-semibold">₩{fee.amountKrw.toLocaleString("en-US")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {snapshot.provisional && (
            <aside className="mt-6 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <strong>{m.provisionalTitle}</strong> {m.provisionalBody}
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
