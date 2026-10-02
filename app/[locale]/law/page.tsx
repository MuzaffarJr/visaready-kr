import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/site-header";
import { format, getMessages, isLocale, localePath, plural, type Messages } from "@/lib/i18n";
import { excerpt, immigrationAct, immigrationActIndex, type LawHit } from "@/lib/law";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale).meta;
  return { title: m.lawTitle, description: m.lawDescription };
}

const examples = ["viza muddatini uzaytirish", "체류기간 연장", "jarima", "alien registration", "25-modda"];

function koreanNumber(number: string): string {
  const [main, sub] = number.split("-");
  return sub ? `제${main}조의${sub}` : `제${main}조`;
}

function Article({ hit, open, m }: { hit: LawHit; open: boolean; m: Messages["law"] }) {
  const preview = hit.en ? excerpt(hit.en.text, hit.matchedTerms) : hit.ko ? excerpt(hit.ko.text, hit.matchedTerms) : "";
  const deleted = hit.ko?.deleted ?? hit.en?.deleted ?? false;

  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,.035)]">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          {format(m.article, { number: hit.number })}
          {hit.en?.title ? ` · ${hit.en.title}` : ""}
        </h2>
        <span lang="ko" className="text-sm font-semibold text-slate-600">
          {koreanNumber(hit.number)} {hit.ko?.title}
        </span>
        {hit.match === "reference" && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            {m.exactArticle}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">{hit.en?.chapter}</p>
      {deleted ? (
        <p className="mt-3 text-sm text-slate-600">{m.deleted}</p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-slate-700">{preview}</p>
          <details className="mt-3" open={open}>
            <summary className="cursor-pointer text-sm font-semibold text-blue-700">{m.fullText}</summary>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div lang="ko" className="whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-800">
                {hit.ko?.text}
              </div>
              <div lang="en" className="whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-800">
                {hit.en?.text}
              </div>
            </div>
          </details>
        </>
      )}
    </article>
  );
}

export default async function LawSearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { common, law: m } = getMessages(locale);
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 200) ?? "";
  const hits = query ? immigrationActIndex().search(query, 10) : [];
  const { ko, en } = immigrationAct;

  return (
    <main className="min-h-screen pb-20">
      <SiteHeader locale={locale}>
        <Link
          href={localePath(locale, "/start")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
        >
          {common.buildChecklist}
        </Link>
      </SiteHeader>

      <section className="mx-auto max-w-4xl px-5 pt-10 sm:pt-16">
        <p className="text-sm font-semibold text-blue-600">{m.eyebrow}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">{m.title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">{m.lead}</p>

        <div role="note" className="mt-6 rounded-[1.2rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>{format(m.versionTitle, { date: ko.enforcementDate })}</strong> ({ko.actNumber}). {m.versionBefore}{" "}
          <a className="font-semibold underline" href="https://www.law.go.kr" target="_blank" rel="noopener noreferrer">
            law.go.kr
          </a>{" "}
          {m.versionAfter}
        </div>

        <form action={localePath(locale, "/law")} method="get" role="search" className="mt-8 flex gap-3">
          <label htmlFor="law-q" className="sr-only">
            {m.searchLabel}
          </label>
          <input
            id="law-q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={m.placeholder}
            className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <button type="submit" className="shrink-0 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
            {m.searchButton}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {examples.map((example) => (
            <Link
              key={example}
              href={localePath(locale, "/law?q=" + encodeURIComponent(example))}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-blue-200 hover:text-blue-700"
            >
              {example}
            </Link>
          ))}
        </div>

        <div className="mt-10 space-y-4">
          {query && hits.length === 0 && (
            <p className="rounded-[1.2rem] border border-slate-200 bg-white p-5 text-slate-600">{format(m.noResults, { query })}</p>
          )}
          {hits.length > 0 && (
            <p className="text-sm text-slate-500">
              {format(plural(locale, hits.length, { one: m.resultsOne, other: m.resultsOther }), { count: hits.length, query })}
            </p>
          )}
          {hits.map((hit, index) => (
            <Article key={hit.number} hit={hit} open={index === 0} m={m} />
          ))}
        </div>

        <p className="mt-10 text-xs leading-5 text-slate-500">
          {format(m.source, {
            koTitle: ko.title,
            enTitle: en.title,
            actNumber: ko.actNumber,
            date: ko.enforcementDate,
            retrievedAt: ko.retrievedAt,
          })}
        </p>
      </section>
    </main>
  );
}
