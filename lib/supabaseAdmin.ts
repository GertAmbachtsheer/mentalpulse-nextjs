import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client using service role key.
// Never import this into client components.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

