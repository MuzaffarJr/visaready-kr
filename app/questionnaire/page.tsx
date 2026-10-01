"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { flows } from "@/lib/visa";

function Questionnaire() {
  const router = useRouter();
  const params = useSearchParams();
  const rawFlow = params.get("flow");
  const flow = flows.find((item) => item.id === rawFlow);
  const [addressChanged, setAddressChanged] = useState<boolean | null>(null);

  if (!flow) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p>Unsupported visa flow.</p>
        <Link className="mt-4 inline-flex text-blue-600" href="/start">Choose a flow</Link>
      </main>
    );
  }

  function continueToChecklist() {
    if (addressChanged === null) return;
    const query = new URLSearchParams({
      flow: flow!.id,
      addressChanged: String(addressChanged),
    });
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

        <div className="mt-6">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Has your registered address changed?
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            This answer can affect which proof-of-residence documents appear in your checklist.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {[
            [true, "Yes, it changed", "I need the checklist to account for a new registered address."],
            [false, "No, same address", "My registered Korean address has not changed."],
          ].map(([value, label, description]) => {
            const selected = addressChanged === value;
            return (
              <button
                key={String(value)}
                onClick={() => setAddressChanged(value as boolean)}
                className={
                  "rounded-[1.5rem] border p-5 text-left shadow-sm " +
                  (selected
                    ? "border-blue-600 bg-blue-50 ring-4 ring-blue-100"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200")
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-950">{label as string}</span>
                  <span className={"grid size-8 place-items-center rounded-full border " + (selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent")}>✓</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description as string}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
          <div className="text-sm text-slate-500">Your answer is only used to build this checklist.</div>
          <button
            disabled={addressChanged === null}
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
