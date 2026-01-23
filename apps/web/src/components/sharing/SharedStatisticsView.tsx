import type { OverviewStats } from '@duel-log/shared';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { api } from '../../lib/api.js';
import { StatsDisplayCards } from '../dashboard/StatsDisplayCards.js';

type SharedStatsResponse = {
  data: {
    overview: OverviewStats;
    displayName: string;
    filters: Record<string, unknown>;
  };
};

export function SharedStatisticsView() {
  const { token } = useParams({ strict: false }) as { token: string };

  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-statistics', token],
    queryFn: () => api<SharedStatsResponse>(`/shared-statistics/${token}`),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['s1', 's2', 's3', 's4'].map((id) => (
              <div key={id} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-xl font-bold text-red-600 mb-2">エラー</h1>
        <p className="text-gray-600">この共有リンクは無効か、期限切れです。</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{data?.data.displayName}の統計</h1>
        <p className="text-sm text-gray-500 mt-1">共有された統計情報</p>
      </div>
      <StatsDisplayCards stats={data?.data.overview} loading={false} />
    </div>
  );
}
