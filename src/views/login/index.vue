<template>
  <ion-page class="login-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="login-container">
        <div class="pattern-bg">
          <div class="pattern-grid">
            <div v-for="n in 42" :key="n" class="pattern-cell" />
          </div>
          <div class="pattern-gradient-line" />
          <div class="pattern-fade-left" />
          <div class="pattern-fade-bottom" />
          <div class="pattern-fade-top" />
        </div>

        <div class="login-content">
          <div class="header-section">
            <h1 class="heading">Log in</h1>
            <p class="subtitle">
              Don't have an account?
              <span class="link" @click="goToRegister">Register</span>
            </p>
          </div>

          <form class="form-section" @submit.prevent="onLogin">
            <div class="field-group">
              <label class="field-label">Email</label>
              <input
                v-model="form.email"
                type="email"
                class="field-input"
                placeholder="you@email.com"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Password</label>
              <input
                v-model="form.password"
                type="password"
                class="field-input"
                placeholder="••••••••••"
              />
            </div>
          </form>

          <div class="bottom-section">
            <p class="terms-text">
              By continuing, you agree to
              <span class="terms-link">Terms of Use</span> and
              <span class="terms-link">Privacy Policy</span>.
            </p>

            <button class="login-button" :disabled="loading" @click="onLogin">
              {{ loading ? 'Logging in...' : 'Log In' }}
            </button>

            <p class="forgot-text" @click="onForgotPassword">Forgot password ?</p>
          </div>

          <div class="alt-login">
            <div class="divider">
              <span class="divider-line" />
              <span class="divider-text">or Login with</span>
              <span class="divider-line" />
            </div>

            <div class="login-icons">
              <button class="icon-btn" type="button" @click="loginWithGoogle">
                <svg class="icon-btn-svg" viewBox="0 0 18 18" fill="none">
                  <path d="M16.876 7.565H9.162v3.468h4.428c-.42 2.16-2.304 3.468-4.428 3.468a4.968 4.968 0 01-4.968-4.968A4.968 4.968 0 019.162 4.565c1.188 0 2.268.432 3.108 1.128l2.592-2.592A8.424 8.424 0 009.162.565a8.468 8.468 0 00-8.468 8.468 8.468 8.468 0 008.468 8.468c4.32 0 8.1-3.132 8.1-8.468 0-.468-.072-.936-.18-1.404l-.206-.064z" fill="#4285F4"/>
                  <path d="M1.982 10.557a8.466 8.466 0 004.14 5.318l2.868-2.376c-1.272-.384-2.34-1.26-2.88-2.46L1.982 10.557z" fill="#34A853"/>
                  <path d="M1.126 5.427A8.34 8.34 0 00.694 9.033c0 1.332.324 2.58.864 3.696l4.128-.48c-.36-.744-.564-1.56-.564-2.424 0-.864.204-1.68.564-2.424L1.126 5.427z" fill="#FBBC05"/>
                  <path d="M9.162 1.125c2.16 0 4.104.804 5.592 2.124l2.592-2.592A8.808 8.808 0 009.162.001a8.466 8.466 0 00-7.18 3.93l4.56 1.974A4.956 4.956 0 019.162 3.06V1.125z" fill="#EA4335"/>
                </svg>
              </button>
              <button class="icon-btn" type="button" @click="loginWithApple">
                <svg class="icon-btn-svg" viewBox="0 0 18 18" fill="none">
                  <path d="M14.94 6.3c-.08.06-1.52.87-1.52 2.66 0 2.07 1.82 2.8 1.88 2.82-.01.05-.29 1.01-0.97 1.99-.58.85-1.19 1.7-2.12 1.7-.93 0-1.17-.54-2.24-.54-1.05 0-1.42.56-2.29.56-.87 0-1.49-.79-2.18-1.75C4.39 12.26 3.7 10.42 3.7 8.67c0-2.8 1.82-4.28 3.62-4.28.95 0 1.75.63 2.35.63.58 0 1.48-.67 2.57-.67.41 0 1.91.04 2.7 1.95zm-3.19-2.58c.44-.52.75-1.25.75-1.97 0-.1-.01-.2-.03-.28-.71.03-1.56.48-2.07 1.06-.4.45-.77 1.18-.77 1.92 0 .11.02.22.03.26.05.01.14.02.22.02.64 0 1.44-.43 1.87-1.01z" fill="#000"/>
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
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useUserStore } from '@/store/user'
import { showToast } from '@/utils/ionicFeedback'
import { validEmail } from '@/utils/validate'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({
  email: '',
  password: ''
})
const loading = ref(false)

function goToRegister() {
  router.push('/register')
}

async function onLogin() {
  if (!form.email?.trim()) {
    showToast('Please enter email')
    return
  }
  if (!validEmail(form.email)) {
    showToast('Please enter a valid email')
    return
  }
  if (!form.password) {
    showToast('Please enter password')
    return
  }
  if (form.password.length < 6) {
    showToast('Password must be at least 6 characters')
    return
  }

  loading.value = true
  try {
    await userStore.login(form)
    await userStore.getInfo()
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
    showToast('Login successful')
  } catch (error) {
    const msg = error.response?.data?.error || error.message || 'Login failed'
    showToast(msg)
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}

function onForgotPassword() {
  // TODO: navigate to forgot password page
}

function loginWithGoogle() {
  // TODO: implement Google login
}

function loginWithApple() {
  // TODO: implement Apple login
}
</script>

<style scoped>
.login-page {
  --background: #ffffff;
}

.login-container {
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

.login-content {
  position: relative;
  z-index: 1;
  padding: 0 22px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 146px);
  padding-bottom: 40px;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 25px;
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
}

.link {
  color: rgba(255, 141, 40, 0.75);
  font-weight: 600;
  cursor: pointer;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: #6E6A7C;
}

.field-input {
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid rgba(255, 141, 40, 0.75);
  border-radius: 10px;
  background: transparent;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.72);
  outline: none;
  box-shadow: 0 3px 4px 1px rgba(0, 0, 0, 0.16);
  box-sizing: border-box;
}

.field-input::placeholder {
  color: rgba(0, 0, 0, 0.3);
}

.field-input:focus {
  border-color: rgba(255, 141, 40, 1);
}

.bottom-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 19px;
  margin-top: 38px;
  padding: 0 16px;
}

.terms-text {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.72);
  text-align: center;
  margin: 0;
}

.terms-link {
  color: rgba(255, 141, 40, 0.75);
  font-weight: 600;
  cursor: pointer;
}

.login-button {
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

.login-button:active {
  transform: scale(0.97);
}

.forgot-text {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.72);
  text-align: center;
  cursor: pointer;
  margin: 0;
}

.alt-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  margin-top: 22px;
  padding: 0 16px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
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
  gap: 15px;
  justify-content: center;
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
  background: rgba(255, 141, 40, 0.05);
}

.icon-btn-svg {
  width: 18px;
  height: 18px;
}
</style>
