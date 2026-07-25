import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env file in non-production environments
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv')
  dotenv.config()
}

// Support both NEXT_PUBLIC_ (for Next.js) and non-prefixed (for worker) env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client for server-side operations using service role key (for API routes and worker)
export const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!)
