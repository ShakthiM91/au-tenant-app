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
                <svg class="btn-icon" viewBox="0 0 18 18" fill="none">
                  <path d="M16.876 7.565H9.162v3.468h4.428c-.42 2.16-2.304 3.468-4.428 3.468a4.968 4.968 0 01-4.968-4.968A4.968 4.968 0 019.162 4.565c1.188 0 2.268.432 3.108 1.128l2.592-2.592A8.424 8.424 0 009.162.565a8.468 8.468 0 00-8.468 8.468 8.468 8.468 0 008.468 8.468c4.32 0 8.1-3.132 8.1-8.468 0-.468-.072-.936-.18-1.404l-.206-.064z" fill="#4285F4"/>
                  <path d="M1.982 10.557a8.466 8.466 0 004.14 5.318l2.868-2.376c-1.272-.384-2.34-1.26-2.88-2.46L1.982 10.557z" fill="#34A853"/>
                  <path d="M1.126 5.427A8.34 8.34 0 00.694 9.033c0 1.332.324 2.58.864 3.696l4.128-.48c-.36-.744-.564-1.56-.564-2.424 0-.864.204-1.68.564-2.424L1.126 5.427z" fill="#FBBC05"/>
                  <path d="M9.162 1.125c2.16 0 4.104.804 5.592 2.124l2.592-2.592A8.808 8.808 0 009.162.001a8.466 8.466 0 00-7.18 3.93l4.56 1.974A4.956 4.956 0 019.162 3.06V1.125z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <button class="signup-btn" @click="continueWithApple">
                <svg class="btn-icon" viewBox="0 0 18 18" fill="none">
                  <path d="M12.606 0c.096 0 .192.012.264.012-.132 1.584-1.14 2.784-2.244 3.456-.54.348-1.14.564-1.788.564-.012-.132-.012-.276-.012-.42 0-.684.252-1.392.684-1.956C10.194.804 11.298.168 12.606 0z" fill="#000"/>
                  <path d="M16.338 13.14c-.444 1.02-.66 1.476-1.236 2.376-.804 1.26-1.932 2.832-3.336 2.844-1.248.012-1.572-.816-3.264-.804-1.692.012-2.052.828-3.3.816-1.404-.012-2.472-1.428-3.276-2.688C.198 12.864-.198 9.876.594 8.076c.564-1.272 1.572-2.136 2.688-2.136 1.2 0 1.956.816 2.952.816.96 0 1.548-.816 2.94-.816.996 0 1.884.54 2.52 1.32-2.22 1.212-1.86 4.368.504 5.208-.348.9-.804 1.74-1.356 2.52l1.296.012c.492 0 .876-.24 1.2-.66z" fill="#000"/>
                </svg>
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
                <svg class="icon-btn-svg" viewBox="0 0 18 18" fill="none">
                  <path d="M16.876 7.565H9.162v3.468h4.428c-.42 2.16-2.304 3.468-4.428 3.468a4.968 4.968 0 01-4.968-4.968A4.968 4.968 0 019.162 4.565c1.188 0 2.268.432 3.108 1.128l2.592-2.592A8.424 8.424 0 009.162.565a8.468 8.468 0 00-8.468 8.468 8.468 8.468 0 008.468 8.468c4.32 0 8.1-3.132 8.1-8.468 0-.468-.072-.936-.18-1.404l-.206-.064z" fill="#4285F4"/>
                  <path d="M1.982 10.557a8.466 8.466 0 004.14 5.318l2.868-2.376c-1.272-.384-2.34-1.26-2.88-2.46L1.982 10.557z" fill="#34A853"/>
                  <path d="M1.126 5.427A8.34 8.34 0 00.694 9.033c0 1.332.324 2.58.864 3.696l4.128-.48c-.36-.744-.564-1.56-.564-2.424 0-.864.204-1.68.564-2.424L1.126 5.427z" fill="#FBBC05"/>
                  <path d="M9.162 1.125c2.16 0 4.104.804 5.592 2.124l2.592-2.592A8.808 8.808 0 009.162.001a8.466 8.466 0 00-7.18 3.93l4.56 1.974A4.956 4.956 0 019.162 3.06V1.125z" fill="#EA4335"/>
                </svg>
              </button>
              <button class="icon-btn" @click="continueWithApple">
                <svg class="icon-btn-svg" viewBox="0 0 18 18" fill="none">
                  <path d="M14.94 6.3c-.08.06-1.52.87-1.52 2.66 0 2.07 1.82 2.8 1.88 2.82-.01.05-.29 1.01-0.97 1.99-.58.85-1.19 1.7-2.12 1.7-.93 0-1.17-.54-2.24-.54-1.05 0-1.42.56-2.29.56-.87 0-1.49-.79-2.18-1.75C4.39 12.26 3.7 10.42 3.7 8.67c0-2.8 1.82-4.28 3.62-4.28.95 0 1.75.63 2.35.63.58 0 1.48-.67 2.57-.67.41 0 1.91.04 2.7 1.95zm-3.19-2.58c.44-.52.75-1.25.75-1.97 0-.1-.01-.2-.03-.28-.71.03-1.56.48-2.07 1.06-.4.45-.77 1.18-.77 1.92 0 .11.02.22.03.26.05.01.14.02.22.02.64 0 1.44-.43 1.87-1.01z" fill="#000"/>
                </svg>
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
}
</style>
