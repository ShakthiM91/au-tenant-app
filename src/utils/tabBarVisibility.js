const TAB_ROOT_PREFIXES = [
  '/home',
  '/dashboard',
  '/accounts',
  '/analytics',
  '/transactions',
  '/accounting',
  '/profile',
  '/budgets',
]

export function shouldShowTabBar(route) {
  if (route.meta?.public) return false
  if (route.meta?.hideTabBar === true) return false
  if (route.meta?.showTabBar === true) return true
  return TAB_ROOT_PREFIXES.some((prefix) => route.path.startsWith(prefix))
}
