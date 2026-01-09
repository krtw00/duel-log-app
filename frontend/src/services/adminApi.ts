import { api } from './api';
import type { UsersListResponse, UpdateAdminStatusResponse, UpdateAdminStatusRequest } from '../types/admin';

export const getAdminUsers = async (
  page: number,
  perPage: number,
  sort: string,
  order: string,
  search?: string,
  adminOnly?: boolean
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
  isAdmin: boolean
): Promise<UpdateAdminStatusResponse> => {
  const response = await api.put<UpdateAdminStatusResponse>(
    `/admin/users/${userId}/admin-status`,
    { is_admin: isAdmin } as UpdateAdminStatusRequest
  );
  return response.data;
};
