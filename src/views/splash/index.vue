<template>
  <ion-page class="splash-page">
    <ion-content :fullscreen="true" :scroll-y="false" class="splash-content">
      <div class="splash-container">
        <div class="splash-top">
          <div class="logo-wrapper">
            <img src="/logo.png" alt="Rupee" class="logo-image" />
          </div>
          <h1 class="app-name">Rupee</h1>
          <p class="app-tagline">Nurturing Today for a Better Tomorrow</p>
        </div>

        <div class="splash-artwork">
          <img src="/splash-artwork.png" alt="" class="artwork-image" />
        </div>

        <p class="version-text">{{ appVersion }} V</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { getToken } from '@/utils/auth'
import pkg from '../../../package.json'

const router = useRouter()
const appVersion = pkg.version || '0.0.1'

const ONBOARDING_KEY = 'au_onboarding_completed'

onMounted(() => {
  setTimeout(() => {
    const hasToken = getToken()
    const onboardingDone = localStorage.getItem(ONBOARDING_KEY) === 'true'

    if (!onboardingDone) {
      router.replace('/onboarding')
    } else if (hasToken) {
      router.replace('/dashboard')
    } else {
      router.replace('/register')
    }
  }, 3000)
})
</script>

<style scoped>
.splash-page {
  --background: #ffffff;
}

.splash-content {
  --background: #ffffff;
}

.splash-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  overflow: hidden;
}

.splash-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120px;
}

.logo-wrapper {
  margin-bottom: 16px;
}

.logo-image {
  width: 130px;
  height: 130px;
  object-fit: contain;
}

.app-name {
  font-size: 32px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.app-tagline {
  font-size: 15px;
  font-weight: 400;
  color: #6E6A7C;
  margin: 0;
  text-align: center;
  padding: 0 40px;
}

.splash-artwork {
  width: 100%;
  margin-top: auto;
}

.artwork-image {
  width: 100%;
  display: block;
  object-fit: contain;
}

.version-text {
  font-family: 'Handjet', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: #6E6A7C;
  margin: 0;
  padding-bottom: 24px;
  position: relative;
  z-index: 3;
}
</style>
