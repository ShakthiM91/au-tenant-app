<template>
  <ion-page class="referrals-page">
    <ion-header class="ion-no-border ref-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/profile" text="" />
        </ion-buttons>
        <ion-title>Tell a Friend about Us</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" aria-label="Support" @click="onSupport">
            <ion-icon slot="icon-only" :icon="headsetOutline" class="accent-icon" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="ref-wrap">
        <div class="user-summary">
          <div class="avatar-frame">
            <div class="avatar" :style="{ background: AVATAR_GRADIENT }">
              {{ avatarInitials }}
            </div>
          </div>
          <div class="user-meta">
            <div class="name-row">
              <span class="display-name">{{ displayName }}</span>
              <span v-if="showVerified" class="verified-pill">Verified</span>
            </div>
            <p v-if="uidLine" class="uid-line">{{ uidLine }}</p>
          </div>
        </div>

        <div class="main-tabs">
          <button
            v-for="tab in mainTabs"
            :key="tab.id"
            type="button"
            class="main-tab"
            :class="{ active: activeMainTab === tab.id }"
            @click="activeMainTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="loading" class="loading-block">
          <ion-spinner name="crescent" />
        </div>

        <template v-else>
          <!-- Your Code -->
          <div v-if="activeMainTab === 'code'" class="tab-panel">
            <div class="qr-block">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="Referral QR code" class="qr-image" />
              <div v-else class="qr-placeholder" />
            </div>

            <div class="copy-row">
              <div class="copy-text">
                <span class="copy-label">Referral Code</span>
                <span class="copy-value">{{ referralInfo?.code || '—' }}</span>
              </div>
              <button type="button" class="copy-btn" aria-label="Copy referral code" @click="copyText(referralInfo?.code)">
                <ion-icon :icon="copyOutline" />
              </button>
            </div>

            <div class="copy-row">
              <div class="copy-text">
                <span class="copy-label">Referral Link</span>
                <span class="copy-value copy-value-link">{{ displayLink }}</span>
              </div>
              <button type="button" class="copy-btn" aria-label="Copy referral link" @click="copyText(referralInfo?.inviteLink)">
                <ion-icon :icon="copyOutline" />
              </button>
            </div>

            <button type="button" class="inviter-row" @click="openInviterSheet">
              <div class="inviter-left">
                <span class="inviter-title">Who invited you?</span>
                <span class="inviter-sub">We'll make sure to reward the people who spread the good word about Us.</span>
              </div>
              <div class="inviter-right">
                <span class="inviter-value">{{ inviterDisplay }}</span>
                <ion-icon :icon="chevronForwardOutline" class="chevron" />
              </div>
            </button>
          </div>

          <!-- Rewards -->
          <div v-else-if="activeMainTab === 'rewards'" class="tab-panel">
            <div class="sub-tabs">
              <button
                type="button"
                class="sub-tab"
                :class="{ active: rewardsSubTab === 'overview' }"
                @click="rewardsSubTab = 'overview'"
              >
                Overview
              </button>
              <button
                type="button"
                class="sub-tab"
                :class="{ active: rewardsSubTab === 'rules' }"
                @click="rewardsSubTab = 'rules'"
              >
                Rules
              </button>
            </div>

            <div v-if="rewardsSubTab === 'overview'" class="rewards-placeholder">
              <div class="rewards-icon-wrap">
                <ion-icon :icon="giftOutline" class="rewards-icon" />
              </div>
              <h2 class="rewards-title">Something special is on the way</h2>
              <p class="rewards-copy">
                We're building referral rewards you'll love. Share your code today — exciting perks are coming soon.
              </p>
            </div>
            <div v-else class="rewards-placeholder rewards-placeholder--compact">
              <p class="rewards-copy">Reward rules and tiers will be published here soon. Stay tuned!</p>
            </div>
          </div>

          <!-- Referrals list -->
          <div v-else class="tab-panel">
            <h2 class="section-title">My Referrals</h2>

            <div v-if="!referrals.length" class="empty-state">
              <p>No referrals yet. Share your code and invite friends to get started.</p>
            </div>

            <div v-else class="referrals-table-wrap">
              <table class="referrals-table">
                <thead>
                  <tr>
                    <th>UID / Name</th>
                    <th>Register time</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Reward</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in referrals" :key="row.userId">
                    <td>
                      <span class="cell-uid">{{ row.userId }}</span>
                      <span class="cell-name">{{ row.name }}</span>
                    </td>
                    <td>{{ formatRegisterTime(row.registeredAt) }}</td>
                    <td>{{ row.levelLabel || 'I' }}</td>
                    <td>{{ row.statusLabel || 'Registered' }}</td>
                    <td>{{ row.reward ? row.reward : '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>

      <div class="tab-spacer" />

      <ion-modal
        mode="ios"
        :is-open="inviterSheetOpen"
        :initial-breakpoint="0.35"
        :breakpoints="[0, 0.35, 0.5]"
        :handle="true"
        @didDismiss="inviterSheetOpen = false"
      >
        <ion-header class="ion-no-border">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="inviterSheetOpen = false">Cancel</ion-button>
            </ion-buttons>
            <ion-title>Who invited you?</ion-title>
            <ion-buttons slot="end">
              <ion-button :disabled="inviterSaving || !inviterCodeInput.trim()" @click="submitInviter">
                {{ inviterSaving ? 'Saving…' : 'Save' }}
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="inviter-sheet-content">
          <div class="inviter-form">
            <label class="inviter-label">Referral code</label>
            <input
              v-model="inviterCodeInput"
              type="text"
              class="inviter-input"
              placeholder="Enter referral code"
              :disabled="!!referralInfo?.inviter"
            />
            <p v-if="referralInfo?.inviter" class="inviter-hint">Your referrer is already set and cannot be changed.</p>
          </div>
        </ion-content>
      </ion-modal>

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
import { computed, ref, watch } from 'vue'
import QRCode from 'qrcode'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonContent,
  IonIcon,
  IonSpinner,
  IonModal,
  IonToast,
  onIonViewDidEnter
} from '@ionic/vue'
import {
  chevronForwardOutline,
  copyOutline,
  giftOutline,
  headsetOutline
} from 'ionicons/icons'
import { useUserStore } from '@/store/user'
import { getMyReferralInfo, getMyReferrals, setMyInviter } from '@/api/referral'
import {
  getAvatarInitials,
  AVATAR_GRADIENT
} from '@/utils/profileDisplay'
import { showToast } from '@/utils/ionicFeedback'

const userStore = useUserStore()

const mainTabs = [
  { id: 'code', label: 'Your Code' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'referrals', label: 'Referrals' }
]

const activeMainTab = ref('code')
const rewardsSubTab = ref('overview')
const loading = ref(true)
const referralInfo = ref(null)
const referrals = ref([])
const qrDataUrl = ref('')

const inviterSheetOpen = ref(false)
const inviterCodeInput = ref('')
const inviterSaving = ref(false)

const toastOpen = ref(false)
const toastMessage = ref('')

const displayName = computed(() => userStore.name || 'User')
const showVerified = computed(
  () => userStore.status === 'active' || userStore.status === 'verified'
)
const uidLine = computed(() => {
  if (userStore.id == null) return ''
  return `UID : ${userStore.id}`
})
const avatarInitials = computed(() => getAvatarInitials(displayName.value))

const displayLink = computed(() => {
  const link = referralInfo.value?.inviteLink || ''
  return link.replace(/^https?:\/\//, '')
})

const inviterDisplay = computed(() => {
  const inv = referralInfo.value?.inviter
  if (!inv?.userId) return 'Not Set'
  const name = String(inv.name ?? '').trim()
  if (name) return name
  return `User ${inv.userId}`
})

async function loadData() {
  loading.value = true
  try {
    const [meRes, listRes] = await Promise.all([
      getMyReferralInfo(),
      getMyReferrals()
    ])
    referralInfo.value = meRes?.data || null
    referrals.value = listRes?.data || []
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || 'Failed to load referral data'
    toastMessage.value = msg
    toastOpen.value = true
  } finally {
    loading.value = false
  }
}

watch(
  () => referralInfo.value?.inviteLink,
  async (link) => {
    if (!link) {
      qrDataUrl.value = ''
      return
    }
    try {
      qrDataUrl.value = await QRCode.toDataURL(link, {
        width: 220,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      })
    } catch {
      qrDataUrl.value = ''
    }
  },
  { immediate: true }
)

function formatRegisterTime(value) {
  if (!value) return '—'
  const s = String(value).trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s)
  if (m) {
    return `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}:${m[6]}`
  }
  return s
}

async function copyText(text) {
  const value = String(text ?? '').trim()
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    showToast('Copied to clipboard')
  } catch {
    toastMessage.value = 'Could not copy'
    toastOpen.value = true
  }
}

