import Link from "next/link";
import { availableFlows } from "@/lib/checklist-service";
import { rulesMode } from "@/lib/config";

// Effective dates can change which flows are available without a redeploy.
export const revalidate = 3600;

export default function StartPage() {
  const flows = availableFlows();

  return (
    <main className="min-h-screen pb-16">
      <header className="vr-shell flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">V</span>
          VisaReady KR
        </Link>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
          Step 1 of 2
        </span>
      </header>

      <section className="mx-auto max-w-3xl px-5 pt-12 sm:pt-20">
        <div className="mb-3 text-sm font-semibold text-blue-600">Choose a visa action</div>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
          What are you preparing for?
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Start with the exact immigration action. We’ll keep the rest of the flow focused on what can actually change your checklist.
        </p>

        {flows.length === 0 && (
          <div className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-600">
            No visa flow has a verified checklist yet. Please check back soon.
          </div>
        )}

        <div className="mt-10 grid gap-4">
          {flows.map((flow, index) => (
            <Link
              key={flow.id}
              href={"/questionnaire?flow=" + flow.id}
              className="group flex items-center justify-between gap-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)] hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(15,23,42,.08)] sm:p-6"
            >
              <div className="flex min-w-0 items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                  0{index + 1}
                </span>
                <div>
                  <div className="text-lg font-semibold tracking-tight">{flow.label}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">{flow.description}</div>
                </div>
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">→</span>
            </Link>
          ))}
        </div>

        {rulesMode === "preview" && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Preview mode: flows without a verified rule set are shown with provisional requirements until each rule is mapped to an official Korean immigration source.
          </div>
        )}
      </section>
    </main>
  );
}
