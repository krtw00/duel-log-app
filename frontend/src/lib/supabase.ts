import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Using dummy values for development.');
  // ダミー値を使用してアプリがクラッシュしないようにする
  // 本番環境では環境変数を設定してください
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // OAuth コールバック用のリダイレクトURL
      flowType: 'pkce',
    },
  },
);

/**
 * Supabaseのローカルストレージキーをクリアする
 * 古いセッションデータによるロック問題を解決するために使用
 */
export const clearSupabaseLocalStorage = () => {
  try {
    const supabaseKeys = Object.keys(localStorage).filter(
      (key) => key.startsWith('sb-') || key.includes('supabase'),
    );
    supabaseKeys.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.debug('Failed to clear Supabase localStorage:', e);
  }
};

export default supabase;
