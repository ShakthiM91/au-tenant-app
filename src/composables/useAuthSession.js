import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { warmBootstrapCache } from '@/utils/bootstrapCache'

/**
 * Post-login/register: load profile and navigate home (or redirect query).
 */
export function useAuthSession() {
  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()

  async function finishAuthenticatedSession() {
    await userStore.getInfo()
    warmBootstrapCache().catch(() => {})
    const redirect = route.query.redirect || '/home'
    await router.replace(redirect)
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
