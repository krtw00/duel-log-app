import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('Router');
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DashboardView from '../views/DashboardView.vue';
import DecksView from '../views/DecksView.vue';
import StatisticsView from '../views/StatisticsView.vue';
import ProfileView from '../views/ProfileView.vue';
import ForgotPasswordView from '../views/ForgotPasswordView.vue';
import ResetPasswordView from '../views/ResetPasswordView.vue';
import SharedStatisticsView from '../views/SharedStatisticsView.vue';
import OBSOverlayView from '../views/OBSOverlayView.vue';
import AdminView from '../views/AdminView.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresAuth: false },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordView,
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: ResetPasswordView,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/decks',
    name: 'Decks',
    component: DecksView,
    meta: { requiresAuth: true },
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: StatisticsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/shared-stats/:share_id',
    name: 'SharedStatistics',
    component: SharedStatisticsView,
    meta: { requiresAuth: false },
  },
  {
    path: '/obs-overlay',
    name: 'OBSOverlay',
    component: OBSOverlayView,
    meta: { requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * ナビゲーションガード
 *
 * 認証状態を確認し、必要に応じてリダイレクトを実行
 *
 * フロー:
 * 1. アプリケーション初期化時（isInitialized === false）のみ、fetchUser()でサーバーから認証状態を取得
 * 2. ログイン直後はlogin()でローカルにユーザー情報が既に設定されているため、fetchUser()は不要
 * 3. その後のナビゲーションではキャッシュされたuser状態を使用
 * 4. 401エラーはAPIインターセプターで自動的にハンドリングされるため、ここで確認不要
 */
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth !== false;

  logger.debug(`Navigation to: ${String(to.name)}`);

  // アプリケーションの初期化時に一度だけサーバーからユーザー情報を取得する
  // （ページリロード時に認証状態を復元するため）
  if (!authStore.isInitialized) {
    logger.debug('First navigation - fetching user from server');
    await authStore.fetchUser();
  }

  // 認証ロジック
  const isAuthenticated = authStore.isAuthenticated;
  const requiresAdmin = to.meta.requiresAdmin === true;

  if (requiresAuth && !isAuthenticated) {
    // 認証が必要なページにアクセスしようとしたが、認証されていない
    // -> ログインページにリダイレクト
    logger.debug('Auth required but not authenticated - redirecting to login');
    next({ name: 'Login' });
  } else if (requiresAdmin && (!authStore.user || !authStore.user.is_admin)) {
    // 管理者権限が必要なページにアクセスしようとしたが、管理者ではない
    // -> ダッシュボードにリダイレクト
    logger.debug('Admin required but not admin - redirecting to dashboard');
    next({ name: 'Dashboard' });
  } else if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    // ログイン済みユーザーがログインページや登録ページにアクセスしようとした
    // -> ダッシュボードにリダイレクト
    logger.debug('Already authenticated, redirecting from login to dashboard');
    next({ name: 'Dashboard' });
  } else {
    // 上記以外の場合は、要求されたルートへのナビゲーションを許可
    logger.debug('Allowing navigation');
    next();
  }
});

export default router;
