import { defineStore } from 'pinia'
import { login, register, logout, getInfo, updateProfile } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { clearAllClientStorage } from '@/utils/clearDeviceStorage'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    id: null,
    name: '',
    username: '',
    email: '',
    role: '',
    status: '',
    tenantId: null,
    phone: null,
    birthday: '',
    gender: '',
    permissions: [],
    menus: []
  }),

  actions: {
    async login(userInfo) {
      try {
        const { email, password } = userInfo
        const response = await login({ email, password })

        if (response && response.accessToken) {
          this.token = response.accessToken
          setToken(response.accessToken)
          return response
        } else {
          throw new Error('Invalid login response')
        }
      } catch (error) {
        removeToken()
        throw error
      }
    },

    async register(userInfo) {
      try {
        const { name, email, password } = userInfo
        const response = await register({ name, email, password })

        if (response && response.accessToken) {
          this.token = response.accessToken
          setToken(response.accessToken)
          return response
        } else {
          throw new Error('Invalid registration response')
        }
      } catch (error) {
        removeToken()
        throw error
      }
    },

    async getInfo() {
      try {
        const response = await getInfo()

        if (!response || !response.user) {
          throw new Error('Verification failed, please login again.')
        }

        const { user, permissions, menus } = response

        if (user.role !== 'tenant_admin' && user.role !== 'member') {
          throw new Error('Access denied. Tenant admin or member role required.')
        }

        this.id = user.id ?? null
        this.name = user.name || user.email
        this.username =
          user.username == null || user.username === ''
            ? ''
            : String(user.username)
        this.email = user.email
        this.role = user.role
        this.status = user.status || ''
        this.tenantId = user.tenantId || null
        this.phone = user.phone ?? null
        this.birthday = user.birthday || ''
        this.gender = user.gender || ''
        this.permissions = permissions || []
        this.menus = menus || []

        return response
      } catch (error) {
        this.resetState()
        throw error
      }
    },

    async logout() {
      try {
        await logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.resetState()
        try {
          await clearAllClientStorage()
        } catch (e) {
          console.warn('clearAllClientStorage failed', e)
        }
      }
    },

    async updateUserProfile(data) {
      try {
        const response = await updateProfile(data)
        if (!response?.user) {
          throw new Error('Invalid profile response')
        }
        const u = response.user
        this.name = u.name ?? this.name
        this.email = u.email ?? this.email
        if (u.username !== undefined) {
          this.username =
            u.username == null || u.username === ''
              ? ''
              : String(u.username)
        }
        if (u.phone !== undefined) this.phone = u.phone ?? null
        if (u.birthday !== undefined) this.birthday = u.birthday || ''
        if (u.gender !== undefined) this.gender = u.gender || ''
        return response
      } catch (error) {
        throw error
      }
    },

    resetState() {
      this.token = ''
      this.id = null
      this.name = ''
      this.username = ''
      this.email = ''
      this.role = ''
      this.status = ''
      this.tenantId = null
      this.phone = null
      this.birthday = ''
      this.gender = ''
      this.permissions = []
      this.menus = []
      removeToken()
    }
  }
})
