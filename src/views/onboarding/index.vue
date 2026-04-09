<template>
  <ion-page class="onboarding-page">
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="onboarding-container">
        <div
          class="slides-wrapper"
          ref="slidesRef"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <div
            class="slides-track"
            :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
          >
            <div v-for="(slide, i) in slides" :key="i" class="slide">
              <div class="slide-illustration">
                <img :src="slide.image" alt="" class="slide-image" />
              </div>
              <div class="slide-text">
                <p class="slide-heading">{{ slide.heading }}</p>
                <p v-if="slide.subheading" class="slide-subheading">{{ slide.subheading }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="slide-indicators">
          <span
            v-for="(_, i) in slides"
            :key="i"
            class="dot"
            :class="{ active: i === currentIndex }"
          />
        </div>

        <button class="cta-button" @click="onCtaClick">
          {{ slides[currentIndex].cta }}
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'

const ONBOARDING_KEY = 'au_onboarding_completed'

const router = useRouter()
const currentIndex = ref(0)

const slides = [
  {
    image: '/onboarding-1.png',
    heading: 'Know Your Balance, Find Your \nBalance',
    subheading: null,
    cta: 'Find My Balance !'
  },
  {
    image: '/onboarding-2.png',
    heading: 'Build wealth,\none entry at a time',
    subheading: null,
    cta: 'Build my wealth !'
  },
  {
    image: '/onboarding-3.png',
    heading: 'Welcome to a world of \nnew possibilities',
    subheading: 'It all starts Today',
    cta: "I'm All In !"
  }
]

let touchStartX = 0
let touchDeltaX = 0

function onTouchStart(e) {
  touchStartX = e.touches[0].clientX
  touchDeltaX = 0
}

function onTouchMove(e) {
  touchDeltaX = e.touches[0].clientX - touchStartX
}

function onTouchEnd() {
  const threshold = 50
  if (touchDeltaX < -threshold && currentIndex.value < slides.length - 1) {
    currentIndex.value++
  } else if (touchDeltaX > threshold && currentIndex.value > 0) {
    currentIndex.value--
  }
}

function completeOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, 'true')
  router.replace('/register')
}

function onCtaClick() {
  if (currentIndex.value < slides.length - 1) {
    currentIndex.value++
  } else {
    completeOnboarding()
  }
}
</script>

<style scoped>
.onboarding-page {
  --background: #ffffff;
}

.onboarding-container {
  --onboarding-indicators-bottom: 120px;
  --onboarding-slide-clearance-above-indicators: 56px;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.slides-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: calc(
    var(--onboarding-indicators-bottom) + var(--onboarding-slide-clearance-above-indicators) +
      env(safe-area-inset-bottom, 0px)
  );
  overflow: hidden;
  touch-action: pan-y;
}

.slides-track {
  display: flex;
  height: 100%;
  transition: transform 0.35s ease;
  will-change: transform;
}

.slide {
  min-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
}

.slide-illustration {
  width: 288px;
  height: 225px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
}

.slide-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.slide-icon {
  font-size: 120px;
  color: #FF8D28;
  opacity: 0.6;
}

.slide-text {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.slide-heading {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
  color: #6E6A7C;
  margin: 0;
  padding: 0 16px;
  white-space: pre-line;
}

.slide-subheading {
  font-size: 22px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.72);
  margin: 0;
  white-space: pre-line;
}

.slide-indicators {
  position: absolute;
  bottom: var(--onboarding-indicators-bottom);
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  z-index: 2;
}

.dot {
  height: 5px;
  border-radius: 100px;
  transition: all 0.3s ease;
}

.dot:not(.active) {
  width: 10px;
  background: #D8D8D8;
}

.dot.active {
  width: 26px;
  background: rgba(255, 141, 40, 0.75);
}

.cta-button {
  position: absolute;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 198px;
  height: 38px;
  border: none;
  border-radius: 10px;
  background: #ffffff;
  color: rgba(255, 141, 40, 0.75);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 3.8px 4px 1px rgba(0, 0, 0, 0.16);
  z-index: 2;
}

.cta-button:active {
  transform: translateX(-50%) scale(0.97);
}
</style>
