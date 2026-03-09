import "server-only"
import webpush from "web-push"
import { db } from "@/server/db"

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? "admin@concretiza.com.br"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function notificarUsuarios(
  usuarioIds: string[],
  payload: { title: string; body: string; url?: string },
) {
  if (!process.env.VAPID_PRIVATE_KEY) return

  const subs = await db.pushSubscription.findMany({
    where: { usuarioId: { in: usuarioIds } },
  })

  await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
        .catch(() => {
          // Subscription inválida — remove
          db.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
        }),
    ),
  )
}

export async function notificarEmpresa(
  empresaId: string,
  payload: { title: string; body: string; url?: string },
) {
  const usuarios = await db.usuario.findMany({
    where: { empresaId },
    select: { id: true },
  })
  await notificarUsuarios(usuarios.map((u) => u.id), payload)
}
