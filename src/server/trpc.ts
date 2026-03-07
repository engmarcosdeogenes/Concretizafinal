import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import { ZodError } from "zod"
import { createServerClient } from "@supabase/ssr"
import { db } from "./db"

export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Lê cookies dos headers para autenticação SSR
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = opts.headers.get("cookie") ?? ""
          return cookieHeader.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=")
            return { name: name.trim(), value: rest.join("=") }
          })
        },
        setAll() {},
      },
    }
  )

  const { data: { user: authUser } } = await supabase.auth.getUser()

  let session = null
  if (authUser) {
    const usuario = await db.usuario.findUnique({
      where: { authId: authUser.id },
      select: { id: true, empresaId: true, role: true, nome: true },
    })
    if (usuario) {
      session = { userId: usuario.id, empresaId: usuario.empresaId, role: usuario.role, nome: usuario.nome }
    }
  }

  return { db, session }
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({ ctx: { ...ctx, session: ctx.session } })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
