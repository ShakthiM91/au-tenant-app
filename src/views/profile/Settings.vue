<template>
  <ion-page class="settings-page">
    <ion-header class="ion-no-border st-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/profile" text="" />
        </ion-buttons>
        <ion-title>Settings</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" aria-label="Support" @click="onSupport">
            <ion-icon slot="icon-only" :icon="headsetOutline" class="accent-icon" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="st-wrap">
        <section class="st-section">
          <h2 class="st-section-title">General</h2>
          <div class="st-block">
            <button type="button" class="st-row" @click="onLanguage">
              <span class="st-label">Language</span>
              <div class="st-right">
                <span class="st-value">{{ languageLabel }}</span>
                <ion-icon :icon="chevronForwardOutline" class="chevron" />
              </div>
            </button>
            <button type="button" class="st-row" @click="onTimeZone">
              <span class="st-label">Time Zone</span>
              <div class="st-right">
                <span class="st-value">{{ timezoneLabel }}</span>
                <ion-icon :icon="chevronForwardOutline" class="chevron" />
              </div>
            </button>
            <button type="button" class="st-row" @click="onTheme">
              <span class="st-label">Theme</span>
              <div class="st-right">
                <span class="st-value">{{ themeLabel }}</span>
                <ion-icon :icon="chevronForwardOutline" class="chevron" />
              </div>
            </button>
          </div>
        </section>

        <section class="st-section">
          <h2 class="st-section-title">Currency</h2>
          <div class="st-block">
            <button type="button" class="st-row" @click="onDefaultCurrency">
              <span class="st-label">Default Currency</span>
              <div class="st-right">
                <span class="st-value st-value-long">{{ defaultCurrencyLabel }}</span>
                <ion-icon :icon="chevronForwardOutline" class="chevron" />
              </div>
            </button>
          </div>
        </section>

        <section class="st-section">
          <h2 class="st-section-title">New transaction</h2>
          <p class="st-hint">Used when you open Add from the tab bar or home. Choose an island first, then an account on that island.</p>
          <div class="st-block">
            <button type="button" class="st-row" @click="onDefaultIsland">
              <span class="st-label">Default island</span>
              <div class="st-right">
                <span class="st-value st-value-long">{{ defaultIslandLabel }}</span>
                <ion-icon :icon="chevronForwardOutline" class="chevron" />
              </div>
            </button>
            <button
              type="button"
              class="st-row"
              :class="{ 'st-row-disabled': selectedIslandKey === undefined }"
              @click="onDefaultAccountRow"
            >
              <span class="st-label">Default account</span>
              <div class="st-right">
                <span class="st-value st-value-long">{{ defaultAccountLabel }}</span>
                <ion-icon :icon="chevronForwardOutline" class="chevron" />
              </div>
            </button>
            <button type="button" class="st-row st-row-muted" @click="onClearTransactionDefaults">
              <span class="st-label">Clear quick-create defaults</span>
            </button>
          </div>
        </section>

        <section class="st-section">
          <h2 class="st-section-title">Notifications</h2>
          <div class="st-block">
            <button type="button" class="st-row" @click="toggleCheckIn">
              <span class="st-label">Check In</span>
              <div class="st-right">
                <span class="st-value">{{ checkInOn ? 'On' : 'Off' }}</span>
                <ion-icon :icon="chevronForwardOutline" class="chevron" />
              </div>
            </button>
            <button type="button" class="st-row" @click="toggleMemberActivity">
              <span class="st-label">Member Activity</span>
              <div class="st-right">
                <span class="st-value">{{ memberActivityOn ? 'On' : 'Off' }}</span>
                <ion-icon :icon="chevronForwardOutline" class="chevron" />
              </div>
            </button>
            <button type="button" class="st-row" @click="enablePush">
              <span class="st-label">Push notifications</span>
              <div class="st-right">
                <span class="st-value">{{ pushStatusLabel }}</span>
                <ion-icon :icon="chevronForwardOutline" class="chevron" />
              </div>
            </button>
          </div>
        </section>

        <div class="st-logout-wrap">
          <button type="button" class="st-logout-btn" @click="logoutConfirmOpen = true">
            Log Out
          </button>
        </div>
      </div>

      <div class="tab-spacer" />

      <ion-alert
        :is-open="logoutConfirmOpen"
        header="Log out?"
        message="You will need to sign in again to access your account."
        :buttons="logoutAlertButtons"
        @didDismiss="logoutConfirmOpen = false"
      />

      <ion-toast
        :is-open="toastOpen"
        :message="toastMessage"
        :duration="2000"
        position="middle"
        css-class="app-toast"
        @didDismiss="toastOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonBackButton,
  IonContent,
  IonIcon,
  IonToast,
  IonAlert,
  actionSheetController
} from '@ionic/vue'
import { chevronForwardOutline, headsetOutline } from 'ionicons/icons'
import { useUserStore } from '@/store/user'
import { getTenantSettings } from '@/api/settings'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'
import { setPrimaryAccount, getAccounts, getAccountsByWorkspace } from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'
import request from '@/utils/request'
import { showToast as showFeedbackToast } from '@/utils/ionicFeedback'
import {
  enableWebPushNotifications,
  getWebPushPermission,
  hasRegisteredFcmToken
} from '@/composables/useWebPush'

