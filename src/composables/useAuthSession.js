import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { warmBootstrapCache } from '@/utils/bootstrapCache'
import { resolvePostAuthDestination } from '@/utils/onboardingSurvey/resolveDestination'
import { HOME_ROUTE, WELCOME_ROUTE, POST_REGISTER_FLOW_KEY } from '@/utils/onboardingSurvey/constants'

/**
 * Post-login: load profile and navigate home or personalization survey.
 * Post-register: load profile and navigate to welcome screen first.
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

  async function finishRegistrationSession() {
    await userStore.getInfo()
    warmBootstrapCache().catch(() => {})
    sessionStorage.setItem(POST_REGISTER_FLOW_KEY, 'true')
    await router.replace(WELCOME_ROUTE)
  }

  async function signInWithGoogle(idToken) {
    await userStore.loginWithGoogle({ idToken })
    await finishAuthenticatedSession()
  }

  async function signUpWithGoogle(idToken) {
    await userStore.loginWithGoogle({ idToken })
    await finishRegistrationSession()
  }

  async function signUpWithPassword(payload) {
    await userStore.register(payload)
    await finishRegistrationSession()
  }

  return {
    finishAuthenticatedSession,
    finishRegistrationSession,
    signInWithGoogle,
    signUpWithGoogle,
    signUpWithPassword
  }
}
