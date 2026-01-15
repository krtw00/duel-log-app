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
      // Supabaseが自動でURLから認証パラメータを検出・処理
      detectSessionInUrl: true,
      flowType: 'pkce',
      // navigator.locks APIのデッドロック問題を回避
      lock: noopLock,
    },
    global: {
      fetch: (url, options = {}) => {
        // Keep-Alive接続を有効化し、接続の再利用を促進
        return fetch(url, {
          ...options,
          keepalive: true,
        });
      },
    },
  },
);

/**
 * Supabaseのローカルストレージキーをクリアする
 * 古いセッションデータによるロック問題を解決するために使用
 * 注意: PKCEのcode_verifierは保持する（OAuth認証に必要）
 * Supabaseは「code_verifier」（アンダースコア）を使用するが、念のため両方の形式を保持
 */
export const clearSupabaseLocalStorage = () => {
  try {
    const supabaseKeys = Object.keys(localStorage).filter(
      (key) =>
        (key.startsWith('sb-') || key.includes('supabase')) &&
        !key.includes('code_verifier') && // PKCEのcode_verifierは保持（アンダースコア形式）
        !key.includes('code-verifier'), // 念のためハイフン形式も保持
    );
    supabaseKeys.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.debug('Failed to clear Supabase localStorage:', e);
  }
};

export default supabase;
