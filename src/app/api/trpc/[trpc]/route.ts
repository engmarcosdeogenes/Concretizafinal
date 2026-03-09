import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { type NextRequest } from "next/server"
import { createTRPCContext } from "@/server/trpc"
import { appRouter } from "@/server/routers/_app"

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            // UNAUTHORIZED é esperado em dev sem banco — não poluir console
            if (error.code === "UNAUTHORIZED") return
            console.error(`❌ tRPC error on '${path}':`, error)
          }
        : undefined,
  })

export { handler as GET, handler as POST }
