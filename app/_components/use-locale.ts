"use client";

import { useParams } from "next/navigation";
import { defaultLocale, getMessages, isLocale, type Locale, type Messages } from "@/lib/i18n";

/** Locale of the current route (`/[locale]/...`) and its UI copy, for client components. */
export function useLocale(): { locale: Locale; m: Messages } {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return { locale, m: getMessages(locale) };
}
