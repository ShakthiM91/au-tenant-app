<template>
  <ion-page class="profile-page">
    <ion-content :fullscreen="true">
      <div class="profile-wrap">
        <header class="me-header">
          <div class="me-header-actions">
            <button type="button" class="icon-btn" aria-label="Support" @click="onSupport">
              <ion-icon :icon="headsetOutline" class="accent-icon" />
            </button>
            <button type="button" class="icon-btn" aria-label="Settings" @click="onSettings">
              <ion-icon :icon="settingsOutline" class="accent-icon" />
            </button>
          </div>
          <h1 class="me-title">Hi, {{ displayFirstName }} !</h1>
        </header>

        <button type="button" class="user-card" @click="onUserCardClick">
          <div class="avatar-frame">
            <div class="avatar" :style="avatarStyle">
              {{ avatarInitials }}
            </div>
          </div>
          <div class="user-meta">
            <div class="name-row">
              <span class="display-name">{{ displayName }}</span>
              <span v-if="showVerified" class="verified-pill">Verified</span>
            </div>
            <p v-if="uidLine" class="uid-line">{{ uidLine }}</p>
            <div class="contact-row">
              <span v-if="maskedPhone" class="contact-pill">{{ maskedPhone }}</span>
              <span v-if="maskedEmail" class="contact-pill">{{ maskedEmail }}</span>
            </div>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="chevron" />
        </button>

        <div class="balance-card">
          <div class="balance-col">
            <span class="balance-label">Account Balance :</span>
            <span class="balance-value">{{ formatAmount(accountBalance) }}</span>
          </div>
          <div class="balance-col balance-col-right">
            <span class="balance-label">Voucher Balance :</span>
            <span class="balance-value">{{ formatAmount(voucherBalance) }}</span>
          </div>
        </div>

        <nav class="me-list" aria-label="Profile menu">
          <button
            v-for="item in menuRows"
            :key="item.id"
            type="button"
            class="me-row"
            @click="item.onClick?.()"
          >
            <div class="me-row-text">
              <span class="me-row-title">{{ item.title }}</span>
              <span v-if="item.subtitle" class="me-row-sub">{{ item.subtitle }}</span>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="chevron" />
          </button>
        </nav>

        <p class="app-version-footer" aria-label="App version">Version {{ appVersion }}</p>
      </div>

      <div class="tab-spacer" />

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
import { computed, ref } from 'vue'
import {
  IonPage,
  IonContent,
  IonIcon,
  IonToast
} from '@ionic/vue'
import {
  chevronForwardOutline,
  headsetOutline,
  settingsOutline
} from 'ionicons/icons'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import {
  maskEmail,
  maskPhone,
  getAvatarInitials,
  AVATAR_GRADIENT
} from '@/utils/profileDisplay'
import pkg from '../../../package.json'

const router = useRouter()
const userStore = useUserStore()

const toastOpen = ref(false)
const toastMessage = ref('')

function showToast(msg) {
  toastMessage.value = msg
  toastOpen.value = true
}

/** Placeholder until balances API exists */
const accountBalance = ref(null)
const voucherBalance = ref(null)

const displayName = computed(() => userStore.name || 'User')
const displayFirstName = computed(() => {
  const n = displayName.value.trim()
  if (!n) return 'User'
  return n.split(/\s+/)[0]
})

const showVerified = computed(
  () => userStore.status === 'active' || userStore.status === 'verified'
)

const uidLine = computed(() => {
  if (userStore.id == null) return ''
  return `UID : ${userStore.id}`
})

const maskedEmail = computed(() => maskEmail(userStore.email))
const maskedPhone = computed(() => {
  if (!userStore.phone) return ''
  return maskPhone(userStore.phone)
})

const avatarInitials = computed(() => getAvatarInitials(displayName.value))

const avatarStyle = computed(() => ({
  background: AVATAR_GRADIENT
}))

function formatAmount(v) {
  if (v == null || Number.isNaN(v)) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v)
}

const appVersion = pkg.version || '0.0.1'

function onSupport() {
  showToast('Support will be available soon.')
}

function onSettings() {
  router.push('/profile/settings')
}

function onUserCardClick() {
  router.push('/profile/my-profile')
}

function onMenuPlaceholder(label) {
  showToast(`${label} will be available soon.`)
}

