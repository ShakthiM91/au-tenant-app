/**
 * Flatten a category tree (nodes may have `children`).
 * @param {Array} nodes
 * @param {Array} [out]
 * @returns {Array}
 */
export function flattenCategoryTree(nodes, out = []) {
  for (const node of nodes || []) {
    out.push(node)
    if (node.children?.length) flattenCategoryTree(node.children, out)
  }
  return out
}

/** Same root resolution as accounting-service categoryReportHelper.buildCategoryRootMap */
export function buildCategoryRootMap(categories) {
  const byId = new Map((categories || []).map((c) => [Number(c.id), c]))
  const rootMap = new Map()

  function getRootId(catId) {
    if (rootMap.has(catId)) return rootMap.get(catId)
    const cat = byId.get(catId)
    if (!cat || cat.parent_id == null) {
      rootMap.set(catId, catId)
      return catId
    }
    const rootId = getRootId(Number(cat.parent_id))
    rootMap.set(catId, rootId)
    return rootId
  }

  for (const c of categories || []) {
    getRootId(Number(c.id))
  }
  return rootMap
}

/**
 * All category ids that roll up to a parent row in expense-by-category (parent level).
 * @param {number} rootId
 * @param {Array<{ id: number, parent_id?: number|null }>} categories
 * @returns {number[]}
 */
export function categoryIdsUnderReportRoot(rootId, categories) {
  const root = Number(rootId)
  if (!root || Number.isNaN(root)) return []
  const rootMap = buildCategoryRootMap(categories)
  const ids = new Set()
  for (const c of categories || []) {
    const cid = Number(c.id)
    if (rootMap.get(cid) === root || cid === root) ids.add(cid)
  }
  return [...ids]
}

/**
 * Expand a tree node to itself and all descendants (uses nested `children`).
 * @param {number} categoryId
 * @param {Array} treeNodes
 * @returns {number[]}
 */
export function expandedCategoryIdsFromTree(categoryId, treeNodes) {
  const target = Number(categoryId)
  if (!target || Number.isNaN(target)) return []

  let found = null
  function walk(nodes) {
    for (const n of nodes || []) {
      if (Number(n.id) === target) {
        found = n
        return true
      }
      if (n.children?.length && walk(n.children)) return true
    }
    return false
  }
  walk(treeNodes)
  if (!found) return [target]

  const ids = new Set()
  const stack = [found]
  while (stack.length) {
    const n = stack.pop()
    ids.add(Number(n.id))
    for (const child of n.children || []) stack.push(child)
  }
  return [...ids]
}

/**
 * Resolve category_ids for API filter. Prefer root-map (matches report aggregation).
 */
export function categoryIdsForDrillDown({ categoryId, level, flatCategories }) {
  const id = Number(categoryId)
  if (!id || Number.isNaN(id)) return null
  if (level === 'parent') {
    return categoryIdsUnderReportRoot(id, flatCategories)
  }
  return [id]
}

/** All category ids in a subtree (category + descendants). */
export function descendantCategoryIds(categoryId, flatCategories) {
  const target = Number(categoryId)
  if (!target || Number.isNaN(target)) return []
  const childrenByParent = new Map()
  for (const c of flatCategories || []) {
    const id = Number(c.id)
    const pid =
      c.parent_id != null && c.parent_id !== '' ? Number(c.parent_id) : null
    if (!childrenByParent.has(pid)) childrenByParent.set(pid, [])
    childrenByParent.get(pid).push(id)
  }
  const ids = new Set([target])
  const stack = [target]
  while (stack.length) {
    const cur = stack.pop()
    for (const child of childrenByParent.get(cur) || []) {
      if (!ids.has(child)) {
        ids.add(child)
        stack.push(child)
      }
    }
  }
  return [...ids]
}

/** Budget report drill-down: parent row rolls up to root; sub-rows include descendants. */
export function categoryIdsForBudgetDrillDown({ categoryId, level, flatCategories }) {
  const id = Number(categoryId)
  if (!id || Number.isNaN(id)) return null
  if (level === 'parent') {
    return categoryIdsUnderReportRoot(id, flatCategories)
  }
  const desc = descendantCategoryIds(id, flatCategories)
  return desc.length ? desc : [id]
}

export function transactionMatchesBudgetCategoryDrillDown(
  row,
  { categoryId, level, categories, categoryName }
) {
  const target = Number(categoryId)
  const ids = categoryIdsForBudgetDrillDown({
    categoryId: target,
    level,
    flatCategories: categories
  })
  if (!target) {
    return transactionMatchesCategoryDrillDown(row, {
      categoryId: 0,
      level: 'leaf',
      categories: [],
      categoryName
    })
  }
  const cid = row.category_id != null ? Number(row.category_id) : 0
  if (ids?.length && ids.includes(cid)) return true
  return transactionMatchesCategoryDrillDown(row, {
    categoryId: target,
    level: 'leaf',
    categories,
    categoryName
  })
}

/**
 * Client-side match for drill-down (mirrors report parent/leaf semantics).
 */
export function transactionMatchesCategoryDrillDown(
  row,
  { categoryId, level, categories, categoryName }
) {
  const target = Number(categoryId)
  const cid = row.category_id != null ? Number(row.category_id) : 0

  if (!target) {
    if (row.category_id == null || cid === 0) return true
    const label = String(categoryName || '').trim().toLowerCase()
    if (!label || label === 'uncategorized') return false
    const rowLabel = String(row.category_name || row.category || '')
      .trim()
      .toLowerCase()
    return rowLabel === label
  }
  if (level === 'leaf') {
    if (cid === target) return true
    const label = String(categoryName || '').trim().toLowerCase()
    if (label) {
      const rowLabel = String(row.category_name || row.category || '')
        .trim()
        .toLowerCase()
      if (rowLabel === label) return true
    }
    return false
  }
  if (cid === 0) return false
  if (cid === target) return true
  const rootMap = buildCategoryRootMap(categories)
  return (rootMap.get(cid) ?? cid) === target
}

export function isCompletedTransaction(row) {
  const s = row?.status
  return s == null || s === '' || s === 'completed'
}
