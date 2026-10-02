import { NextResponse, type NextRequest } from "next/server";
import { isLocale, localeCookie, negotiateLocale } from "@/lib/i18n/config";

/**
 * Every page lives under a locale segment (`/uz/...`, `/en/...`). Requests
 * without one are redirected to the visitor's last chosen language, else the
 * best match for their browser. The language switcher stores that choice.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segment = pathname.split("/")[1];
  // Not remembered here: router prefetches of the other language's links pass through too.
  if (isLocale(segment)) return NextResponse.next();

  const remembered = request.cookies.get(localeCookie)?.value;
  const locale = isLocale(remembered) ? remembered : negotiateLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  // The target depends on these request headers, so shared caches must not reuse it across visitors.
  response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}

export const config = {
  // Skip Next internals and files (icon.svg, manifest.webmanifest, robots.txt, ...).
  matcher: ["/((?!_next/|.*\\.[^/]+$).*)"],
};
