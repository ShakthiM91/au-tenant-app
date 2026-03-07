import { defineStore } from 'pinia'
import { login, logout, getInfo, updateProfile } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    name: '',
    email: '',
    role: '',
    tenantId: null,
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

        this.name = user.name || user.email
        this.email = user.email
        this.role = user.role
        this.tenantId = user.tenantId || null
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
      }
    },

    async updateUserProfile(data) {
      try {
        const response = await updateProfile(data)
        if (response && response.user) {
          this.name = response.user.name || this.name
          this.email = response.user.email || this.email
          return response
        }
      } catch (error) {
        throw error
      }
    },

    resetState() {
      this.token = ''
      this.name = ''
      this.email = ''
      this.role = ''
      this.tenantId = null
      this.permissions = []
      this.menus = []
      removeToken()
    }
  }
})
