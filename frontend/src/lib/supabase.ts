import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Using dummy values for development.');
  // ダミー値を使用してアプリがクラッシュしないようにする
  // 本番環境では環境変数を設定してください
}

/**
 * navigator.locks APIのデッドロックを回避するためのno-opロック関数
 * 古いセッションデータが残っている場合にハングする問題を解決
 */
const noopLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> => {
  return fn();
};

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
      // navigator.locks APIのデッドロック問題を回避
      // @ts-expect-error lock option exists in runtime but not in types for v2.90
      lock: noopLock,
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
