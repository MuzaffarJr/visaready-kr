import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "../_components/site-footer";
import { getMessages, isLocale, languageTags, locales } from "@/lib/i18n";
import "../globals.css";

type Props = { params: Promise<{ locale: string }> };

// Unknown locale segments 404 instead of rendering.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale).meta;
  return { title: m.title, description: m.description };
}

export default async function RootLayout({ children, params }: Readonly<Props & { children: React.ReactNode }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={languageTags[locale]}>
      <body>
        {children}
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
