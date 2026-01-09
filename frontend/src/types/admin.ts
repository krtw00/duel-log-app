export interface UserAdminResponse {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  createdat: string; // ISO 8601 date string
}

export interface UsersListResponse {
  users: UserAdminResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface UpdateAdminStatusRequest {
  is_admin: boolean;
}

export interface UpdateAdminStatusResponse {
  success: boolean;
  user: UserAdminResponse;
}
