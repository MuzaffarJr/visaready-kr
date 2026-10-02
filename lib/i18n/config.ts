/**
 * Locales the product serves. Only fully translated locales are routable;
 * scaffolded ones have catalogues in progress and fall back to English until
 * a translator completes them (backlog P1-1).
 */
export const locales = ["uz", "en"] as const;
export type Locale = (typeof locales)[number];

export const scaffoldedLocales = ["vi", "zh"] as const;
export type ScaffoldedLocale = (typeof scaffoldedLocales)[number];

export type AnyLocale = Locale | ScaffoldedLocale;

/** Fallback for content and for visitors whose browser asks for no supported language. */
export const defaultLocale: Locale = "en";

export const localeCookie = "NEXT_LOCALE";

/** Each language's own name, so a visitor can find theirs whatever the current UI language. */
export const localeNames: Record<AnyLocale, string> = {
  uz: "Oʻzbekcha",
  en: "English",
  vi: "Tiếng Việt",
  zh: "中文",
};

/** BCP 47 tag for `<html lang>` and `Intl`. */
export const languageTags: Record<AnyLocale, string> = {
  uz: "uz-Latn",
  en: "en",
  vi: "vi",
  zh: "zh-Hans",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return (locales as readonly string[]).includes(value ?? "");
}

/**
 * Picks the best routable locale from an `Accept-Language` header, by quality
 * value and then header order. Region and script subtags are ignored, so
 * `uz-Cyrl-UZ` maps to Uzbek (the only Uzbek catalogue is Latin).
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  const ranges = (acceptLanguage ?? "")
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number(q.slice(2)) : 1;
      return { primary: tag.split("-")[0]!.toLowerCase(), quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter((range) => range.primary && range.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  return ranges.map((range) => range.primary).find(isLocale) ?? defaultLocale;
}

/** Prefixes an app path (`/start?flow=x`) with the locale segment. */
export function localePath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Swaps the locale segment of a pathname, keeping the rest of the path. */
export function switchLocalePath(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) segments[1] = locale;
  else segments.splice(1, 0, locale);
  const next = segments.join("/").replace(/\/$/, "");
  return next || `/${locale}`;
}
