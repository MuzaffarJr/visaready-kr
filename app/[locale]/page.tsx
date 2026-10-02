import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../_components/site-header";
import { getMessages, isLocale, localePath } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { common, landing: m } = getMessages(locale);
  const start = localePath(locale, "/start");

  const proof = [
    [m.proofFlowsValue, m.proofFlows],
    [m.proofNamesValue, m.proofNames],
    [m.proofEngineValue, m.proofEngine],
  ];
  const steps = [
    ["01", m.step1Title, m.step1Body],
    ["02", m.step2Title, m.step2Body],
    ["03", m.step3Title, m.step3Body],
  ];

  return (
    <main className="min-h-screen overflow-hidden">
      <SiteHeader locale={locale}>
        <Link
          href={localePath(locale, "/law")}
          className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 sm:inline-flex"
        >
          {common.lawSearch}
        </Link>
        <Link
          href={start}
          className="inline-flex items-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-slate-800"
        >
          {common.startCheck}
        </Link>
      </SiteHeader>

      <section className="vr-shell grid items-center gap-14 pb-24 pt-16 lg:grid-cols-[1.08fr_.92fr] lg:pt-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            <span className="size-2 rounded-full bg-blue-600" />
            {m.badge}
          </div>

          <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.055em] text-balance text-slate-950 sm:text-6xl lg:text-7xl">
            {m.title}
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">{m.lead}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href={start}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-[0_12px_30px_rgba(21,94,239,.2)] hover:-translate-y-0.5 hover:bg-blue-700"
            >
              {m.primaryCta}
              <span aria-hidden>→</span>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-5 py-3.5 font-semibold text-slate-800 hover:border-slate-400"
            >
              {m.secondaryCta}
            </a>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-5 border-t border-slate-200 pt-6">
            {proof.map(([value, label]) => (
              <div key={label}>
                <div className="text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[520px]">
          <div className="absolute inset-8 rounded-[2.5rem] bg-blue-600/10 blur-3xl" />
          <div className="vr-grid vr-glass relative h-full min-h-[520px] rounded-[2rem] border border-white/80 p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">{m.previewEyebrow}</div>
                <div className="mt-1 text-lg font-semibold">{m.previewFlow}</div>
              </div>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                {m.previewReady}
              </span>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-200/70">
              <div className="h-full w-[71%] rounded-full bg-blue-600" />
            </div>

            <div className="relative mt-7 min-h-[330px]">
              <div className="vr-doc absolute left-0 top-12 w-[74%] -rotate-3 rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,.12)]">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{m.previewDocument}</div>
                    <h2 className="mt-2 text-xl font-semibold">{m.previewDocumentName}</h2>
                    <p lang="ko" className="mt-1 font-medium text-slate-600">재학증명서</p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-full bg-emerald-50 font-bold text-emerald-700">✓</span>
                </div>
                <div className="mt-8 grid gap-3">
                  <div className="h-2 w-3/4 rounded-full bg-slate-100" />
                  <div className="h-2 w-1/2 rounded-full bg-slate-100" />
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="size-2 rounded-full bg-amber-500" />
                    {m.previewPending}
                  </div>
                </div>
              </div>

              <div className="vr-doc absolute bottom-1 right-0 w-[68%] rotate-3 rounded-[1.6rem] border border-blue-100 bg-[#f7f9ff] p-5 shadow-[0_18px_50px_rgba(15,23,42,.10)]">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">{m.previewItem}</div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{m.previewItemName}</div>
                    <div lang="ko" className="mt-1 text-sm text-slate-500">체류지 입증서류</div>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full border border-slate-300 bg-white text-slate-400">○</span>
                </div>
              </div>

              <div className="absolute right-4 top-5 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-lg">
                <div className="text-[11px] uppercase tracking-[.16em] text-slate-400">{m.previewEvery}</div>
                <div className="mt-1 text-sm font-medium">{m.previewLanguages}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white">
        <div className="vr-shell py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-600">{m.howEyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">{m.howTitle}</h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <article key={number} className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-600">{number}</span>
                  <span className="grid size-9 place-items-center rounded-full bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-700">↗</span>
                </div>
                <h3 className="mt-10 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="vr-shell py-20">
        <div className="rounded-[2rem] bg-slate-950 px-6 py-10 text-white sm:px-10 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="text-sm font-medium text-blue-300">{m.ctaEyebrow}</div>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{m.ctaTitle}</h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-300">{m.ctaBody}</p>
            </div>
            <Link href={start} className="inline-flex rounded-2xl bg-white px-5 py-3.5 font-semibold text-slate-950 hover:-translate-y-0.5">
              {m.ctaButton}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
