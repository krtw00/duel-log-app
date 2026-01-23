import type { UpdateUser } from '@duel-log/shared';
import { THEME_PREFERENCES, type ThemePreference } from '@duel-log/shared';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../stores/auth.js';

const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'ライト',
  dark: 'ダーク',
  system: 'システム',
};

export function ProfileView() {
  const { user } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [streamerMode, setStreamerMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await api<{
          data: { displayName: string; themePreference: ThemePreference; streamerMode: boolean };
        }>('/me');
        setDisplayName(result.data.displayName);
        setThemePreference(result.data.themePreference);
        setStreamerMode(result.data.streamerMode);
      } catch {
        // ignore
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const data: UpdateUser = { displayName, themePreference, streamerMode };
      await api('/me', { method: 'PATCH', body: data });
      setMessage('保存しました');
    } catch {
      setMessage('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">プロフィール設定</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-500">メールアドレス</p>
          <p className="text-gray-900">{user?.email ?? '-'}</p>
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            表示名
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="themePreference" className="block text-sm font-medium text-gray-700 mb-1">
            テーマ
          </label>
          <select
            id="themePreference"
            value={themePreference}
            onChange={(e) => setThemePreference(e.target.value as ThemePreference)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {THEME_PREFERENCES.map((t) => (
              <option key={t} value={t}>
                {THEME_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={streamerMode}
            onChange={(e) => setStreamerMode(e.target.checked)}
          />
          <span className="text-sm text-gray-700">配信者モード</span>
        </label>

        {message && (
          <p className={`text-sm ${message.includes('失敗') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </div>
  );
}
