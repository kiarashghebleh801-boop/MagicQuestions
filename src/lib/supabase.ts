import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lrrlwilhbubyjwiyytsj.supabase.co";
const supabasePublishableKey = "sb_publishable_fGESICDpU45dU5un7M4ntw_FUrb8yDE";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
