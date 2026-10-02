import { getMessages, type Locale } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const m = getMessages(locale).footer;
  return (
    <footer className="border-t border-slate-200 bg-white/60">
      <div className="vr-shell grid gap-3 py-8 text-xs leading-5 text-slate-500 sm:grid-cols-2">
        <p>
          {m.disclaimerBefore}{" "}
          <a className="underline underline-offset-2 hover:text-slate-800" href="https://www.hikorea.go.kr" target="_blank" rel="noopener noreferrer">
            HiKorea
          </a>{" "}
          {m.disclaimerAfter}
        </p>
        <p className="sm:text-right">{m.privacy}</p>
      </div>
    </footer>
  );
}
