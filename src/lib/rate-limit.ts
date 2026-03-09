/**
 * Rate limiter in-memory com sliding window.
 * Sem dependências externas — funciona para single-instance (Vercel serverless
 * usa instâncias isoladas, mas o limite por usuário/IP já protege contra abuso).
 *
 * Para escala multi-instância, trocar por Upstash Redis.
 */

const store = new Map<string, number[]>()

// Limpeza periódica para não vazar memória
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter(t => now - t < 24 * 60 * 60 * 1000) // 24h max
    if (valid.length === 0) store.delete(key)
    else store.set(key, valid)
  }
}, 5 * 60 * 1000) // a cada 5 min

interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfter: number // segundos
}

/**
 * Verifica e registra uma tentativa.
 * @param key    Chave única (ex: "onboard:1.2.3.4", "upload:user_id")
 * @param limit  Número máximo de requisições na janela
 * @param windowMs Janela em milissegundos
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  const timestamps = (store.get(key) ?? []).filter(t => t > windowStart)

  if (timestamps.length >= limit) {
    const oldest = timestamps[0]!
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000)
    return { ok: false, remaining: 0, retryAfter }
  }

  timestamps.push(now)
  store.set(key, timestamps)

  return { ok: true, remaining: limit - timestamps.length, retryAfter: 0 }
}

/** Extrai o IP real do request (considera proxies / Vercel headers) */
export function getClientIp(request: Request): string {
  const headers = new Headers((request as Request & { headers: Headers }).headers)
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}