const LS = {
  language: 'au_settings_language',
  theme: 'au_settings_theme',
  checkIn: 'au_settings_check_in',
  memberActivity: 'au_settings_member_activity'
}

const router = useRouter()
const userStore = useUserStore()

const toastOpen = ref(false)
const toastMessage = ref('')

function showToast(msg) {
  toastMessage.value = msg
  toastOpen.value = true
}

const languageLabel = ref('English')
const themeLabel = ref('Light')
const checkInOn = ref(true)
const memberActivityOn = ref(true)
const pushEnabling = ref(false)
const pushPermission = ref(getWebPushPermission())
const pushRegistered = ref(hasRegisteredFcmToken())
const enabledCurrencies = ref([])
const tenantDefaultCurrency = ref(null)
const logoutConfirmOpen = ref(false)

/** Island list for picker: `{ key: 'null' | string id, idNum: null | number, name }` */
const islandOptions = ref([])
/** `undefined` = not chosen yet (disable account row); 'null' = no-island; number = workspace id */
const selectedIslandKey = ref(undefined)
const selectedAccountId = ref(null)
const accountOptionsForIsland = ref([])

const defaultIslandLabel = computed(() => {
  const k = selectedIslandKey.value
  if (k === undefined) return '—'
  if (k === 'null') return 'Default (no island)'
  const id = Number(k)
  const row = islandOptions.value.find((o) => o.idNum === id)
  return row?.name || '—'
})

const defaultAccountLabel = computed(() => {
  if (selectedAccountId.value == null) return '—'
  const row = accountOptionsForIsland.value.find((a) => Number(a.id) === Number(selectedAccountId.value))
  return row?.name || `Account ${selectedAccountId.value}`
})

const defaultCurrencyLabel = computed(() => {
  const userCode = userStore.defaultCurrencyCode
  if (userCode) {
    const row = enabledCurrencies.value.find(
      (c) => String(c.code).toUpperCase() === userCode
    )
    if (row) {
      return `${row.name || row.code} ${String(row.code).toUpperCase()}`
    }
    return userCode
  }
  const d = tenantDefaultCurrency.value
  if (d?.code) {
    return `${d.name || d.code} ${String(d.code).toUpperCase()}`
  }
  const first = enabledCurrencies.value[0]
  if (first?.code) {
    return `${first.name || first.code} ${String(first.code).toUpperCase()}`
  }
  return '—'
})

