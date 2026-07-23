<template>
  <ion-page class="welcome-main-page">
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="welcome-main-container">
        <div class="pattern-bg">
          <div class="pattern-grid">
            <div v-for="n in 42" :key="n" class="pattern-cell" />
          </div>
          <div class="pattern-gradient-line" />
          <div class="pattern-fade-left" />
          <div class="pattern-fade-bottom" />
          <div class="pattern-fade-top" />
        </div>

        <div class="welcome-main-content">
          <div class="header-section">
            <h1 class="heading">Welcome!</h1>
            <p class="subtitle">Let's get you closer to your very own financial goals.</p>
          </div>

          <div class="actions-section">
            <button class="start-btn" @click="startNow">
              <span>Start Now !</span>
            </button>

            <div class="bottom-section">
              <p class="login-link">
                Already have an account?
                <button class="link-btn" @click="goToLogin">Log in</button>
              </p>
              <p class="terms-text">
                By continuing, you agree to our
                <span class="terms-link" @click="goToTerms">Terms of Use</span> and
                <span class="terms-link" @click="goToPrivacy">Privacy Policy</span>.
              </p>
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

function startNow() {
  router.push('/register')
}

function goToLogin() {
  router.push('/login')
}

function goToTerms() {
  router.push({ path: '/legal/terms', query: { from: '/start' } })
}

function goToPrivacy() {
  router.push({ path: '/legal/privacy', query: { from: '/start' } })
}
</script>

<style scoped>
.welcome-main-page {
  --background: #ffffff;
}

.welcome-main-container {
  position: relative;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
}

/* ── Decorative pattern ── */
.pattern-bg {
  position: absolute;
  top: 47px;
  left: -30px;
  width: 436px;
  height: 323px;
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(6, 51px);
  grid-template-rows: repeat(7, 51px);
  gap: 0;
  position: absolute;
  top: 0;
  left: 93px;
}

.pattern-cell {
  width: 51px;
  height: 51px;
  border: 0.53px solid #f0f0f0;
  border-radius: 5.6px;
}

.pattern-gradient-line {
  position: absolute;
  top: -31px;
  right: -60px;
  width: 252px;
  height: 354px;
  border: 0.53px solid transparent;
  border-image: linear-gradient(
      150deg,
      #f7f7f7 8%,
      #12c2e9 21%,
      #ede971 53%,
      #f64f59 94%
    )
    1;
  opacity: 0.8;
  pointer-events: none;
}

.pattern-fade-left {
  position: absolute;
  top: 0;
  left: 0;
  width: 154px;
  height: 287px;
  background: linear-gradient(to right, #ffffff, transparent);
  pointer-events: none;
}

.pattern-fade-bottom {
  position: absolute;
  bottom: 0;
  left: 93px;
  width: 287px;
  height: 154px;
  background: linear-gradient(to top, #ffffff, rgba(255, 255, 255, 0.7) 71%, transparent);
  pointer-events: none;
}

.pattern-fade-top {
  position: absolute;
  top: -199px;
  left: 103px;
  width: 382px;
  height: 325px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffffff, transparent);
  pointer-events: none;
}

/* ── Content ── */
.welcome-main-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: calc(env(safe-area-inset-top, 38px) + 167px);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 40px);
  padding-left: 28px;
  padding-right: 28px;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.heading {
  font-size: 30px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.72);
  margin: 0;
  line-height: 1.3;
}

.subtitle {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.5;
  color: #6e6a7c;
  margin: 0;
  max-width: 209px;
}

/* ── CTA + footer ── */
.actions-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.start-btn {
  width: 127px;
  height: 38px;
  background: #ffffff;
  border: none;
  border-radius: 10px;
  box-shadow: 0 3.8px 4px 1px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.start-btn:active {
  transform: scale(0.96);
  box-shadow: 0 2px 3px 0 rgba(0, 0, 0, 0.12);
}

.start-btn span {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 141, 40, 0.75);
}

.bottom-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.login-link {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.72);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 141, 40, 0.9);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.terms-text {
  font-size: 11px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.72);
  margin: 0;
  text-align: center;
  max-width: 234px;
}

.terms-link {
  color: rgba(255, 141, 40, 0.85);
  font-weight: 600;
  cursor: pointer;
}
</style>
