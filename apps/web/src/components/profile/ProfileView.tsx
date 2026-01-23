import type { UpdateUser } from '@duel-log/shared';
import { THEME_PREFERENCES, type ThemePreference } from '@duel-log/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../stores/auth.js';

const LANGUAGES = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
] as const;

export function ProfileView() {
  const { t, i18n } = useTranslation();
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
      setMessage(t('profile.saved'));
    } catch {
      setMessage(t('profile.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">{t('profile.title')}</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-500">{t('auth.email')}</p>
          <p className="text-gray-900">{user?.email ?? '-'}</p>
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile.displayName')}
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
            {t('profile.theme')}
          </label>
          <select
            id="themePreference"
            value={themePreference}
            onChange={(e) => setThemePreference(e.target.value as ThemePreference)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {THEME_PREFERENCES.map((th) => (
              <option key={th} value={th}>
                {t(`profile.theme${th.charAt(0).toUpperCase()}${th.slice(1)}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile.language')}
          </label>
          <select
            id="language"
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
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
          <span className="text-sm text-gray-700">{t('profile.streamerMode')}</span>
        </label>

        {message && (
          <p
            className={`text-sm ${message === t('profile.saveFailed') ? 'text-red-600' : 'text-green-600'}`}
          >
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );
}
