import { getOnboardingStatus, getOnboardingSurvey } from '@/api/onboarding'
import {
  HOME_ROUTE,
  ONBOARDING_ROUTE,
  SURVEY_GATE_PASSED_KEY,
  SURVEY_ROUTE
} from './constants'
import {
  clearWorkspaceAccountSurveyCache,
  userHasWorkspacesOrAccounts
} from './userActivity'

function isNotFound(err) {
  return err?.response?.status === 404
}

async function resolveSurveyOrFallback(fallbackRoute, { skipWorkspaceCheck = false } = {}) {
  if (!import.meta.env.VITE_APP_TOKEN) {
    console.warn('[onboarding] VITE_APP_TOKEN not set; skipping personalization survey')
    return fallbackRoute
  }

  if (!skipWorkspaceCheck && (await userHasWorkspacesOrAccounts())) {
    return fallbackRoute
  }

  try {
    const statusRes = await getOnboardingStatus()
    if (statusRes?.data?.completed) {
      return fallbackRoute
    }
  } catch (err) {
    if (isNotFound(err)) return fallbackRoute
    console.warn('[onboarding] status check failed', err)
    return fallbackRoute
  }

  try {
    await getOnboardingSurvey()
    return SURVEY_ROUTE
  } catch (err) {
    if (isNotFound(err)) return fallbackRoute
    console.warn('[onboarding] survey load failed', err)
    return fallbackRoute
  }
}

/**
 * Where to send the user after auth when survey gating applies (splash, login).
 */
export async function resolvePostAuthDestination() {
  return resolveSurveyOrFallback(HOME_ROUTE)
}

/**
 * After welcome screen in the post-registration flow.
 */
export async function resolvePostWelcomeDestination() {
  return resolveSurveyOrFallback(ONBOARDING_ROUTE, { skipWorkspaceCheck: true })
}

export function isPostRegisterFlow() {
  return sessionStorage.getItem('au_post_register_flow') === 'true'
}

export function clearPostRegisterFlow() {
  sessionStorage.removeItem('au_post_register_flow')
}

let cachedNeedsSurvey = null

export function hasSurveyGatePassed() {
  return localStorage.getItem(SURVEY_GATE_PASSED_KEY) === 'true'
}

export function markSurveyGatePassed() {
  cachedNeedsSurvey = false
  localStorage.setItem(SURVEY_GATE_PASSED_KEY, 'true')
}

export function clearSurveyGateCache() {
  cachedNeedsSurvey = null
  clearWorkspaceAccountSurveyCache()
  clearPostRegisterFlow()
  try {
    localStorage.removeItem(SURVEY_GATE_PASSED_KEY)
  } catch {
    /* ignore */
  }
}

export async function userNeedsPersonalizationSurvey(force = false) {
  if (!force && (await userHasWorkspacesOrAccounts())) return false
  if (!force && isPostRegisterFlow() && hasSurveyGatePassed()) return false
  if (!force && cachedNeedsSurvey !== null) return cachedNeedsSurvey
  const dest = await resolvePostAuthDestination()
  cachedNeedsSurvey = dest === SURVEY_ROUTE
  return cachedNeedsSurvey
}

export function isSurveyExemptPath(path) {
  return (
    path === '/personalization-survey' ||
    path === '/survey-processing' ||
    path === '/welcome' ||
    path === '/' ||
    path === '/start' ||
    path.startsWith('/onboarding') ||
    path.startsWith('/register') ||
    path === '/login' ||
    path.startsWith('/verify') ||
    path.startsWith('/profile-setup')
  )
}
