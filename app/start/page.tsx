import Link from "next/link";
import { flows } from "@/lib/visa";

export default function StartPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 md:py-16">
      <Link href="/" className="text-sm text-slate-500">
        ← VisaReady KR
      </Link>

      <div className="mt-10">
        <p className="text-sm font-semibold text-blue-600">Step 1 of 2</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          What are you preparing for?
        </h1>
        <p className="mt-3 text-slate-600">
          Choose one visa action. We’ll only show questions relevant to that
          flow.
        </p>
      </div>

      <div className="mt-8 grid gap-3">
        {flows.map((flow) => (
          <Link
            key={flow.id}
            href={"/questionnaire?flow=" + flow.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
          >
            <div className="font-semibold">{flow.label}</div>
            <div className="mt-1 text-sm leading-6 text-slate-600">
              {flow.description}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
