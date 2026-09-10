import { NextResponse } from "next/server";
import { PORTAL_COOKIE_NAME } from "@/lib/portal-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PORTAL_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
