import { useState } from 'react';
import { api } from '../../lib/api.js';

export function FeedbackView() {
  const [category, setCategory] = useState('bug');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api('/feedback', {
        method: 'POST',
        body: { category, title, body },
      });
      setSent(true);
    } catch {
      setError('送信に失敗しました。もう一度お試しください。');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md space-y-6">
        <h1 className="text-2xl font-bold">フィードバック</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-green-600 font-medium mb-2">送信しました！</p>
          <p className="text-gray-600 text-sm">フィードバックをありがとうございます。</p>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setTitle('');
              setBody('');
            }}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            新しいフィードバックを送る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">フィードバック</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリ
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="bug">バグ報告</option>
            <option value="feature">機能要望</option>
            <option value="question">質問</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div>
          <label htmlFor="feedbackTitle" className="block text-sm font-medium text-gray-700 mb-1">
            タイトル
          </label>
          <input
            id="feedbackTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="簡潔に内容を記述"
          />
        </div>

        <div>
          <label htmlFor="feedbackBody" className="block text-sm font-medium text-gray-700 mb-1">
            内容
          </label>
          <textarea
            id="feedbackBody"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="詳細を記述してください"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? '送信中...' : 'フィードバックを送信'}
        </button>
      </form>
    </div>
  );
}
