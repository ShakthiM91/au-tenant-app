/**
 * Maps tenant-admin menu routes to mobile app routes.
 * Only routes with mobile equivalents are included.
 */
export const ROUTE_MAP = {
  '/dashboard': '/dashboard',
  '/members/list': '/members',
  '/members/roles': '/members/roles',
  '/accounting/transactions': '/transactions',
  '/accounting/accounts': '/accounts',
  '/accounting/reports': '/reports',
  '/accounting/reports/income-expense': '/reports/income-expense',
  '/accounting/reports/daily-trends': '/reports/daily-trends',
  '/accounting/reports/balance-growth': '/reports/balance-growth',
  '/accounting/reports/income-by-category': '/reports/income-by-category',
  '/accounting/reports/expense-by-category': '/reports/expense-by-category',
  '/accounting/categories': '/accounting/categories',
  '/accounting/budgets': '/budgets',
  '/assets/list': '/assets',
  '/assets/categories': '/assets/categories',
  '/assets/history': '/assets',
  '/schedule/calendar': '/schedule',
  '/schedule/events': '/schedule/events',
  '/settings/system': '/settings',
  '/settings/profile': '/profile',
  '/settings/currencies': '/settings',
  '/settings/tenant': '/settings',
  '/work/dashboard': '/work',
  '/work/projects': '/work/projects',
  '/work/vendors': '/work/vendors',
  '/work/categories': '/work/categories'
}

/**
 * Given a menu node (from API), return the mobile path or null if no mapping.
 */
export function mapMenuToMobileRoute(menu) {
  if (!menu) return null
  const route = (menu.route || '').trim()
  if (!route) return null
  const normalized = route.startsWith('/') ? route : `/${route}`
  return ROUTE_MAP[normalized] ?? null
}

/**
 * Flatten and filter menu tree to only items with mobile routes.
 * Collapses parent+child to single link when child maps to same path as parent.
 * Returns array of { path, name, icon } for menu items.
 */
export function filterAndMapMenus(menuTree) {
  if (!menuTree || !Array.isArray(menuTree)) return []
  const seen = new Set()
  const items = []

  function walk(menus) {
    for (const menu of menus || []) {
      const path = mapMenuToMobileRoute(menu)
      if (path && !seen.has(path)) {
        seen.add(path)
        items.push({
          path,
          name: menu.name || menu.code || path,
          icon: menu.icon
        })
      }
      if (menu.children?.length) walk(menu.children)
    }
  }

  walk(menuTree)
  return items
}

/**
 * Filter and map menu tree preserving hierarchy.
 * Returns tree of { path, name, icon, children } for hierarchical menu display.
 * - Leaf items (no children with mappings): { path, name, icon, children: [] }
 * - Parent items: { path, name, icon, children: [...] }
 * - Skips routes with no mobile mapping (e.g. /currency/*, /schedule/reminders)
 */
export function filterAndMapMenuTree(menuTree) {
  if (!menuTree || !Array.isArray(menuTree)) return []

  function process(menus) {
    const result = []
    for (const menu of menus || []) {
      const path = mapMenuToMobileRoute(menu)
      const childMenus = menu.children || []
      const mappedChildren = process(childMenus)

      // Include if has mobile path or has children with mappings
      if (path || mappedChildren.length > 0) {
        const item = {
          path: path || null,
          name: menu.name || menu.code || '',
          icon: menu.icon,
          children: mappedChildren
        }
        result.push(item)
      }
    }
    return result
  }

  return process(menuTree)
}
