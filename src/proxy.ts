import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Deixa passar: API, assets estáticos, ícones, SW, manifest
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/offline.html" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Sem variáveis de ambiente configuradas (dev sem banco) → deixa passar
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute    = pathname.startsWith("/login") || pathname.startsWith("/register")
  const isCallbackRoute = pathname.startsWith("/auth/callback") || pathname.startsWith("/invite")

  // Rotas de autenticação: se já tem sessão → redireciona para obras
  if (isAuthRoute) {
    if (user) return NextResponse.redirect(new URL("/obras", request.url))
    return response
  }

  // Rotas públicas especiais
  if (isCallbackRoute) return response

  // Rota protegida sem sessão → redireciona para login
  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw\\.js|offline\\.html).*)",
  ],
}
