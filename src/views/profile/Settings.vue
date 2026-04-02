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
            <button type="button" class="st-row" @click="onEnabledCurrencies">
              <span class="st-label">Enabled Currencies</span>
              <div class="st-right">
                <ion-icon :icon="chevronForwardOutline" class="chevron" />
              </div>
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
        position="bottom"
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
  IonAlert
} from '@ionic/vue'
import { chevronForwardOutline, headsetOutline } from 'ionicons/icons'
import { useUserStore } from '@/store/user'
import { getTenantSettings } from '@/api/settings'

const LS = {
  language: 'au_settings_language',
  theme: 'au_settings_theme',
  checkIn: 'au_settings_check_in',
  memberActivity: 'au_settings_member_activity',
  defaultCurrency: 'au_settings_default_currency'
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
const defaultCurrencyLabel = ref('Sri Lankan Rupee LKR')
const logoutConfirmOpen = ref(false)

function formatUtcOffset() {
  const offsetMin = -new Date().getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const timezoneLabel = computed(() => formatUtcOffset())

onMounted(() => {
  try {
    const lang = localStorage.getItem(LS.language)
    if (lang) languageLabel.value = lang
    const theme = localStorage.getItem(LS.theme)
    if (theme) themeLabel.value = theme
    const ci = localStorage.getItem(LS.checkIn)
    if (ci !== null) checkInOn.value = ci === '1'
    const ma = localStorage.getItem(LS.memberActivity)
    if (ma !== null) memberActivityOn.value = ma === '1'
    const cur = localStorage.getItem(LS.defaultCurrency)
    if (cur) defaultCurrencyLabel.value = cur
  } catch {
    /* ignore */
  }

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
      const code =
        settings.default_currency_code ||
        settings.defaultCurrencyCode ||
        settings.currency ||
        settings.currency_code
      const name =
        settings.default_currency_name ||
        settings.defaultCurrencyName ||
        settings.currency_name
      if (code && name) {
        defaultCurrencyLabel.value = `${name} ${String(code).toUpperCase()}`
        localStorage.setItem(LS.defaultCurrency, defaultCurrencyLabel.value)
      } else if (code) {
        defaultCurrencyLabel.value = String(code).toUpperCase()
        localStorage.setItem(LS.defaultCurrency, defaultCurrencyLabel.value)
      }
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
    localStorage.setItem(LS.defaultCurrency, defaultCurrencyLabel.value)
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

function onDefaultCurrency() {
  showToast('Currency selection will be available soon.')
}

function onEnabledCurrencies() {
  showToast('Enabled currencies will be available soon.')
}

function toggleCheckIn() {
  checkInOn.value = !checkInOn.value
  persist()
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
