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
        <Link className="mt-4 inline-flex text-blue-600" href="/start">
          Choose a flow
        </Link>
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
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10 md:py-16">
      <Link href="/start" className="text-sm text-slate-500">
        ← Change visa action
      </Link>

      <div className="mt-10">
        <p className="text-sm font-semibold text-blue-600">
          Step 2 of 2 · {flow.label}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Has your registered address changed?
        </h1>
        <p className="mt-3 text-slate-600">
          This answer can add a conditional document to your checklist.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            onClick={() => setAddressChanged(value)}
            className={
              "rounded-2xl border bg-white p-5 text-left font-medium " +
              (addressChanged === value
                ? "border-blue-600 ring-2 ring-blue-100"
                : "border-slate-200")
            }
          >
            {value ? "Yes, it changed" : "No, same address"}
          </button>
        ))}
      </div>

      <button
        disabled={addressChanged === null}
        onClick={continueToChecklist}
        className="mt-8 w-full rounded-xl bg-blue-600 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Generate checklist
      </button>
    </main>
  );
}

export default function QuestionnairePage() {
  return (
    <Suspense>
      <Questionnaire />
    </Suspense>
  );
}
