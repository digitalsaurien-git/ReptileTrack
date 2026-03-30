import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fdiuyevsrfwwrpqwgssr.supabase.co';
const supabaseAnonKey = 'sb_publishable_MNxF1b5o9tXdr7y_jYWMMw_dMsxdHb7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
