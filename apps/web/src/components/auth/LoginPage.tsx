import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase.js';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [streamerMode, setStreamerMode] = useState(() => {
    return localStorage.getItem('streamerMode') === 'true';
  });

  const handleStreamerModeToggle = () => {
    const newValue = !streamerMode;
    setStreamerMode(newValue);
    localStorage.setItem('streamerMode', String(newValue));
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        navigate({ to: '/' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'discord') => {
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding (desktop only) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-brand-dark-1 via-brand-dark-2 to-brand-dark-3">
        <div className="relative z-10 text-center px-10">
          <h1 className="text-7xl font-black tracking-wider mb-2">
            <span className="text-brand-cyan drop-shadow-[0_0_30px_rgba(0,217,255,0.5)]">DUEL</span>
            <span className="text-brand-purple drop-shadow-[0_0_30px_rgba(181,54,255,0.5)]">
              LOG
            </span>
          </h1>
          <p className="text-white/70 text-lg tracking-[4px] uppercase mb-12">
            Track. Analyze. Dominate.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-white/85 px-6 py-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:translate-x-1 transition-all">
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-brand-cyan shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>対戦統計の可視化</span>
            </div>
            <div className="flex items-center gap-3 text-white/85 px-6 py-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:translate-x-1 transition-all">
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-brand-purple shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span>デッキ管理・分析</span>
            </div>
            <div className="flex items-center gap-3 text-white/85 px-6 py-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:translate-x-1 transition-all">
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-brand-green shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>配信者サポート</span>
            </div>
          </div>
        </div>

        {/* Glow orbs */}
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-brand-cyan rounded-full blur-[100px] opacity-30 animate-float" />
        <div className="absolute bottom-[10%] right-[10%] w-60 h-60 bg-brand-purple rounded-full blur-[100px] opacity-30 animate-float-delayed" />
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 bg-brand-dark-1 lg:bg-brand-dark-2/50">
        {/* Mobile header */}
        <div className="lg:hidden text-center mb-8">
          <h1 className="text-4xl font-black tracking-wider">
            <span className="text-brand-cyan">DUEL</span>
            <span className="text-brand-purple">LOG</span>
          </h1>
          <p className="text-white/60 text-sm tracking-[3px] uppercase mt-1">
            Track. Analyze. Dominate.
          </p>
        </div>

        <div className="w-full max-w-[380px]">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email')}
                required
                className={`w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan focus:shadow-[0_0_20px_rgba(0,217,255,0.15)] transition-all${streamerMode ? ' streamer-mode-input' : ''}`}
              />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.password')}
                required
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan focus:shadow-[0_0_20px_rgba(0,217,255,0.15)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? (
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-cyan text-brand-dark-1 font-semibold tracking-wider rounded-lg hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,217,255,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
            >
              {loading ? t('auth.loggingIn') : t('auth.login')}
            </button>
          </form>

          {/* OAuth divider */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 text-xs">{t('auth.or')}</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* OAuth buttons */}
          <div className="flex gap-3 justify-center mb-5">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading || !!oauthLoading}
              className="flex-1 max-w-[120px] h-12 flex items-center justify-center border border-google/50 text-google rounded-lg hover:bg-google/10 hover:border-google hover:-translate-y-0.5 disabled:opacity-50 transition-all"
            >
              {oauthLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-google/30 border-t-google rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin('discord')}
              disabled={loading || !!oauthLoading}
              className="flex-1 max-w-[120px] h-12 flex items-center justify-center border border-discord/50 text-discord rounded-lg hover:bg-discord/10 hover:border-discord hover:-translate-y-0.5 disabled:opacity-50 transition-all"
            >
              {oauthLoading === 'discord' ? (
                <div className="w-5 h-5 border-2 border-discord/30 border-t-discord rounded-full animate-spin" />
              ) : (
                <DiscordIcon />
              )}
            </button>
          </div>

          {/* Register section */}
          <div className="pt-4 border-t border-white/10 text-center mb-4">
            <p className="text-white/60 text-sm mb-3">{t('auth.noAccount')}</p>
            <Link
              to="/register"
              className="block w-full py-2.5 px-4 bg-brand-purple/20 text-brand-purple border border-brand-purple/30 rounded-lg font-semibold text-sm hover:bg-brand-purple/30 transition-colors"
            >
              {t('auth.register')}
            </Link>
          </div>

          {/* Forgot password */}
          <div className="text-center mb-4">
            <Link
              to="/forgot-password"
              className="text-white/60 text-sm hover:text-brand-cyan transition-colors"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {/* Streamer mode */}
          <div className="flex justify-center mb-4" title={t('auth.streamerModeHint')}>
            <label className="flex items-center gap-2 cursor-pointer group">
              <button
                type="button"
                role="switch"
                aria-checked={streamerMode}
                onClick={handleStreamerModeToggle}
                className={`relative w-9 h-5 rounded-full transition-colors ${streamerMode ? 'bg-brand-purple' : 'bg-white/20'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${streamerMode ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
              <span className="flex items-center gap-1 text-white/60 text-xs group-hover:text-white/80 transition-colors">
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('profile.streamerMode')}
              </span>
            </label>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-white/50">
            {t('auth.termsNotice').split(t('auth.termsOfService'))[0]}
            <button
              type="button"
              onClick={() => setShowTermsDialog(true)}
              className="text-brand-cyan hover:underline cursor-pointer"
            >
              {t('auth.termsOfService')}
            </button>
            {t('auth.termsNotice').split(t('auth.termsOfService'))[1]}
          </p>
        </div>
      </div>

      {/* Terms Dialog */}
      {showTermsDialog && (
        <TermsDialog onClose={() => setShowTermsDialog(false)} />
      )}
    </div>
  );
}

function TermsDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-[800px] max-h-[80vh] bg-brand-dark-2 border border-white/20 rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg aria-hidden="true" className="w-5 h-5 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-bold text-white">利用規約</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="閉じる"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-white/87 text-sm leading-relaxed space-y-6">
          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第1条（適用）</h3>
            <p>本利用規約（以下「本規約」といいます）は、DUEL LOG（以下「本サービス」といいます）の利用条件を定めるものです。ユーザーの皆さま（以下「ユーザー」といいます）には、本規約に従って、本サービスをご利用いただきます。本サービスは個人により運営されています。</p>
          </section>

          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第2条（利用登録）</h3>
            <p className="mb-3">本サービスにおいては、登録希望者が本規約に同意の上、所定の方法によって利用登録を申請し、運営者がこれを承認することによって、利用登録が完了するものとします。運営者は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります。</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
              <li>本規約に違反したことがある者からの申請である場合</li>
              <li>その他、運営者が利用登録を適当でないと判断した場合</li>
            </ul>
          </section>

          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第3条（アカウント情報の管理）</h3>
            <p>ユーザーは、自己の責任において、本サービスのメールアドレスおよびパスワードを適切に管理するものとします。ユーザーは、いかなる場合にも、アカウント情報を第三者に譲渡または貸与し、もしくは第三者と共用することはできません。運営者は、メールアドレスとパスワードの組み合わせが登録情報と一致してログインされた場合には、そのアカウントを登録しているユーザー自身による利用とみなします。</p>
          </section>

          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第4条（個人情報の取扱い）</h3>
            <p className="mb-3">運営者は、ユーザーから提供された個人情報について、以下のとおり適切に取り扱います。</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>収集する情報：</strong>メールアドレス、ユーザー名、その他ユーザーが本サービスに登録・入力する情報</li>
              <li><strong>利用目的：</strong>本サービスの提供、ユーザー認証、サービスに関する通知、問い合わせ対応</li>
              <li><strong>保管方法：</strong>メールアドレスを含む個人情報は、暗号化された安全なデータベースに保管し、不正アクセスや情報漏洩を防ぐための適切なセキュリティ対策を講じます</li>
              <li><strong>第三者提供：</strong>法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません</li>
              <li><strong>データの削除：</strong>ユーザーがアカウントを削除した場合、登録された個人情報は速やかに削除されます</li>
            </ul>
            <p className="mt-3">運営者は、個人情報の保護に最大限の注意を払いますが、インターネットを通じた情報の送信には一定のリスクが伴うことをご理解ください。</p>
          </section>

          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第5条（禁止事項）</h3>
            <p className="mb-3">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>虚偽の情報を登録する行為</li>
              <li>本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第6条（本サービスの提供の停止等）</h3>
            <p className="mb-3">運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>本サービスにかかるシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
              <li>コンピュータまたは通信回線等が事故により停止した場合</li>
              <li>その他、運営者が本サービスの提供が困難と判断した場合</li>
            </ul>
          </section>

          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第7条（データの著作権）</h3>
            <p>ユーザーが本サービスに登録・入力したデュエル記録等のデータの著作権は、当該ユーザー自身に帰属します。運営者は、本サービスの運営・改善の目的でのみ、これらのデータを使用することができるものとします。</p>
          </section>

          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第8条（利用制限およびアカウント削除）</h3>
            <p className="mb-3">運営者は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはアカウントを削除することができるものとします。</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>本規約のいずれかの条項に違反した場合</li>
              <li>登録事項に虚偽の事実があることが判明した場合</li>
              <li>長期間ログインがなく、アカウントが放置されていると判断した場合</li>
              <li>その他、運営者が本サービスの利用を適当でないと判断した場合</li>
            </ul>
          </section>

          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第9条（免責事項）</h3>
            <p>本サービスは個人により運営されており、運営者は本サービスに関して、その安全性、信頼性、正確性、完全性、有効性などを保証するものではありません。本サービスの利用により生じたいかなる損害についても、運営者は一切の責任を負いません。ユーザーは自己の責任において本サービスを利用するものとします。</p>
          </section>

          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第10条（サービス内容の変更・終了）</h3>
            <p>運営者は、ユーザーへの事前通知の有無を問わず、本サービスの内容を変更し、または本サービスの提供を終了することができるものとします。本サービスが終了する場合、可能な限り事前に通知するよう努めますが、これを保証するものではありません。</p>
          </section>

          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第11条（利用規約の変更）</h3>
            <p>運営者は、必要と判断した場合には、いつでも本規約を変更することができるものとします。変更後の本規約は、本サービス上に表示した時点より効力を生じるものとします。</p>
          </section>

          <section>
            <h3 className="text-brand-cyan font-semibold mb-3">第12条（準拠法）</h3>
            <p>本規約の解釈にあたっては、日本法を準拠法とします。</p>
          </section>

          <p className="text-right text-white/50 pt-4">以上</p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-brand-cyan text-brand-dark-1 font-semibold rounded-lg hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,217,255,0.3)] transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
