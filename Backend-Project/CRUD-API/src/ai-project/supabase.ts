import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

/* -------------------------------------------------------
   Supabase client
   The SERVICE ROLE key is used on the server so that we can
   call supabase.auth.getUser(token) to verify JWTs on the
   backend without trusting the client.
   ------------------------------------------------------- */
const supabaseUrl  = process.env.SUPABASE_URL;
const supabaseKey  = process.env.SUPABASE_SECRET_KEY;   // service-role key

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars – set SUPABASE_URL and SUPABASE_SECRET_KEY in .env'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Disable auto-refresh on the server; the client owns its own session.
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabase;
