import Link from "next/link";
import { getMessages, localePath, type Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";

/** Brand, language switcher and the page's own actions (passed as children). */
export function SiteHeader({ locale, children }: { locale: Locale; children?: React.ReactNode }) {
  const m = getMessages(locale);
  return (
    <header className="vr-shell flex items-center justify-between gap-3 py-5">
      <Link href={localePath(locale, "/")} className="flex shrink-0 items-center gap-3 font-semibold tracking-tight">
        <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white shadow-sm">
          V
        </span>
        <span className="hidden min-[400px]:inline">VisaReady KR</span>
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSwitcher current={locale} label={m.common.language} />
        {children}
      </div>
    </header>
  );
}
