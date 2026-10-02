import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/site-header";
import { availableFlows } from "@/lib/checklist-service";
import { rulesMode } from "@/lib/config";
import { flowText, format, getMessages, isLocale, localePath } from "@/lib/i18n";

// Effective dates can change which flows are available without a redeploy.
export const revalidate = 3600;

export default async function StartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { common, start: m } = getMessages(locale);
  const flows = availableFlows();

  return (
    <main className="min-h-screen pb-16">
      <SiteHeader locale={locale}>
        <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:inline">
          {format(common.step, { step: 1, total: 2 })}
        </span>
      </SiteHeader>

      <section className="mx-auto max-w-3xl px-5 pt-12 sm:pt-20">
        <div className="mb-3 text-sm font-semibold text-blue-600">{m.eyebrow}</div>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">{m.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{m.lead}</p>

        {flows.length === 0 && (
          <div className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-600">{m.empty}</div>
        )}

        <div className="mt-10 grid gap-4">
          {flows.map((flow, index) => {
            const text = flowText(locale, flow);
            return (
              <Link
                key={flow.id}
                href={localePath(locale, "/questionnaire?flow=" + flow.id)}
                className="group flex items-center justify-between gap-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)] hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(15,23,42,.08)] sm:p-6"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                    0{index + 1}
                  </span>
                  <div>
                    <div className="text-lg font-semibold tracking-tight">{text.label}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">{text.description}</div>
                  </div>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">→</span>
              </Link>
            );
          })}
        </div>

        {rulesMode === "preview" && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">{m.preview}</div>
        )}
      </section>
    </main>
  );
}
