import { createRouter, createWebHistory } from '@ionic/vue-router'
import { useUserStore } from '@/store/user'
import { getToken } from '@/utils/auth'

const routes = [
  {
    path: '/',
    name: 'Splash',
    component: () => import('@/views/splash/index.vue'),
    meta: { public: true }
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/onboarding/index.vue'),
    meta: { public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: { public: true }
  },
  {
    path: '/register-email',
    name: 'RegisterEmail',
    component: () => import('@/views/register-email/index.vue'),
    meta: { public: true }
  },
  {
    path: '/verify',
    name: 'Verify',
    component: () => import('@/views/verify/index.vue'),
    meta: { public: true }
  },
  {
    path: '/profile-setup',
    name: 'ProfileSetup',
    component: () => import('@/views/profile-setup/index.vue'),
    meta: { public: true }
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/views/welcome/index.vue'),
    meta: { public: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home/index.vue'),
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    redirect: { name: 'Home' },
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: () => import('@/views/accounts/index.vue'),
  },
  {
    path: '/accounts/:id/flow-log',
    name: 'AccountFlowLog',
    component: () => import('@/views/accounts/FlowLog.vue'),
  },
  {
    path: '/accounting/categories',
    name: 'Categories',
    component: () => import('@/views/categories/index.vue'),
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: () => import('@/views/transactions/index.vue'),
  },
  {
    path: '/transactions/create',
    name: 'TransactionCreate',
    component: () => import('@/views/transactions/TransactionForm.vue'),
  },
  {
    path: '/transactions/:id',
    name: 'TransactionEdit',
    component: () => import('@/views/transactions/TransactionForm.vue'),
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
  },
  {
    path: '/profile/my-profile',
    name: 'ProfileMyProfile',
    component: () => import('@/views/profile/MyProfile.vue'),
  },
  {
    path: '/profile/settings',
    name: 'ProfileSettings',
    component: () => import('@/views/profile/Settings.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  // Always allow splash screen
  if (to.path === '/' && to.name === 'Splash') {
    return next()
  }

  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/home' })
    } else {
      const userStore = useUserStore()
      const hasRoles = userStore.role

      if (hasRoles) {
        next()
      } else {
        try {
          await userStore.getInfo()
          next()
        } catch (error) {
          await userStore.resetState()
          next(`/login?redirect=${encodeURIComponent(to.path)}`)
        }
      }
    }
  } else {
    if (to.path === '/login' || to.meta?.public) {
      next()
    } else {
      next(`/login?redirect=${encodeURIComponent(to.path)}`)
    }
  }
})

export default router
