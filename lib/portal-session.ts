import crypto from "crypto";

export const PORTAL_COOKIE_NAME = "gearos_portal";
export const PORTAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function sign(data: string): string {
  return crypto.createHmac("sha256", process.env.PORTAL_SESSION_SECRET!).update(data).digest("base64url");
}

export function createPortalToken(checklistId: number): string {
  const payload = JSON.stringify({ id: checklistId, exp: Date.now() + PORTAL_COOKIE_MAX_AGE * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyPortalToken(token: string | undefined | null): number | null {
  if (!token) return null;

  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  try {
    const expected = sign(encoded);
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (typeof payload.id !== "number" || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;

    return payload.id;
  } catch {
    return null;
  }
}
