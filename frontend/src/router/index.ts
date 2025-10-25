import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
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

// ナビゲーションガード
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth !== false;

  // アプリケーションの初期化時に一度だけユーザー情報を取得する
  if (!authStore.isInitialized) {
    await authStore.fetchUser();
  }

  // 認証ロジック
  const isAuthenticated = authStore.isAuthenticated;

  if (requiresAuth && !isAuthenticated) {
    // 認証が必要なページにアクセスしようとしたが、認証されていない
    // -> ログインページにリダイレクト
    next({ name: 'Login' });
  } else if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    // ログイン済みユーザーがログインページや登録ページにアクセスしようとした
    // -> ダッシュボードにリダイレクト
    next({ name: 'Dashboard' });
  } else {
    // 上記以外の場合は、要求されたルートへのナビゲーションを許可
    next();
  }
});

export default router;