function onSupport() {
  showToast('Support will be available soon.')
}

function openInviterSheet() {
  if (referralInfo.value?.inviter) {
    showToast('Referrer is already set')
    return
  }
  inviterCodeInput.value = ''
  inviterSheetOpen.value = true
}

async function submitInviter() {
  const code = inviterCodeInput.value.trim()
  if (!code) return
  inviterSaving.value = true
  try {
    const res = await setMyInviter(code)
    referralInfo.value = {
      ...referralInfo.value,
      inviter: res?.data?.inviter || null
    }
    inviterSheetOpen.value = false
    showToast('Referrer saved')
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || 'Could not save referrer'
    toastMessage.value = msg
    toastOpen.value = true
  } finally {
    inviterSaving.value = false
  }
}

onIonViewDidEnter(() => {
  loadData()
})
</script>

<style scoped>
.referrals-page {
  --background: #ffffff;
}

.ref-header ion-toolbar {
  --background: #ffffff;
}

.accent-icon {
  color: #ff8d28;
  font-size: 22px;
}

.ref-wrap {
  padding: 0 20px 24px;
  -webkit-font-smoothing: antialiased;
}

.user-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0 16px;
}

.avatar-frame {
  flex-shrink: 0;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.user-meta {
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.display-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.verified-pill {
  font-size: 11px;
  font-weight: 600;
  color: #ff8d28;
  background: rgba(255, 141, 40, 0.12);
  padding: 2px 8px;
  border-radius: 4px;
}

.uid-line {
  margin: 4px 0 0;
  font-size: 13px;
  color: #888;
}

.main-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.main-tab {
  flex: 1;
  background: none;
  border: none;
  padding: 12px 8px;
  font-size: 14px;
  font-weight: 500;
  color: #888;
  position: relative;
  cursor: pointer;
}

.main-tab.active {
  color: #ff8d28;
}

.main-tab.active::after {
  content: '';
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: 0;
  height: 2px;
  background: #ff8d28;
  border-radius: 1px;
}

.sub-tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.sub-tab {
  background: none;
  border: none;
  padding: 10px 0;
  font-size: 14px;
  color: #888;
  position: relative;
  cursor: pointer;
}

.sub-tab.active {
  color: #ff8d28;
  font-weight: 600;
}

.sub-tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #ff8d28;
}

.loading-block {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.loading-block ion-spinner {
  color: #ff8d28;
}

.qr-block {
  display: flex;
  justify-content: center;
  margin: 8px 0 28px;
}

.qr-image {
  width: 220px;
  height: 220px;
  border-radius: 8px;
}

.qr-placeholder {
  width: 220px;
  height: 220px;
  background: #f5f5f5;
  border-radius: 8px;
}

.copy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.copy-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.copy-label {
  font-size: 12px;
  color: #888;
}

.copy-value {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  word-break: break-all;
}

.copy-value-link {
  font-size: 14px;
  font-weight: 400;
}

.copy-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  color: #ff8d28;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.inviter-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  margin-top: 24px;
  padding: 16px 0;
  border: none;
  border-top: 1px solid #f0f0f0;
  background: none;
  text-align: left;
  cursor: pointer;
}

.inviter-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.inviter-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.inviter-sub {
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}

.inviter-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 1;
  min-width: 0;
  max-width: 45%;
}

