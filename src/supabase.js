import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qsnezzijezlfsriwhgwc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbmV6emlqZXpsZnNyaXdoZ3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDI3OTUsImV4cCI6MjA5MDcxODc5NX0.2mjQi4AHEmvXIfMDzbjC3Ps4HqT1gmsk0ToXGTXwyMk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

