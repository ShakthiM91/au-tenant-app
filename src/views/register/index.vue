<template>
  <ion-page class="register-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="register-container">
        <div class="pattern-bg">
          <div class="pattern-grid">
            <div v-for="n in 42" :key="n" class="pattern-cell" />
          </div>
          <div class="pattern-gradient-line" />
          <div class="pattern-fade-left" />
          <div class="pattern-fade-bottom" />
          <div class="pattern-fade-top" />
        </div>

        <div class="register-content">
          <div class="header-section">
            <h1 class="heading">Get Started</h1>
            <p class="subtitle">Let's get you in the zone &amp; ready to make things happen.</p>
          </div>

          <div class="signup-section">
            <div class="signup-buttons">
              <button class="signup-btn" @click="continueWithGoogle">
                <img class="btn-icon" src="/brands/google-g.png" alt="" width="18" height="18" />
                <span>Continue with Google</span>
              </button>

              <button class="signup-btn" @click="continueWithApple">
                <img class="btn-icon" src="/brands/apple.svg" alt="" width="18" height="18" />
                <span>Continue with Apple</span>
              </button>

              <button class="signup-btn" @click="continueWithEmail">
                <svg class="btn-icon" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="3" width="16" height="12" rx="2" stroke="#333C3F" stroke-width="2" fill="none"/>
                  <path d="M1 7l8 4 8-4" stroke="#333C3F" stroke-width="2" fill="none"/>
                </svg>
                <span>Continue with Email</span>
              </button>
            </div>

            <div class="divider">
              <span class="divider-line" />
              <span class="divider-text">or Login with</span>
              <span class="divider-line" />
            </div>

            <div class="login-icons">
              <button class="icon-btn" @click="continueWithGoogle">
                <img class="icon-btn-svg" src="/brands/google-g.png" alt="" width="18" height="18" />
              </button>
              <button class="icon-btn" @click="continueWithApple">
                <img class="icon-btn-svg" src="/brands/apple.svg" alt="" width="18" height="18" />
              </button>
              <button class="icon-btn" @click="loginWithEmail">
                <svg class="icon-btn-svg" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="3" width="16" height="12" rx="2" stroke="#333C3F" stroke-width="2" fill="none"/>
                  <path d="M1 7l8 4 8-4" stroke="#333C3F" stroke-width="2" fill="none"/>
                </svg>
              </button>
            </div>
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

function continueWithGoogle() {
  // TODO: implement Google sign-in
}

function continueWithApple() {
  // TODO: implement Apple sign-in
}

function continueWithEmail() {
  router.push('/register-email')
}

function loginWithEmail() {
  router.push('/login')
}
</script>

<style scoped>
.register-page {
  --background: #ffffff;
}

.register-container {
  position: relative;
  min-height: 100%;
  background: #ffffff;
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

.register-content {
  position: relative;
  z-index: 1;
  padding: 0 24px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 193px);
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 40px;
}

.heading {
  font-size: 24px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.72);
  margin: 0;
}

.subtitle {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.4;
  color: #6E6A7C;
  margin: 0;
}

.signup-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 68px;
}

.signup-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 268px;
}

.signup-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 38px;
  padding: 0 36px;
  border: 1px solid rgba(255, 141, 40, 0.75);
  border-radius: 10px;
  background: transparent;
  box-shadow: 0 3px 4px 1px rgba(0, 0, 0, 0.16);
  cursor: pointer;
}

.signup-btn:active {
  transform: scale(0.98);
}

.signup-btn .btn-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  object-fit: contain;
}

.signup-btn span {
  font-size: 15px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.72);
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 330px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: rgba(168, 168, 168, 0.8);
  filter: blur(0.5px);
} 

.divider-text {
  font-size: 14px;
  color: #A8A8A8;
  white-space: nowrap;
}

.login-icons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: -34px;
}

.icon-btn {
  width: 70px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 141, 40, 0.75);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
}

.icon-btn:active {
  transform: scale(0.96);
}

.icon-btn-svg {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
</style>
