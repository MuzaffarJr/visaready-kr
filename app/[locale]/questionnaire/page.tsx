"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "../../_components/site-header";
import { useLocale } from "../../_components/use-locale";
import { currentRuleSet } from "@/lib/checklist-service";
import { flowText, format, localePath, questionText, type Messages } from "@/lib/i18n";
import { findFlow, parseAnswers, type AnswerValue } from "@/lib/rules";

type Option = { value: AnswerValue; label: string; description?: string };

function yesNo(m: Messages["questionnaire"]): Option[] {
  return [
    { value: true, label: m.yes, description: m.yesDescription },
    { value: false, label: m.no, description: m.noDescription },
  ];
}

function Questionnaire() {
  const { locale, m: messages } = useLocale();
  const m = messages.questionnaire;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const flow = findFlow(params.get("flow"));
  const selected = flow ? currentRuleSet(flow.id) : undefined;
  // Answers already in the URL (a locale switch, a reload, "answer the new questions") are kept.
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() =>
    selected?.ok ? { ...parseAnswers(selected.value.questions, (key) => params.get(key)) } : {},
  );

  if (!flow || !selected?.ok) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p>{flow ? m.unavailable : m.unsupported}</p>
        <Link className="mt-4 inline-flex text-blue-600" href={localePath(locale, "/start")}>
          {m.chooseFlow}
        </Link>
      </main>
    );
  }

  const ruleSet = selected.value;
  const complete = ruleSet.questions.every((question) => answers[question.id] !== undefined);

  function query(next: Record<string, AnswerValue>): string {
    const search = new URLSearchParams({ flow: ruleSet.flowId });
    for (const question of ruleSet.questions) {
      const value = next[question.id];
      if (value !== undefined) search.set(question.id, String(value));
    }
    return search.toString();
  }

  function choose(questionId: string, value: AnswerValue) {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    // Mirror answers into the URL without a navigation, so switching language keeps them.
    window.history.replaceState(null, "", pathname + "?" + query(next));
  }

  function continueToChecklist() {
    if (!complete) return;
    router.push(localePath(locale, "/checklist?" + query(answers)));
  }

  return (
    <main className="min-h-screen pb-16">
      <SiteHeader locale={locale}>
        <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:inline">
          {format(messages.common.step, { step: 2, total: 2 })}
        </span>
      </SiteHeader>

      <section className="mx-auto max-w-2xl px-5 pt-12 sm:pt-20">
        <div className="flex items-center gap-3">
          <Link href={localePath(locale, "/start")} className="text-sm font-medium text-slate-500 hover:text-slate-900">
            ← {messages.common.back}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-blue-600">{flowText(locale, flow).label}</span>
        </div>

        {ruleSet.questions.map((question, index) => {
          const text = questionText(locale, ruleSet, question);
          const options: Option[] = question.kind === "choice" ? text.options : yesNo(m);
          return (
            <fieldset key={question.id} className={index === 0 ? "mt-6" : "mt-14"}>
              <legend className="text-4xl font-semibold tracking-[-0.04em] text-balance text-slate-950 sm:text-5xl">
                {text.prompt}
              </legend>
              {text.help && <p className="mt-4 text-lg leading-8 text-slate-600">{text.help}</p>}

              <div className="mt-9 grid gap-4 sm:grid-cols-2">
                {options.map((option) => {
                  const isSelected = answers[question.id] === option.value;
                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => choose(question.id, option.value)}
                      className={
                        "rounded-[1.5rem] border p-5 text-left shadow-sm " +
                        (isSelected
                          ? "border-blue-600 bg-blue-50 ring-4 ring-blue-100"
                          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200")
                      }
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-semibold text-slate-950">{option.label}</span>
                        <span className={"grid size-8 shrink-0 place-items-center rounded-full border " + (isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent")}>✓</span>
                      </div>
                      {option.description && <p className="mt-3 text-sm leading-6 text-slate-600">{option.description}</p>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
          <div className="text-sm text-slate-500">{m.privacy}</div>
          <button
            type="button"
            disabled={!complete}
            onClick={continueToChecklist}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-[0_10px_28px_rgba(21,94,239,.18)] hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {m.generate} <span aria-hidden>→</span>
          </button>
        </div>
      </section>
    </main>
  );
}

export default function QuestionnairePage() {
  return <Suspense><Questionnaire /></Suspense>;
}
