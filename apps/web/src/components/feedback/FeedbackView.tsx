import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';

type FeedbackTab = 'bug' | 'feature' | 'contact';

export function FeedbackView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FeedbackTab>('bug');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [useCase, setUseCase] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setBody('');
    setSteps('');
    setExpected('');
    setActual('');
    setUseCase('');
    setSent(false);
    setIssueUrl(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const result = await api<{ data: { issueUrl?: string } }>('/feedback', {
        method: 'POST',
        body: { category: activeTab, title, body, steps, expected, actual, useCase },
      });
      setIssueUrl(result.data?.issueUrl ?? null);
      setSent(true);
    } catch {
      setError(t('feedback.submitFailed'));
    } finally {
      setSending(false);
    }
  };

  const tabs: { key: FeedbackTab; icon: React.ReactNode; color: string }[] = [
    {
      key: 'bug',
      color: 'var(--color-error)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 0 1 6 0v1" />
          <path d="M12 20c-3.3 0-6-2.7-6-6v-3a6 6 0 0 1 12 0v3c0 3.3-2.7 6-6 6z" />
          <path d="M6 11H2M22 11h-4M6 15H2M22 15h-4M10 22v-2M14 22v-2" />
        </svg>
      ),
    },
    {
      key: 'feature',
      color: 'var(--color-success)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
        </svg>
      ),
    },
    {
      key: 'contact',
      color: 'var(--color-primary)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-on-bg)' }}>
        {t('feedback.title')}
      </h1>

      {/* Intro Card */}
      <div className="glass-card p-4">
        <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
          {t('feedback.intro')}
        </p>
      </div>

      {/* Tab Card */}
      <div className="glass-card overflow-hidden">
        {/* Tabs */}
        <div className="tab-bar" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.key); resetForm(); }}
              style={activeTab === tab.key ? { color: tab.color } : undefined}
            >
              {tab.icon}
              {t(`feedback.category${tab.key.charAt(0).toUpperCase()}${tab.key.slice(1)}`)}
            </button>
          ))}
        </div>

        <div className="p-4">
          {sent ? (
            <div className="dialog-overlay" onClick={resetForm} onKeyDown={(e) => e.key === 'Escape' && resetForm()} role="button" tabIndex={0} aria-label="Close dialog">
              <div className="dialog-content" onClick={(e) => e.stopPropagation()} onKeyDown={() => {}} role="dialog" tabIndex={-1}>
                <div className="dialog-header">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
                    {t('feedback.success')}
                  </h2>
                  <button type="button" onClick={resetForm} className="themed-btn themed-btn-ghost p-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="dialog-body text-center py-6 space-y-4">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" className="mx-auto">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p className="font-medium" style={{ color: 'var(--color-success)' }}>
                    {t('feedback.submitted')}
                  </p>
                  {issueUrl && (
                    <a
                      href={issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="themed-btn themed-btn-outlined text-sm inline-flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      {t('feedback.viewIssue')}
                    </a>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="themed-btn themed-btn-ghost text-sm"
                    >
                      {t('feedback.sendAnother')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(255,61,113,0.1)', color: 'var(--color-error)' }}>
                  {error}
                </div>
              )}

              {/* Title (bug + feature) */}
              {(activeTab === 'bug' || activeTab === 'feature') && (
                <div>
                  <label htmlFor="fbTitle" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {t('feedback.feedbackTitle')}
                  </label>
                  <input
                    id="fbTitle"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="themed-input"
                  />
                </div>
              )}

              {/* Subject (contact) */}
              {activeTab === 'contact' && (
                <div>
                  <label htmlFor="fbSubject" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {t('feedback.subject')}
                  </label>
                  <input
                    id="fbSubject"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="themed-input"
                  />
                </div>
              )}

              {/* Description / Message */}
              <div>
                <label htmlFor="fbBody" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {activeTab === 'contact' ? t('feedback.message') : t('feedback.body')}
                </label>
                <textarea
                  id="fbBody"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={activeTab === 'contact' ? 6 : 4}
                  className="themed-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Bug-specific fields */}
              {activeTab === 'bug' && (
                <>
                  <div>
                    <label htmlFor="fbSteps" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                      {t('feedback.reproSteps')}
                    </label>
                    <textarea
                      id="fbSteps"
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                      rows={3}
                      className="themed-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="fbExpected" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                        {t('feedback.expected')}
                      </label>
                      <textarea
                        id="fbExpected"
                        value={expected}
                        onChange={(e) => setExpected(e.target.value)}
                        rows={2}
                        className="themed-input"
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="fbActual" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                        {t('feedback.actual')}
                      </label>
                      <textarea
                        id="fbActual"
                        value={actual}
                        onChange={(e) => setActual(e.target.value)}
                        rows={2}
                        className="themed-input"
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Feature-specific fields */}
              {activeTab === 'feature' && (
                <div>
                  <label htmlFor="fbUseCase" className="block text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {t('feedback.useCase')}
                  </label>
                  <textarea
                    id="fbUseCase"
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    rows={3}
                    className="themed-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="themed-btn themed-btn-primary w-full"
              >
                {sending ? t('feedback.submitting') : t('feedback.submit')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Contact Card */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
            {t('feedback.contactInfo')}
          </h3>
        </div>
        <div className="space-y-2 text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
          <a
            href="https://x.com/XrIGT"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @XrIGT
          </a>
          <a
            href="https://github.com/IGT-DEVELOPER/duel-log"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
