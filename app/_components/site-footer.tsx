export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/60">
      <div className="vr-shell grid gap-3 py-8 text-xs leading-5 text-slate-500 sm:grid-cols-2">
        <p>
          VisaReady KR is a preparation aid, not legal advice, a law firm or a government service. Always confirm
          requirements with{" "}
          <a className="underline underline-offset-2 hover:text-slate-800" href="https://www.hikorea.go.kr" target="_blank" rel="noopener noreferrer">
            HiKorea
          </a>{" "}
          or the Immigration Contact Center (1345) before you apply.
        </p>
        <p className="sm:text-right">
          Privacy: your answers are processed in your browser to build the checklist and are not sent to or stored on our
          servers.
        </p>
      </div>
    </footer>
  );
}
