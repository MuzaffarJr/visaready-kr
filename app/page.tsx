import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="font-semibold tracking-tight">VisaReady KR</div>
        <span className="text-sm text-slate-500">EN · VI · 中文 · UZ</span>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 md:grid-cols-[1.2fr_.8fr] md:pt-24">
        <div>
          <div className="mb-5 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">
            Korean visa preparation, simplified
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 md:text-7xl">
            Get your Korean visa documents right.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Answer a few questions and get a personalized document checklist
            for your Korean visa application.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/start"
              className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              Build my checklist
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800"
            >
              How it works
            </a>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            VisaReady KR is not a government service or law firm. Always verify
            critical requirements with official authorities.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Example readiness
          </div>
          <div className="mt-2 text-4xl font-semibold">5 of 7</div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[71%] rounded-full bg-blue-600" />
          </div>

          <div className="mt-7 space-y-3 text-sm">
            {[
              "Passport · 여권",
              "Residence Card · 외국인등록증",
              "Certificate of Enrollment · 재학증명서",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
              >
                <span className="grid size-6 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                  ✓
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:grid-cols-3">
          {[
            [
              "01",
              "Choose your visa action",
              "Start with the exact immigration action you are preparing for.",
            ],
            [
              "02",
              "Answer relevant questions",
              "We only ask questions that can affect your checklist.",
            ],
            [
              "03",
              "Prepare your documents",
              "Get a deterministic checklist with Korean document names and source status.",
            ],
          ].map(([number, title, description]) => (
            <article
              key={number}
              className="rounded-2xl border border-slate-200 p-6"
            >
              <div className="text-sm font-semibold text-blue-600">
                {number}
              </div>
              <h2 className="mt-8 text-xl font-semibold">{title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
