import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        setError(error.message);
      } else {
        navigate({ to: '/' });
      }
    };
    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-xl font-bold text-red-600 mb-4">認証エラー</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-gray-600">認証処理中...</p>
    </div>
  );
}
