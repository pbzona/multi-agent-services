import {
  createDemoSessionToken,
  DEMO_SESSION_COOKIE,
  verifyDemoSessionToken,
} from "@repo/demo-auth";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const existingToken = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  if (existingToken) {
    try {
      await verifyDemoSessionToken(existingToken);
      return NextResponse.next();
    } catch {
      // Replace malformed or expired demo sessions with the safe default.
    }
  }

  const token = await createDemoSessionToken("customer");
  const requestHeaders = new Headers(request.headers);
  const cookie = `${DEMO_SESSION_COOKIE}=${encodeURIComponent(token)}`;
  const existingCookies = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((value) => value.trim())
    .filter((value) => value && !value.startsWith(`${DEMO_SESSION_COOKIE}=`));
  requestHeaders.set("cookie", [...existingCookies, cookie].join("; "));

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(DEMO_SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: "/",
    sameSite: "lax",
    secure,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/persona|eve/).*)"],
};
