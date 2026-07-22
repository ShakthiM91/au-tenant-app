<template>
  <ion-page class="splash-page">
    <ion-content :fullscreen="true" :scroll-y="false" class="splash-content">
      <div class="splash-container">
        <div class="splash-top">
          <div class="logo-wrapper">
            <img :src="logoSrc" alt="Rupee" class="logo-image" :style="logoStyle" />
          </div>
          <h1 class="app-name">{{ appName }}</h1>
          <p class="app-tagline">{{ tagline }}</p>
        </div>

        <div class="splash-artwork">
          <img :src="artworkSrc" alt="" class="artwork-image" />
        </div>

        <p class="version-text">{{ appVersion }} V</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/store/user'
import { resolvePostAuthDestination } from '@/utils/onboardingSurvey/resolveDestination'
import { isAccessTokenExpired, refreshSession } from '@/utils/tokenRefresh'
import { useAppContent } from '@/composables/useAppContent'
import { resolveContentImage } from '@/utils/contentImage'
import pkg from '../../../package.json'

const router = useRouter()
const userStore = useUserStore()
const appVersion = pkg.version || '0.0.1'
const { getText, getImageRaw, contentVersion } = useAppContent()

const appName = ref(getText('splash.appName'))
const tagline = ref(getText('splash.tagline'))
const logoSrc = ref('/logo.png')
const artworkSrc = ref('/splash-artwork.png')
const logoSizePx = ref(130)

const logoStyle = computed(() => ({
  width: `${logoSizePx.value}px`,
  height: `${logoSizePx.value}px`,
}))

const MIN_SPLASH_MS = 3000

function resolveLogoSize(raw) {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 130
}

async function applyContent() {
  appName.value = getText('splash.appName')
  tagline.value = getText('splash.tagline')
  logoSizePx.value = resolveLogoSize(getText('splash.logoSize', '130'))
  logoSrc.value = await resolveContentImage(getImageRaw('splash.logo'), '/logo.png')
  artworkSrc.value = await resolveContentImage(getImageRaw('splash.artwork'), '/splash-artwork.png')
}

watch(contentVersion, () => {
  applyContent()
}, { immediate: true })

function waitForMinSplash(elapsedMs) {
  const remaining = MIN_SPLASH_MS - elapsedMs
  if (remaining <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, remaining))
}

async function resolveSplashDestination() {

  let token = getToken()
  if (!token) {
    return '/start'
  }

  if (isAccessTokenExpired(token)) {
    const refreshed = await refreshSession()
    if (!refreshed) {
      await userStore.clearSession()
      return '/start'
    }
    token = getToken()
    if (!token) {
      return '/start'
    }
  }

  try {
    await userStore.getInfo()
    return await resolvePostAuthDestination()
  } catch {
    await userStore.clearSession()
    return '/start'
  }
}

onMounted(async () => {
  const start = Date.now()
  const destination = await resolveSplashDestination()
  await waitForMinSplash(Date.now() - start)
  router.replace(destination)
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
