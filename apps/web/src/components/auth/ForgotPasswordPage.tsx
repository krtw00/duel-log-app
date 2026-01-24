import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase.js';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-brand-dark-1 px-6">
        {/* Background decoration */}
        <div className="absolute inset-0 z-0">
          <div className="grid-pattern animate-grid-scroll" />
          <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-brand-cyan rounded-full blur-[80px] opacity-15 animate-float" />
          <div className="absolute bottom-[15%] right-[15%] w-72 h-72 bg-brand-purple rounded-full blur-[80px] opacity-15 animate-float-delayed" />
        </div>

        {/* Card */}
        <div className="relative z-10 w-full max-w-[450px] mx-5 backdrop-blur-[10px] border border-white/20 rounded-2xl overflow-hidden">
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
            <h1 className="text-2xl font-bold text-white mb-4">{t('auth.resetLinkSent')}</h1>
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
      <div className="relative z-10 w-full max-w-[450px] mx-5 backdrop-blur-[10px] border border-white/20 rounded-2xl overflow-hidden">
        {/* Card glow line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink animate-shimmer" />

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-wider uppercase bg-gradient-to-br from-brand-cyan to-brand-purple bg-clip-text text-transparent">
              FORGOT PASSWORD
            </h1>
            <p className="text-white/60 text-sm tracking-[3px] uppercase mt-2">{t('auth.resetPassword')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-cyan text-brand-dark-1 font-semibold tracking-wider rounded-lg hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,217,255,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
            >
              {loading ? t('auth.processing') : t('auth.sendResetLink')}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-white/50 text-sm hover:text-brand-cyan transition-colors"
            >
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
