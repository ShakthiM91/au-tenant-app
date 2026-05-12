export function normalizeCategoryTreeResponse(res) {
  const data = res?.data ?? (res?.success ? res?.data : []) ?? []
  return Array.isArray(data) ? data : []
}

export function filterActiveCategoriesForMenu(categories) {
  return (categories || [])
    .filter((cat) => cat.is_active !== false)
    .map((cat) => ({
      ...cat,
      children: cat.children?.length ? filterActiveCategoriesForMenu(cat.children) : [],
    }))
}

export function flattenCategoryLabels(arr, prefix = '') {
  const out = []
  for (const c of arr || []) {
    const label = prefix ? `${prefix} > ${c.name}` : c.name
    out.push({ id: Number(c.id), label })
    if (c.children?.length) out.push(...flattenCategoryLabels(c.children, label))
  }
  return out
}

/** Filter hierarchy by name (keeps parent when any child matches). */
export function filterCategoryNodesBySearch(nodes, q) {
  const needle = String(q ?? '').trim().toLowerCase()
  if (!needle) return nodes || []
  const walk = (arr) => {
    const out = []
    for (const n of arr || []) {
      const name = String(n?.name ?? '')
      const nameMatch = name.toLowerCase().includes(needle)
      const kids = n.children?.length ? walk(n.children) : []
      if (nameMatch) {
        out.push({ ...n, children: n.children || [] })
      } else if (kids.length) {
        out.push({ ...n, children: kids })
      }
    }
    return out
  }
  return walk(nodes || [])
}

export function buildCategoryNodeMapFromTrees(incomeTree, expenseTree) {
  const m = new Map()
  function walk(nodes) {
    for (const n of nodes || []) {
      m.set(Number(n.id), n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(incomeTree)
  walk(expenseTree)
  return m
}

/** Expand selected nodes to all descendant category ids (for `category_ids`-style APIs). */
export function expandedCategoryIdsForQuery(selectedIds, nodeByIdMap) {
  const out = new Set()
  for (const sid of selectedIds || []) {
    const node = nodeByIdMap.get(Number(sid))
    if (node) {
      const stack = [node]
      while (stack.length) {
        const n = stack.pop()
        out.add(Number(n.id))
        const kids = n.children || []
        for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i])
      }
    } else {
      out.add(Number(sid))
    }
  }
  return [...out].sort((a, b) => a - b)
}
