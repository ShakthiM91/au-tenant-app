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
                <img class="icon-btn-svg" src="/brands/google-g.png" alt="" width="18" height="18" />
              </button>
              <button class="icon-btn" type="button" @click="loginWithApple">
                <img class="icon-btn-svg" src="/brands/apple.svg" alt="" width="18" height="18" />
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
  object-fit: contain;
}
</style>
