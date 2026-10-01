"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { currentRuleSet } from "@/lib/checklist-service";
import { findFlow, type AnswerValue, type Question } from "@/lib/rules";

function optionsFor(question: Question): { value: AnswerValue; label: string; description?: string }[] {
  if (question.kind === "choice") return question.options;
  return [
    { value: true, label: "Yes", description: "This applies to my situation." },
    { value: false, label: "No", description: "This does not apply to me." },
  ];
}

function Questionnaire() {
  const router = useRouter();
  const params = useSearchParams();
  const flow = findFlow(params.get("flow"));
  const selected = flow ? currentRuleSet(flow.id) : undefined;
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  if (!flow || !selected?.ok) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p>{flow ? "This visa flow is not available yet." : "Unsupported visa flow."}</p>
        <Link className="mt-4 inline-flex text-blue-600" href="/start">Choose a flow</Link>
      </main>
    );
  }

  const { questions } = selected.value;
  const complete = questions.every((question) => answers[question.id] !== undefined);

  function continueToChecklist() {
    if (!flow || !complete) return;
    const query = new URLSearchParams({ flow: flow.id });
    for (const [key, value] of Object.entries(answers)) query.set(key, String(value));
    router.push("/checklist?" + query.toString());
  }

  return (
    <main className="min-h-screen pb-16">
      <header className="vr-shell flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">V</span>
          VisaReady KR
        </Link>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">Step 2 of 2</span>
      </header>

      <section className="mx-auto max-w-2xl px-5 pt-12 sm:pt-20">
        <div className="flex items-center gap-3">
          <Link href="/start" className="text-sm font-medium text-slate-500 hover:text-slate-900">← Back</Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-blue-600">{flow.label}</span>
        </div>

        {questions.map((question, index) => (
          <fieldset key={question.id} className={index === 0 ? "mt-6" : "mt-14"}>
            <legend className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              {question.prompt}
            </legend>
            {question.help && <p className="mt-4 text-lg leading-8 text-slate-600">{question.help}</p>}

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {optionsFor(question).map((option) => {
                const isSelected = answers[question.id] === option.value;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.value }))}
                    className={
                      "rounded-[1.5rem] border p-5 text-left shadow-sm " +
                      (isSelected
                        ? "border-blue-600 bg-blue-50 ring-4 ring-blue-100"
                        : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200")
                    }
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-950">{option.label}</span>
                      <span className={"grid size-8 place-items-center rounded-full border " + (isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent")}>✓</span>
                    </div>
                    {option.description && <p className="mt-3 text-sm leading-6 text-slate-600">{option.description}</p>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
          <div className="text-sm text-slate-500">Your answers are only used to build this checklist.</div>
          <button
            type="button"
            disabled={!complete}
            onClick={continueToChecklist}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-[0_10px_28px_rgba(21,94,239,.18)] hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generate checklist <span>→</span>
          </button>
        </div>
      </section>
    </main>
  );
}

export default function QuestionnairePage() {
  return <Suspense><Questionnaire /></Suspense>;
}