function formatUtcOffset() {
  const offsetMin = -new Date().getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const timezoneLabel = computed(() => formatUtcOffset())

function normalizeCurrencyList(res) {
  const raw = res?.data?.data ?? res?.data ?? res ?? []
  return Array.isArray(raw) ? raw : []
}

function canCreateInIsland(scope) {
  if (!scope) return true
  return !!(scope.add_transaction || scope.full_access || scope.implicit_full)
}

function extractAccountsList(res) {
  if (!res) return []
  const d = res.data
  if (Array.isArray(d)) return d
  if (d && Array.isArray(d.data)) return d.data
  return []
}

async function loadIslandOptions() {
  try {
    const [ownRes, sharedRes] = await Promise.all([getWorkspaces(), getSharedWorkspaces()])
    const own = Array.isArray(ownRes?.data) ? ownRes.data : []
    const shared = Array.isArray(sharedRes?.data?.active) ? sharedRes.data.active : []
    const opts = [{ key: 'null', idNum: null, name: 'Default (no island)' }]
    for (const ws of own) {
      const s = ws.permission_scope
      if (s && !canCreateInIsland(s)) continue
      opts.push({
        key: String(ws.id),
        idNum: Number(ws.id),
        name: ws.name || 'My island'
      })
    }
    for (const ws of shared) {
      const s = ws.permission_scope
      if (s && !canCreateInIsland(s)) continue
      opts.push({
        key: String(ws.id),
        idNum: Number(ws.id),
        name: ws.tenant_name ? `${ws.name || 'Shared'} (${ws.tenant_name})` : ws.name || 'Shared island'
      })
    }
    islandOptions.value = opts
  } catch {
    islandOptions.value = [{ key: 'null', idNum: null, name: 'Default (no island)' }]
  }
}

async function loadAccountsForSelectedIsland() {
  accountOptionsForIsland.value = []
  const k = selectedIslandKey.value
  if (k === undefined) return
  try {
    let list = []
    if (k === 'null') {
      const res = await getAccounts({ is_active: true })
      list = extractAccountsList(res).filter(
        (a) => a.workspace_id == null || a.workspace_id === ''
      )
    } else {
      const res = await getAccountsByWorkspace(Number(k), { is_active: true })
      list = extractAccountsList(res)
    }
    accountOptionsForIsland.value = list.map((a) => ({
      id: Number(a.id),
      name: (a.name && String(a.name).trim()) || `Account ${a.id}`
    }))
  } catch {
    accountOptionsForIsland.value = []
  }
}

async function loadTransactionDefaultsFromServer() {
  try {
    const res = await request({ url: '/api/accounting/primary-account', method: 'get' })
    const d = res?.data
    const aid = d?.account_id
    const wid = d?.workspace_id
    if (aid == null) {
      selectedIslandKey.value = undefined
      selectedAccountId.value = null
      accountOptionsForIsland.value = []
      return
    }
    selectedIslandKey.value = wid != null && wid !== '' ? String(Number(wid)) : 'null'
    selectedAccountId.value = Number(aid)
    await loadAccountsForSelectedIsland()
  } catch {
    selectedIslandKey.value = undefined
    selectedAccountId.value = null
    accountOptionsForIsland.value = []
  }
}

async function onDefaultIsland() {
  await loadIslandOptions()
  const buttons = islandOptions.value.map((o) => ({
    text: o.name,
    handler: () => {
      void (async () => {
        selectedIslandKey.value = o.key
        selectedAccountId.value = null
        await loadAccountsForSelectedIsland()
      })()
    }
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Default island',
    buttons
  })
  await sheet.present()
}

async function showAccountSheetAfterIsland() {
  if (selectedIslandKey.value === undefined) return
  await loadAccountsForSelectedIsland()
  if (!accountOptionsForIsland.value.length) {
    showFeedbackToast('No accounts on this island yet.')
    return
  }
  const buttons = accountOptionsForIsland.value.map((a) => ({
    text: a.name,
    handler: () => {
      void (async () => {
        try {
          const wid =
            selectedIslandKey.value === 'null' ? null : Number(selectedIslandKey.value)
          await setPrimaryAccount(Number(a.id), wid)
          selectedAccountId.value = Number(a.id)
          showFeedbackToast('Saved')
        } catch (e) {
          showFeedbackToast(e?.response?.data?.error || e?.message || 'Failed to save')
        }
      })()
    }
  }))
  buttons.push({ text: 'Cancel', role: 'cancel' })
  const sheet = await actionSheetController.create({
    header: 'Default account',
    buttons
  })
  await sheet.present()
}

async function onDefaultAccountRow() {
  if (selectedIslandKey.value === undefined) {
    showFeedbackToast('Choose a default island first.')
    return
  }
  await showAccountSheetAfterIsland()
}

async function onClearTransactionDefaults() {
  try {
    await setPrimaryAccount(null, undefined)
    selectedIslandKey.value = undefined
    selectedAccountId.value = null
    accountOptionsForIsland.value = []
    showFeedbackToast('Cleared')
  } catch (e) {
    showFeedbackToast(e?.message || 'Failed')
  }
}

async function loadCurrencyContext() {
  try {
    const [curRes, defRes] = await Promise.all([
      getTenantCurrencies(),
      getTenantDefaultCurrency()
    ])
    enabledCurrencies.value = normalizeCurrencyList(curRes)
    tenantDefaultCurrency.value = defRes?.data?.data ?? defRes?.data ?? defRes ?? null
  } catch {
    enabledCurrencies.value = []
    tenantDefaultCurrency.value = null
  }
}

onMounted(async () => {
  pushPermission.value = getWebPushPermission()
  pushRegistered.value = hasRegisteredFcmToken()

  try {
    const lang = localStorage.getItem(LS.language)
    if (lang) languageLabel.value = lang
    const theme = localStorage.getItem(LS.theme)
    if (theme) themeLabel.value = theme
    const ci = localStorage.getItem(LS.checkIn)
    if (ci !== null) checkInOn.value = ci === '1'
    const ma = localStorage.getItem(LS.memberActivity)
    if (ma !== null) memberActivityOn.value = ma === '1'
  } catch {
    /* ignore */
  }

  void loadCurrencyContext()
  await loadIslandOptions()
  await loadTransactionDefaultsFromServer()

  getTenantSettings()
    .then((res) => {
      const tenant = res?.data
      if (!tenant) return
      let settings = tenant.settings
      if (typeof settings === 'string') {
        try {
          settings = JSON.parse(settings || '{}')
        } catch {
          settings = {}
        }
      }
      settings = settings || {}
      if (settings.language === 'en') languageLabel.value = 'English'
      else if (settings.language) languageLabel.value = String(settings.language)
    })
    .catch(() => {
      /* keep design default */
    })
})

function persist() {
  try {
    localStorage.setItem(LS.language, languageLabel.value)
    localStorage.setItem(LS.theme, themeLabel.value)
    localStorage.setItem(LS.checkIn, checkInOn.value ? '1' : '0')
    localStorage.setItem(LS.memberActivity, memberActivityOn.value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function onSupport() {
  showToast('Support will be available soon.')
}

function onLanguage() {
  showToast('More languages will be available soon.')
}

function onTimeZone() {
  showToast('Time zone selection will be available soon.')
}

function onTheme() {
  showToast('Theme options will be available soon.')
}

async function onDefaultCurrency() {
  await loadCurrencyContext()
  if (!enabledCurrencies.value.length) {
    showFeedbackToast('No currencies enabled for your organisation.')
    return
  }

  const buttons = enabledCurrencies.value.map((c) => ({
    text: `${c.name || c.code} (${String(c.code).toUpperCase()})`,
    handler: () => {
      void (async () => {
        try {
          await userStore.updateUserProfile({
            defaultCurrencyCode: String(c.code).toUpperCase()
          })
          showFeedbackToast('Saved')
          await loadCurrencyContext()
        } catch (e) {
          showFeedbackToast(e?.message || 'Failed to save')
        }
      })()
    }
  }))

  buttons.push({
    text: 'Clear',
    handler: () => {
      void (async () => {
        try {
          await userStore.updateUserProfile({ defaultCurrencyCode: null })
          showFeedbackToast('Saved')
          await loadCurrencyContext()
        } catch (e) {
          showFeedbackToast(e?.message || 'Failed')
        }
      })()
    }
  })

  buttons.push({ text: 'Cancel', role: 'cancel' })

  const sheet = await actionSheetController.create({
    header: 'Default currency',
    buttons
  })
  await sheet.present()
}

function toggleCheckIn() {
  checkInOn.value = !checkInOn.value
  persist()
}

const pushStatusLabel = computed(() => {
  if (pushRegistered.value) return 'Enabled on this device'
  if (pushPermission.value === 'denied') return 'Blocked — tap to fix'
  if (pushPermission.value === 'granted') return 'Allowed — tap to register'
  return 'Tap to enable'
})

async function enablePush() {
  if (pushEnabling.value) return
  pushEnabling.value = true
  try {
    const result = await enableWebPushNotifications()
    pushPermission.value = getWebPushPermission()
    pushRegistered.value = hasRegisteredFcmToken()
    if (!result.ok && result.reason === 'permission-denied') {
      showToast('Reset: address bar lock icon → Site settings → Notifications → Allow')
    }
  } finally {
    pushEnabling.value = false
  }
}

function toggleMemberActivity() {
  memberActivityOn.value = !memberActivityOn.value
  persist()
}

async function runLogout() {
  logoutConfirmOpen.value = false
  await userStore.logout()
  router.replace('/login')
}

const logoutAlertButtons = [
  { text: 'Cancel', role: 'cancel' },
  {
    text: 'Log Out',
    handler: () => {
      void runLogout()
    }
  }
]
</script>

<style scoped>
.settings-page {
  --background: #ffffff;
}

.st-header ion-toolbar {
  --background: #ffffff;
  --border-width: 0;
  --min-height: 48px;
}

.st-header ion-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
}

.st-header :deep(ion-back-button) {
  --color: #ff8d28;
  --icon-font-size: 22px;
}

.accent-icon {
  font-size: 24px;
  color: #ff8d28;
}

.settings-page ion-content {
  --background: #ffffff;
}

.st-wrap {
  padding: 8px 21px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  -webkit-font-smoothing: antialiased;
}

.st-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.st-section-title {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 12px;
  color: #6e6a7c;
  letter-spacing: 0.02em;
}

.st-hint {
  margin: 0;
  padding-left: 2px;
  font-size: 13px;
  line-height: 1.35;
  color: #a8a8a8;
}

.st-row-muted .st-label {
  color: #a8a8a8;
}

.st-row-disabled {
  opacity: 0.45;
}

.st-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.st-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 36px;
  padding: 6px 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.st-row:active {
  opacity: 0.88;
}

.st-label {
  font-size: 15px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.72);
  padding-left: 2px;
}

.st-right {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.st-value {
  font-size: 15px;
  font-weight: 400;
  color: #a8a8a8;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.st-value-long {
  max-width: 200px;
}

.chevron {
  flex-shrink: 0;
  font-size: 20px;
  color: #ff8d28;
}

.st-logout-wrap {
  display: flex;
  justify-content: center;
  padding-top: 24px;
  padding-bottom: 8px;
}

.st-logout-btn {
  min-width: 77px;
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: #ffffff;
  font-size: 15px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.72);
  cursor: pointer;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.16);
  -webkit-tap-highlight-color: transparent;
}

.st-logout-btn:active {
  opacity: 0.9;
}

.tab-spacer {
  height: 88px;
}
</style>
