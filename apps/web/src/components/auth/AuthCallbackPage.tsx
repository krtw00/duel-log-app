import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase.js';

export function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [status, setStatus] = useState(t('auth.processing'));

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for PKCE code in URL params
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          setStatus(t('auth.processing'));
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setError(error.message);
            return;
          }
          navigate({ to: '/' });
          return;
        }

        // Fallback: check for hash-based tokens or existing session
        const { error } = await supabase.auth.getSession();
        if (error) {
          setError(error.message);
          return;
        }

        // Listen for auth state change (OAuth redirect with hash)
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            navigate({ to: '/' });
          }
        });

        // Timeout after 30 seconds
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          // Try one more time to get session
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              navigate({ to: '/' });
            } else {
              setError('Authentication timeout');
            }
          });
        }, 30000);

        return () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    handleCallback();
  }, [navigate, t]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark-1 px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-red-400">
            <svg
              aria-hidden="true"
              className="w-12 h-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-300 mb-2">{t('auth.authError')}</h1>
          <p className="text-white/60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark-1">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60">{status}</p>
      </div>
    </div>
  );
}
