import { NextRequest } from "next/server";

/**
 * Rate limit simples em memória, por instância do processo. Não é
 * distribuído (cada instância serverless tem seu próprio contador e
 * zera em cold start), mas já barra o abuso mais comum — um cliente
 * ou bot martelando uma rota pública repetidamente — sem precisar de
 * infraestrutura extra (Redis etc). Suficiente para o volume de uma
 * oficina; se o tráfego crescer muito, trocar por um limitador
 * distribuído (ex: Upstash Ratelimit).
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// evita crescimento indefinido do Map em instâncias de longa duração
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export function checkRateLimit(
  request: NextRequest,
  routeKey: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): boolean {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const key = `${routeKey}:${ip}`;
  const now = Date.now();

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}
