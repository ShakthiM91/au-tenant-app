<template>
  <ion-page class="welcome-page">
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="welcome-container">
        <div class="pattern-bg">
          <div class="pattern-grid">
            <div v-for="n in 42" :key="n" class="pattern-cell" />
          </div>
          <div class="pattern-gradient-line" />
          <div class="pattern-fade-left" />
          <div class="pattern-fade-bottom" />
          <div class="pattern-fade-top" />
        </div>

        <div class="welcome-content">
          <div class="header-section">
            <h1 class="heading">Welcome !</h1>
            <p class="subtitle">We've started the engine, a world of potential left to explore.</p>
          </div>

          <div class="illustration">
            <img src="/welcome-journey.png" alt="Journey" class="journey-img" />
          </div>

          <div class="bottom-section">
            <button class="cta-button" @click="onContinue">I'm All In !</button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'

const router = useRouter()

function onContinue() {
  // TODO: navigate to dashboard/home once built
}
</script>

<style scoped>
.welcome-page {
  --background: #ffffff;
}

.welcome-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
}

.pattern-bg {
  position: absolute;
  top: 34px;
  left: -30px;
  width: 436px;
  height: 323px;
  overflow: hidden;
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(7, 51px);
  grid-template-rows: repeat(6, 51px);
  gap: 0px;
  position: absolute;
  top: 0;
  left: 93px;
}

.pattern-cell {
  width: 51px;
  height: 51px;
  border: 0.5px solid #F0F0F0;
  border-radius: 5.6px;
}

.pattern-gradient-line {
  position: absolute;
  top: -31px;
  right: -60px;
  width: 252px;
  height: 354px;
  border: 0.5px solid transparent;
  border-image: linear-gradient(135deg, #F7F7F7 8%, #12C2E9 21%, #EDE971 53%, #F64F59 94%) 1;
  opacity: 0.8;
  transform: rotate(-5deg);
  pointer-events: none;
}

.pattern-fade-left {
  position: absolute;
  top: 0;
  left: 0;
  width: 154px;
  height: 100%;
  background: linear-gradient(to right, #ffffff, transparent);
}

.pattern-fade-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 154px;
  background: linear-gradient(to top, #ffffff, rgba(255,255,255,0.7) 71%, transparent);
}

.pattern-fade-top {
  position: absolute;
  top: -100px;
  left: 103px;
  width: 382px;
  height: 325px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffffff, transparent);
  pointer-events: none;
}

.welcome-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 38px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 193px);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 85px);
  box-sizing: border-box;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.heading {
  font-size: 24px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.72);
  margin: 0;
}

.subtitle {
  font-size: 14px;
  font-weight: 400;
  color: #6E6A7C;
  margin: 0;
  line-height: 1.4;
}

.illustration {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.journey-img {
  max-width: 220px;
  height: auto;
}

.bottom-section {
  display: flex;
  justify-content: center;
}

.cta-button {
  width: 198px;
  height: 38px;
  border: none;
  border-radius: 10px;
  background: #ffffff;
  color: rgba(255, 141, 40, 0.75);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 3.8px 4px 1px rgba(0, 0, 0, 0.16);
}

.cta-button:active {
  transform: scale(0.97);
}
</style>
