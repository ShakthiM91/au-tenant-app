import { useUserStore } from '@/store/user'

export function hasPermission(permissionCode) {
  const userStore = useUserStore()
  const permissions = userStore.permissions || []
  return permissions.includes(permissionCode)
}

export function hasRole(roleCode) {
  const userStore = useUserStore()
  return userStore.role === roleCode
}

export function hasAnyPermission(permissionCodes) {
  if (!Array.isArray(permissionCodes)) return false
  return permissionCodes.some((code) => hasPermission(code))
}

export function hasAllPermissions(permissionCodes) {
  if (!Array.isArray(permissionCodes)) return false
  return permissionCodes.every((code) => hasPermission(code))
}
