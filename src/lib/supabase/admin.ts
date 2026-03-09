import { createClient } from "@supabase/supabase-js"

/** Cliente admin com service role — usar apenas em rotas server-side */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
