import { api } from './api';
import type {
  UsersListResponse,
  UpdateAdminStatusResponse,
  UpdateAdminStatusRequest,
  StatisticsOverviewResponse,
  DuelsTimelineResponse,
  UserRegistrationsResponse,
  OrphanedDataScanResponse,
  OrphanedDataCleanupResponse,
  OrphanedSharedUrlsScanResponse,
  OrphanedSharedUrlsCleanupResponse,
  ExpiredSharedUrlsScanResponse,
  ExpiredSharedUrlsCleanupResponse,
} from '../types/admin';

export const getAdminUsers = async (
  page: number,
  perPage: number,
  sort: string,
  order: string,
  search?: string,
  adminOnly?: boolean,
): Promise<UsersListResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    sort,
    order,
  });
  if (search) {
    params.append('search', search);
  }
  if (adminOnly !== undefined) {
    params.append('admin_only', String(adminOnly));
  }
  const response = await api.get<UsersListResponse>(`/admin/users?${params.toString()}`);
  return response.data;
};

export const updateUserAdminStatus = async (
  userId: number,
  isAdmin: boolean,
): Promise<UpdateAdminStatusResponse> => {
  const response = await api.put<UpdateAdminStatusResponse>(`/admin/users/${userId}/admin-status`, {
    is_admin: isAdmin,
  } as UpdateAdminStatusRequest);
  return response.data;
};

// ========================================
// システム統計
// ========================================

export const getStatisticsOverview = async (): Promise<StatisticsOverviewResponse> => {
  const response = await api.get<StatisticsOverviewResponse>('/admin/statistics/overview');
  return response.data;
};

export const getDuelsTimeline = async (
  period: 'daily' | 'monthly' = 'daily',
  days: number = 30,
): Promise<DuelsTimelineResponse> => {
  const params = new URLSearchParams({
    period,
    days: String(days),
  });
  const response = await api.get<DuelsTimelineResponse>(
    `/admin/statistics/duels-timeline?${params.toString()}`,
  );
  return response.data;
};

export const getUserRegistrations = async (
  months: number = 12,
): Promise<UserRegistrationsResponse> => {
  const params = new URLSearchParams({
    months: String(months),
  });
  const response = await api.get<UserRegistrationsResponse>(
    `/admin/statistics/user-registrations?${params.toString()}`,
  );
  return response.data;
};

// ========================================
// メンテナンス
// ========================================

export const scanOrphanedData = async (): Promise<OrphanedDataScanResponse> => {
  const response = await api.post<OrphanedDataScanResponse>('/admin/maintenance/scan-orphaned-data');
  return response.data;
};

export const cleanupOrphanedData = async (): Promise<OrphanedDataCleanupResponse> => {
  const response = await api.post<OrphanedDataCleanupResponse>(
    '/admin/maintenance/cleanup-orphaned-data',
  );
  return response.data;
};

export const scanOrphanedSharedUrls = async (): Promise<OrphanedSharedUrlsScanResponse> => {
  const response = await api.post<OrphanedSharedUrlsScanResponse>(
    '/admin/maintenance/scan-orphaned-shared-urls',
  );
  return response.data;
};

export const cleanupOrphanedSharedUrls = async (): Promise<OrphanedSharedUrlsCleanupResponse> => {
  const response = await api.post<OrphanedSharedUrlsCleanupResponse>(
    '/admin/maintenance/cleanup-orphaned-shared-urls',
  );
  return response.data;
};

export const scanExpiredSharedUrls = async (): Promise<ExpiredSharedUrlsScanResponse> => {
  const response = await api.post<ExpiredSharedUrlsScanResponse>(
    '/admin/maintenance/scan-expired-shared-urls',
  );
  return response.data;
};

export const cleanupExpiredSharedUrls = async (): Promise<ExpiredSharedUrlsCleanupResponse> => {
  const response = await api.post<ExpiredSharedUrlsCleanupResponse>(
    '/admin/maintenance/cleanup-expired-shared-urls',
  );
  return response.data;
};
