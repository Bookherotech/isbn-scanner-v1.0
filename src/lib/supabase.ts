import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Keep the preview renderable when Supabase variables are not configured yet.
// Database calls will return their normal client errors until the integration is connected.
const fallbackUrl = 'https://missing-supabase-config.supabase.co';
const fallbackKey = 'missing-supabase-anon-key';

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackKey
);