.inviter-value {
  font-size: 14px;
  color: #ff8d28;
  font-weight: 500;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  color: #ff8d28;
  font-size: 18px;
}

.rewards-placeholder {
  text-align: center;
  padding: 32px 16px 48px;
  background: linear-gradient(165deg, #fff8f2 0%, #ffffff 55%);
  border-radius: 16px;
  border: 1px solid #ffe8d4;
}

.rewards-placeholder--compact {
  padding: 28px 20px;
}

.rewards-icon-wrap {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: rgba(255, 141, 40, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rewards-icon {
  font-size: 36px;
  color: #ff8d28;
}

.rewards-title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.rewards-copy {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #666;
}

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.empty-state {
  padding: 32px 8px;
  text-align: center;
  color: #888;
  font-size: 14px;
  line-height: 1.5;
}

.referrals-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.referrals-table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: 12px;
}

.referrals-table th {
  text-align: left;
  font-weight: 600;
  color: #666;
  padding: 10px 8px;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

.referrals-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #f5f5f5;
  color: #333;
  vertical-align: top;
}

.cell-uid {
  display: block;
  font-weight: 500;
}

.cell-name {
  display: block;
  color: #888;
  margin-top: 2px;
}

.inviter-sheet-content {
  --padding-start: 20px;
  --padding-end: 20px;
}

.inviter-form {
  padding: 16px 0 32px;
}

.inviter-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.inviter-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  box-sizing: border-box;
}

.inviter-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #888;
}

.tab-spacer {
  height: 88px;
}
</style>
