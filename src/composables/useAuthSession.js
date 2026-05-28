import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { warmBootstrapCache } from '@/utils/bootstrapCache'
import { resolvePostAuthDestination } from '@/utils/onboardingSurvey/resolveDestination'
import { HOME_ROUTE } from '@/utils/onboardingSurvey/constants'

/**
 * Post-login/register: load profile and navigate home or personalization survey.
 */
export function useAuthSession() {
  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()

  async function finishAuthenticatedSession() {
    await userStore.getInfo()
    warmBootstrapCache().catch(() => {})
    const dest = await resolvePostAuthDestination()
    const redirect = route.query.redirect
    if (redirect && dest === HOME_ROUTE) {
      await router.replace(redirect)
    } else {
      await router.replace(dest)
    }
  }

  async function signInWithGoogle(idToken) {
    await userStore.loginWithGoogle({ idToken })
    await finishAuthenticatedSession()
  }

  async function signUpWithPassword(payload) {
    await userStore.register(payload)
    await finishAuthenticatedSession()
  }

  return {
    finishAuthenticatedSession,
    signInWithGoogle,
    signUpWithPassword
  }
}