const menuRows = computed(() => [
  {
    id: 'checkin',
    title: 'Daily Check In',
    onClick: () => onMenuPlaceholder('Daily Check In')
  },
  {
    id: 'membership',
    title: 'Membership',
    onClick: () => onMenuPlaceholder('Membership')
  },
  {
    id: 'guide',
    title: 'User Guide',
    onClick: () => onMenuPlaceholder('User Guide')
  },
  {
    id: 'css',
    title: 'Client Satisfaction Service',
    subtitle: 'Solutions might be one call away.',
    onClick: () => onMenuPlaceholder('Client Satisfaction Service')
  },
  {
    id: 'referral',
    title: 'Tell a Friend about Us',
    subtitle: 'Referral rewards are coming soon. Ask them to use your referral code.',
    onClick: () => onMenuPlaceholder('Referrals')
  },
  {
    id: 'feedback',
    title: 'We value your Feedback',
    subtitle: "Let's strive together",
    onClick: () => onMenuPlaceholder('Feedback')
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    onClick: () => onMenuPlaceholder('Terms & Conditions')
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    onClick: () => onMenuPlaceholder('Privacy Policy')
  },
  {
    id: 'about',
    title: 'About Us',
    onClick: () => onMenuPlaceholder('About Us')
  },
  {
    id: 'updates',
    title: 'Check for Updates',
    subtitle: 'Your current version is up to date.',
    onClick: () => showToast(`Version ${appVersion}`)
  }
])
</script>

<style scoped>
.profile-page {
  --background: #ffffff;
}

.profile-page ion-content {
  --background: #ffffff;
}

.profile-wrap {
  padding: 0 22px;
  padding-top: max(10px, env(safe-area-inset-top));
  padding-bottom: 12px;
  -webkit-font-smoothing: antialiased;
}

.me-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0 18px;
  min-height: 44px;
}

.me-header-actions {
  position: absolute;
  top: 2px;
  right: -4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.accent-icon {
  font-size: 24px;
  color: #ff8d28;
}

.me-title {
  margin: 30px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.01em;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  margin: 0 0 20px;
  padding: 2px 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-radius: 12px;
}

.user-card:active {
  opacity: 0.92;
}

.avatar-frame {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #1a0a24;
  letter-spacing: -0.03em;
}

.user-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.display-name {
  font-size: 17px;
  font-weight: 500;
  color: #3a3a3c;
  letter-spacing: -0.02em;
}

.verified-pill {
  font-size: 11px;
  font-weight: 600;
  color: #ff8d28;
  padding: 2px 9px;
  border-radius: 5px;
  background: #ffffff;
  border: 1px solid rgba(255, 141, 40, 0.42);
  line-height: 15px;
}

.uid-line {
  margin: 0;
  font-size: 11px;
  line-height: 15px;
  color: #636366;
  letter-spacing: 0.01em;
}

.contact-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 1px;
}

.contact-pill {
  font-size: 11px;
  font-weight: 500;
  color: #48484a;
  padding: 3px 8px;
  border-radius: 5px;
  background: #ffffff;
  border: 1px solid rgba(120, 120, 128, 0.22);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  flex-shrink: 0;
  font-size: 20px;
  color: #ff8d28;
  opacity: 0.95;
  align-self: center;
}

.balance-card {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  margin-bottom: 24px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 14px rgba(0, 0, 0, 0.07);
}

.balance-col {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  justify-content: center;
}

.balance-col-right {
  align-items: flex-end;
  text-align: right;
}

.balance-label {
  font-size: 12px;
  font-weight: 400;
  color: #636366;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.balance-value {
  font-size: 15px;
  font-weight: 600;
  color: #3a3a3c;
  letter-spacing: -0.02em;
}

.me-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.me-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 36px;
  padding: 5px 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.me-row:active {
  opacity: 0.85;
}

.me-row-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.me-row-title {
  font-size: 15px;
  font-weight: 400;
  color: #3a3a3c;
  line-height: 22px;
  letter-spacing: -0.015em;
}

.me-row-sub {
  font-size: 11px;
  line-height: 15px;
  color: #8e8a96;
  font-weight: 400;
  max-width: 92%;
}

.app-version-footer {
  margin: 28px 0 4px;
  text-align: center;
  font-size: 12px;
  line-height: 16px;
  color: #aeaeb2;
  font-weight: 400;
  letter-spacing: 0.02em;
  user-select: none;
}

.tab-spacer {
  height: 88px;
}
</style>
