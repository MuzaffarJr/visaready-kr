"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { languageTags, localeCookie, localeNames, locales, switchLocalePath, type Locale } from "@/lib/i18n";

/** Remembered so links without a language (`/start`, shared URLs) open in the chosen one. */
function remember(locale: Locale) {
  document.cookie = `${localeCookie}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

function Links({ current, label, search }: { current: Locale; label: string; search: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs font-semibold">
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={switchLocalePath(pathname, locale) + search}
            hrefLang={languageTags[locale]}
            lang={languageTags[locale]}
            title={localeNames[locale]}
            aria-current={active ? "true" : undefined}
            // Answers live in the query string, so switching keeps them.
            scroll={false}
            onClick={() => remember(locale)}
            className={
              "rounded-[10px] px-2.5 py-1.5 uppercase " +
              (active ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-900")
            }
          >
            <span aria-hidden>{locale}</span>
            <span className="sr-only">{localeNames[locale]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function WithSearch(props: { current: Locale; label: string }) {
  const params = useSearchParams();
  const search = params.size > 0 ? "?" + params.toString() : "";
  return <Links {...props} search={search} />;
}

export function LanguageSwitcher(props: { current: Locale; label: string }) {
  return (
    <Suspense fallback={<Links {...props} search="" />}>
      <WithSearch {...props} />
    </Suspense>
  );
}
