<template>
  <ion-page class="my-profile-page">
    <ion-header class="ion-no-border mp-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/profile" text="" />
        </ion-buttons>
        <ion-title>My Profile</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" aria-label="Support" @click="onSupport">
            <ion-icon slot="icon-only" :icon="headsetOutline" class="accent-icon" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="mp-wrap">
        <button type="button" class="mp-row mp-row-photo" @click="onPhotoClick">
          <span class="mp-label">Profile Picture</span>
          <div class="mp-photo-right">
            <div class="avatar-frame">
              <div class="avatar" :style="{ background: AVATAR_GRADIENT }">
                {{ avatarInitials }}
              </div>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="chevron" />
          </div>
        </button>

        <button type="button" class="mp-row" @click="onFieldClick('Nickname')">
          <span class="mp-label">Nickname</span>
          <div class="mp-value-wrap">
            <span class="mp-value">{{ nicknameDisplay }}</span>
            <ion-icon :icon="chevronForwardOutline" class="chevron" />
          </div>
        </button>

        <button type="button" class="mp-row" @click="onFieldClick('Username')">
          <span class="mp-label">Username</span>
          <div class="mp-value-wrap">
            <span class="mp-value">{{ usernameDisplay }}</span>
            <ion-icon :icon="chevronForwardOutline" class="chevron" />
          </div>
        </button>

        <button type="button" class="mp-row" @click="onFieldClick('Phone Number')">
          <span class="mp-label">Phone Number</span>
          <div class="mp-value-wrap">
            <span class="mp-value">{{ phoneDisplay }}</span>
            <ion-icon :icon="chevronForwardOutline" class="chevron" />
          </div>
        </button>

        <button type="button" class="mp-row" @click="onFieldClick('Email')">
          <span class="mp-label">Email</span>
          <div class="mp-value-wrap">
            <span class="mp-value mp-value-email">{{ emailMasked }}</span>
            <ion-icon :icon="chevronForwardOutline" class="chevron" />
          </div>
        </button>

        <button type="button" class="mp-row" @click="onFieldClick('Birthday')">
          <span class="mp-label">Birthday</span>
          <div class="mp-value-wrap">
            <span class="mp-value">{{ birthdayDisplay }}</span>
            <ion-icon :icon="chevronForwardOutline" class="chevron" />
          </div>
        </button>

        <button type="button" class="mp-row" @click="onFieldClick('Gender')">
          <span class="mp-label">Gender</span>
          <div class="mp-value-wrap">
            <span class="mp-value">{{ genderDisplay }}</span>
            <ion-icon :icon="chevronForwardOutline" class="chevron" />
          </div>
        </button>

        <button type="button" class="mp-row mp-row-kyc" @click="onFieldClick('KYC Verification')">
          <div class="mp-kyc-left">
            <span class="mp-label">KYC Verification</span>
            <span class="mp-kyc-sub">Coming Soon</span>
          </div>
          <div class="mp-kyc-right">
            <span v-if="accountVerified" class="kyc-pill kyc-pill-verified">Verified</span>
            <span v-else class="kyc-pill kyc-pill-muted">Not verified</span>
            <ion-icon :icon="chevronForwardOutline" class="chevron" />
          </div>
        </button>

        <p class="mp-privacy">
          We prioritize your privacy and security. We strive to protect your information and keep your data safe at every level.
        </p>
      </div>

      <div class="tab-spacer" />

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
import { computed, ref } from 'vue'
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
  IonToast
} from '@ionic/vue'
import { chevronForwardOutline, headsetOutline } from 'ionicons/icons'
import { useUserStore } from '@/store/user'
import {
  maskEmail,
  maskPhone,
  getAvatarInitials,
  AVATAR_GRADIENT
} from '@/utils/profileDisplay'

const userStore = useUserStore()

const toastOpen = ref(false)
const toastMessage = ref('')

function showToast(msg) {
  toastMessage.value = msg
  toastOpen.value = true
}

const displayName = computed(() => userStore.name || 'User')

const nicknameDisplay = computed(() => {
  const n = displayName.value.trim()
  if (!n) return 'User'
  return n.split(/\s+/)[0]
})

const usernameDisplay = computed(() => {
  const email = userStore.email || ''
  if (!email) return 'anonymousUser'
  const local = email.split('@')[0]
  return local || 'anonymousUser'
})

const phoneDisplay = computed(() => {
  const raw = userStore.phone
  if (!raw) return 'Not linked'
  return maskPhone(raw)
})

const emailMasked = computed(() => maskEmail(userStore.email) || '—')

const birthdayDisplay = computed(() => {
  const b = userStore.birthday
  if (!b) return 'Not set'
  const d = new Date(b)
  if (!Number.isNaN(d.getTime())) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d)
  }
  return b
})

const genderDisplay = computed(() => {
  if (!userStore.gender) return "I'd rather not say"
  const g = userStore.gender
  if (g === 'prefer_not_say') return "I'd rather not say"
  return g
})

const accountVerified = computed(
  () => userStore.status === 'active' || userStore.status === 'verified'
)

const avatarInitials = computed(() => getAvatarInitials(displayName.value))

function onSupport() {
  showToast('Support will be available soon.')
}

function onPhotoClick() {
  showToast('Profile photo update will be available soon.')
}

function onFieldClick(label) {
  showToast(`${label} editing will be available soon.`)
}
</script>

<style scoped>
.my-profile-page {
  --background: #ffffff;
}

.mp-header ion-toolbar {
  --background: #ffffff;
  --border-width: 0;
  --min-height: 48px;
}

.mp-header ion-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
}

.mp-header :deep(ion-back-button) {
  --color: #ff8d28;
  --icon-font-size: 22px;
}

.accent-icon {
  font-size: 24px;
  color: #ff8d28;
}

.my-profile-page ion-content {
  --background: #ffffff;
}

.mp-wrap {
  padding: 8px 21px 24px;
  padding-top: max(4px, env(safe-area-inset-top));
  display: flex;
  flex-direction: column;
  gap: 10px;
  -webkit-font-smoothing: antialiased;
}

.mp-row {
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

.mp-row:active {
  opacity: 0.88;
}

.mp-row-photo {
  min-height: 92px;
  align-items: center;
  padding: 10px 0;
}

.mp-label {
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.72);
  padding-left: 2px;
}

.mp-value-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.mp-value {
  font-size: 15px;
  font-weight: 400;
  color: #a8a8a8;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mp-value-email {
  max-width: 160px;
}

.chevron {
  flex-shrink: 0;
  font-size: 20px;
  color: #ff8d28;
}

.mp-photo-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-frame {
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
}

.mp-row-kyc {
  align-items: center;
}

.mp-kyc-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mp-kyc-sub {
  font-size: 10px;
  line-height: 14px;
  color: #6e6a7c;
  padding-left: 2px;
}

.mp-kyc-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.kyc-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 5px;
  line-height: 16px;
  border: 1px solid rgba(168, 168, 168, 0.35);
  background: #fff;
}

.kyc-pill-verified {
  color: #ff8d28;
}

.kyc-pill-muted {
  color: #a8a8a8;
  font-weight: 500;
}

.mp-privacy {
  margin: 28px auto 0;
  max-width: 300px;
  padding: 10px;
  font-size: 13px;
  line-height: 1.45;
  text-align: center;
  color: #6e6a7c;
}

.tab-spacer {
  height: 88px;
}
</style>
