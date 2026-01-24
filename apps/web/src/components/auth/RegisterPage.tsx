import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase.js';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState('');
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError(t('profile.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        // メール確認不要（自動ログイン完了）→ ダッシュボードへ
        navigate({ to: '/' });
      } else {
        // メール確認が必要
        setRequiresConfirmation(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (requiresConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-brand-dark-1 px-6">
        {/* Background decoration */}
        <div className="absolute inset-0 z-0">
          <div className="grid-pattern animate-grid-scroll" />
          <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-brand-cyan rounded-full blur-[80px] opacity-15 animate-float" />
          <div className="absolute bottom-[15%] right-[15%] w-72 h-72 bg-brand-purple rounded-full blur-[80px] opacity-15 animate-float-delayed" />
        </div>

        {/* Card */}
        <div className="relative z-10 w-full max-w-[500px] mx-5 backdrop-blur-[10px] border border-white/20 rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink animate-shimmer" />
          <div className="p-8 text-center">
            <div className="mb-6">
              <svg
                aria-hidden="true"
                className="w-16 h-16 text-brand-cyan mx-auto"
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
            <h1 className="text-2xl font-bold text-white mb-4">
              {t('auth.emailConfirmationSent')}
            </h1>
            <p className="text-white/60 mb-6">{t('auth.emailConfirmationMessage')}</p>
            <Link to="/login" className="text-brand-cyan hover:underline">
              {t('auth.goToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-brand-dark-1 px-6 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="grid-pattern animate-grid-scroll" />
        <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-brand-cyan rounded-full blur-[80px] opacity-15 animate-float" />
        <div className="absolute bottom-[15%] right-[15%] w-72 h-72 bg-brand-purple rounded-full blur-[80px] opacity-15 animate-float-delayed" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[500px] mx-5 backdrop-blur-[10px] border border-white/20 rounded-2xl overflow-hidden">
        {/* Card glow line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink animate-shimmer" />

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black tracking-wider uppercase bg-gradient-to-br from-brand-cyan to-brand-purple bg-clip-text text-transparent">
              DUEL LOG
            </h1>
            <p className="text-white/60 text-sm tracking-[3px] uppercase mt-2">
              {t('auth.register')}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            {/* Display name */}
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('profile.displayName')}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan focus:shadow-[0_0_20px_rgba(0,217,255,0.15)] hover:border-white/30 hover:shadow-[0_0_15px_rgba(0,217,255,0.08)] transition-all"
              />
            </div>

            {/* Email */}
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
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan focus:shadow-[0_0_20px_rgba(0,217,255,0.15)] hover:border-white/30 hover:shadow-[0_0_15px_rgba(0,217,255,0.08)] transition-all"
              />
            </div>

            {/* Password */}
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
                minLength={6}
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan focus:shadow-[0_0_20px_rgba(0,217,255,0.15)] hover:border-white/30 hover:shadow-[0_0_15px_rgba(0,217,255,0.08)] transition-all"
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

            {/* Password confirm */}
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <input
                id="passwordConfirm"
                type={showPasswordConfirm ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder={t('auth.passwordConfirm')}
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan focus:shadow-[0_0_20px_rgba(0,217,255,0.15)] hover:border-white/30 hover:shadow-[0_0_15px_rgba(0,217,255,0.08)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPasswordConfirm ? (
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
              className="w-full py-3 px-4 bg-brand-cyan text-brand-dark-1 font-semibold tracking-wider rounded-lg hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,217,255,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 transition-all mt-4!"
            >
              {loading ? t('auth.registering') : t('auth.register')}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <p className="text-white/50 text-sm">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-brand-purple hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
