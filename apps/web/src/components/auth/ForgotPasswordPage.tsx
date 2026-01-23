import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">メール送信完了</h1>
        <p className="text-gray-600 mb-4">パスワードリセット用のリンクをメールで送信しました。</p>
        <Link to="/login" className="text-blue-600 hover:underline">
          ログインページへ
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">パスワードリセット</h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '送信中...' : 'リセットメールを送信'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <Link to="/login" className="text-blue-600 hover:underline">
          ログインページへ戻る
        </Link>
      </div>
    </div>
  );
}
