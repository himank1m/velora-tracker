import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseEnvStatus = {
  mode: import.meta.env.MODE,
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  anonKeyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
};

export const supabaseConfigError = [
  'Supabase is not configured in this build.',
  `VITE_SUPABASE_URL: ${supabaseEnvStatus.hasUrl ? 'found' : 'missing'}.`,
  `VITE_SUPABASE_ANON_KEY: ${supabaseEnvStatus.hasAnonKey ? 'found' : 'missing'}.`,
  'For Android, create .env in the project root, then run: npm run build && npx cap sync android, then rebuild the APK.',
].join(' ');

console.info('[Velora] Supabase env check', supabaseEnvStatus);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
