import { createRouter, createWebHistory } from '@ionic/vue-router'
import { useUserStore } from '@/store/user'
import { getToken } from '@/utils/auth'
import {
  userNeedsPersonalizationSurvey,
  isSurveyExemptPath
} from '@/utils/onboardingSurvey/resolveDestination'
import { SURVEY_ROUTE } from '@/utils/onboardingSurvey/constants'

const routes = [
  {
    path: '/',
    name: 'Splash',
    component: () => import('@/views/splash/index.vue'),
    meta: { public: true }
  },
  {
    path: '/invite/:code',
    name: 'InviteLanding',
    component: () => import('@/views/invite/index.vue'),
    meta: { public: true }
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/onboarding/index.vue'),
    meta: { public: true }
  },
  {
    path: '/start',
    name: 'WelcomeMain',
    component: () => import('@/views/welcome-main/index.vue'),
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
    path: '/personalization-survey',
    name: 'PersonalizationSurvey',
    component: () => import('@/views/personalization-survey/index.vue'),
  },
  {
    path: '/survey-processing',
    name: 'SurveyProcessing',
    component: () => import('@/views/survey-processing/index.vue'),
    meta: { public: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true }
  },
  {
    path: '/legal/terms',
    name: 'LegalTerms',
    component: () => import('@/views/legal/LegalContentPage.vue'),
    meta: {
      public: true,
      hideTabBar: true,
      contentKey: 'miscellaneous.termsOfService',
      title: 'Terms of Service',
    },
  },
  {
    path: '/legal/privacy',
    name: 'LegalPrivacy',
    component: () => import('@/views/legal/LegalContentPage.vue'),
    meta: {
      public: true,
      hideTabBar: true,
      contentKey: 'miscellaneous.privacyPolicy',
      title: 'Privacy Policy',
    },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home/index.vue'),
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/views/analytics/index.vue'),
  },
  {
    path: '/analytics/day/:date',
    name: 'AnalyticsDay',
    component: () => import('@/views/analytics/AnalyticsDayDetail.vue'),
    meta: { hideTabBar: true },
  },
  {
    path: '/analytics/month/:ym',
    name: 'AnalyticsMonth',
    component: () => import('@/views/analytics/AnalyticsMonthDetail.vue'),
    meta: { hideTabBar: true },
  },
  {
    path: '/analytics/expense-by-category/:categoryId',
    name: 'AnalyticsExpenseByCategoryDetail',
    component: () => import('@/views/analytics/ExpenseByCategoryDetail.vue'),
    meta: { hideTabBar: true },
  },
  {
    path: '/analytics/income-by-category/:categoryId',
    name: 'AnalyticsIncomeByCategoryDetail',
    component: () => import('@/views/analytics/ExpenseByCategoryDetail.vue'),
    meta: { hideTabBar: true },
  },
  {
    path: '/analytics/pattern-transactions',
    name: 'AnalyticsPatternTransactions',
    component: () => import('@/views/analytics/ReportPatternTransactionsDetail.vue'),
    meta: { hideTabBar: true },
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
    path: '/budgets/manage',
    name: 'BudgetManagement',
    component: () => import('@/views/budgets/BudgetManagement.vue'),
  },
  {
    path: '/budgets/plan',
    name: 'BudgetPlan',
    component: () => import('@/views/budgets/BudgetPlannedAmounts.vue'),
  },
  {
    path: '/budgets/:id',
    name: 'BudgetOverview',
    component: () => import('@/views/budgets/BudgetOverview.vue'),
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
  {
    path: '/profile/referrals',
    name: 'ProfileReferrals',
    component: () => import('@/views/profile/Referrals.vue'),
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
    if (to.path === '/login' || to.path === '/start') {
      next({ path: '/home' })
      return
    }

    const userStore = useUserStore()
    const hasRoles = userStore.role

    try {
      if (!hasRoles) {
        await userStore.getInfo()
      }
      const needsSurvey = await userNeedsPersonalizationSurvey()
      if (needsSurvey && !isSurveyExemptPath(to.path)) {
        next(SURVEY_ROUTE)
        return
      }
      next()
    } catch (error) {
      await userStore.clearSession()
      next('/start')
    }
  } else {
    if (to.path === '/login' || to.meta?.public) {
      next()
    } else {
      next('/start')
    }
  }
})

export default router
