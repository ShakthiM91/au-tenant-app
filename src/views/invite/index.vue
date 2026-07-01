<template>
  <ion-page class="invite-landing-page">
    <ion-content :fullscreen="true" class="invite-content">
      <div class="invite-wrap">
        <ion-spinner name="crescent" class="invite-spinner" />
        <p class="invite-text">Preparing your invitation…</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonSpinner } from '@ionic/vue'
import { storeReferralCode } from '@/utils/referralStorage'
import { getToken } from '@/utils/auth'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const code = String(route.params.code ?? '').trim()
  if (code) storeReferralCode(code)

  if (getToken()) {
    router.replace('/profile/referrals')
  } else {
    router.replace('/start')
  }
})
</script>

<style scoped>
.invite-content {
  --background: #ffffff;
}

.invite-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
  padding: 24px;
}

.invite-spinner {
  color: #ff8d28;
}

.invite-text {
  margin: 0;
  font-size: 15px;
  color: #666;
}
</style>
