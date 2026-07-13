import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get credentials from env or localStorage
export function getSavedCredentials() {
  const envUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
  
  const localUrl = localStorage.getItem('zelox_supabase_url');
  const localKey = localStorage.getItem('zelox_supabase_anon_key');
  
  return {
    url: envUrl || localUrl || '',
    key: envKey || localKey || '',
    isEnv: !!(envUrl && envKey)
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function initSupabase(url: string, key: string): SupabaseClient | null {
  if (!url || !key) {
    supabaseInstance = null;
    return null;
  }
  try {
    // Basic URL validation
    const cleanUrl = url.trim().replace(/\/$/, '');
    supabaseInstance = createClient(cleanUrl, key.trim());
    return supabaseInstance;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    supabaseInstance = null;
    return null;
  }
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    const { url, key } = getSavedCredentials();
    if (url && key) {
      initSupabase(url, key);
    }
  }
  return supabaseInstance;
}

export function saveCredentials(url: string, key: string) {
  if (!url || !key) {
    localStorage.removeItem('zelox_supabase_url');
    localStorage.removeItem('zelox_supabase_anon_key');
  } else {
    localStorage.setItem('zelox_supabase_url', url.trim());
    localStorage.setItem('zelox_supabase_anon_key', key.trim());
  }
  return initSupabase(url, key);
}
