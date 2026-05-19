import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { requestPasswordReset } from '../../lib/auth.js';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        'エラーが発生しました。 しばらくしてから再度お試しください。';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark-1 px-6 py-12">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-wider mb-2">
            <span className="text-brand-cyan">DUEL</span>
            <span className="text-brand-purple">LOG</span>
          </h1>
          <p className="text-white/70 text-sm tracking-[3px] uppercase">Password Reset</p>
        </div>

        {submitted ? (
          <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 text-emerald-200 text-sm rounded-lg space-y-2">
            <p className="font-semibold text-emerald-300">受け付けました</p>
            <p>
              入力されたメールアドレスが登録されている場合、 パスワード再設定リンクをお送りしました。
            </p>
            <p className="text-emerald-200/80 text-xs">
              メールが届かない場合は迷惑メールフォルダもご確認ください (リンク有効期限: 1 時間)。
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 text-red-300 text-sm rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-white/70 text-sm">
                登録時のメールアドレスを入力してください。 パスワード再設定リンクをお送りします。
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan focus:shadow-[0_0_20px_rgba(0,217,255,0.15)] transition-all"
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 px-4 bg-brand-cyan text-brand-dark-1 font-semibold tracking-wider rounded-lg hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,217,255,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
              >
                {loading ? '送信中...' : '再設定リンクを送信'}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-brand-cyan hover:underline text-sm transition-colors"
          >
            ← ログインに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
