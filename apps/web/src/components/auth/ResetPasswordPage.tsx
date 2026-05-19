import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { resetPassword } from '../../lib/auth.js';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('トークンが指定されていません。 メールのリンクから再度アクセスしてください。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは 6 文字以上で入力してください。');
      return;
    }
    if (password.length > 72) {
      setError('パスワードは 72 文字以下で入力してください。');
      return;
    }
    if (password !== confirmPassword) {
      setError('パスワードと確認用パスワードが一致しません。');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate({ to: '/login' }), 3000);
    } catch (err) {
      const code = (err as { error?: { code?: string } })?.error?.code;
      if (code === 'INVALID_TOKEN') {
        setError(
          'リンクが無効か期限切れです。 もう一度パスワード再設定リクエストをお送りください。',
        );
      } else {
        const message =
          (err as { error?: { message?: string } })?.error?.message ||
          'エラーが発生しました。 しばらくしてから再度お試しください。';
        setError(message);
      }
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
          <p className="text-white/70 text-sm tracking-[3px] uppercase">New Password</p>
        </div>

        {done ? (
          <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 text-emerald-200 text-sm rounded-lg space-y-2">
            <p className="font-semibold text-emerald-300">パスワードを更新しました</p>
            <p>3 秒後にログイン画面へ移動します。</p>
            <p className="text-emerald-200/80 text-xs">
              セキュリティのため、 他のセッションは自動的にログアウトされました。 新しいパスワードでログインしてください。
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
              <p className="text-white/70 text-sm">新しいパスワードを入力してください。</p>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="新しいパスワード (6 文字以上)"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan focus:shadow-[0_0_20px_rgba(0,217,255,0.15)] transition-all"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="新しいパスワード (確認)"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan focus:shadow-[0_0_20px_rgba(0,217,255,0.15)] transition-all"
              />
              <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="accent-brand-cyan"
                />
                パスワードを表示
              </label>
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full py-3 px-4 bg-brand-cyan text-brand-dark-1 font-semibold tracking-wider rounded-lg hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,217,255,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
              >
                {loading ? '更新中...' : 'パスワードを更新'}
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
