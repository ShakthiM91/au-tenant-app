import { getOnboardingStatus, getOnboardingSurvey } from '@/api/onboarding'
import { HOME_ROUTE, SURVEY_ROUTE } from './constants'

function isNotFound(err) {
  return err?.response?.status === 404
}

/**
 * Where to send the user after auth when survey gating applies.
 */
export async function resolvePostAuthDestination() {
  if (!import.meta.env.VITE_APP_TOKEN) {
    console.warn('[onboarding] VITE_APP_TOKEN not set; skipping personalization survey')
    return HOME_ROUTE
  }

  try {
    const statusRes = await getOnboardingStatus()
    if (statusRes?.data?.completed) {
      return HOME_ROUTE
    }
  } catch (err) {
    if (isNotFound(err)) return HOME_ROUTE
    console.warn('[onboarding] status check failed', err)
    return HOME_ROUTE
  }

  try {
    await getOnboardingSurvey()
    return SURVEY_ROUTE
  } catch (err) {
    if (isNotFound(err)) return HOME_ROUTE
    console.warn('[onboarding] survey load failed', err)
    return HOME_ROUTE
  }
}

let cachedNeedsSurvey = null

export function clearSurveyGateCache() {
  cachedNeedsSurvey = null
}

export async function userNeedsPersonalizationSurvey(force = false) {
  if (!force && cachedNeedsSurvey !== null) return cachedNeedsSurvey
  const dest = await resolvePostAuthDestination()
  cachedNeedsSurvey = dest === SURVEY_ROUTE
  return cachedNeedsSurvey
}

export function isSurveyExemptPath(path) {
  return (
    path === '/personalization-survey' ||
    path === '/welcome' ||
    path === '/' ||
    path.startsWith('/onboarding') ||
    path.startsWith('/register') ||
    path === '/login' ||
    path.startsWith('/verify') ||
    path.startsWith('/profile-setup')
  )
}
