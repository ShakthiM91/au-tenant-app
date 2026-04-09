<template>
  <ion-page class="verify-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="verify-container">
        <div class="pattern-bg">
          <div class="pattern-grid">
            <div v-for="n in 42" :key="n" class="pattern-cell" />
          </div>
          <div class="pattern-gradient-line" />
          <div class="pattern-fade-left" />
          <div class="pattern-fade-bottom" />
          <div class="pattern-fade-top" />
        </div>

        <div class="verify-content">
          <div class="header-section">
            <h1 class="heading">You're almost there !</h1>
            <p class="subtitle">
              Please enter the 6 digit code sent to your email
              <span class="email-highlight">{{ email }}</span>
              for verification
            </p>
          </div>

          <div class="otp-section">
            <div class="otp-row">
              <div class="otp-inputs">
                <input
                  v-for="(_, idx) in otp"
                  :key="idx"
                  ref="otpRefs"
                  v-model="otp[idx]"
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  class="otp-box"
                  @input="onOtpInput(idx)"
                  @keydown="onOtpKeydown($event, idx)"
                  @paste.prevent="onPaste"
                />
              </div>
              <button class="paste-btn" type="button" @click="onPaste">Paste</button>
            </div>
          </div>

          <div class="action-section">
            <button class="verify-button" @click="onVerify">Verify</button>

            <div class="resend-section">
              <p class="resend-text">
                Didn't receive the code?
                <span class="resend-link" :class="{ disabled: countdown > 0 }" @click="onResend">Resend Again</span>
              </p>
              <p v-if="countdown > 0" class="timer-text">
                Request a new code in {{ formattedCountdown }} seconds
              </p>
            </div>
          </div>

          <div class="alt-register">
            <div class="divider">
              <span class="divider-line" />
              <span class="divider-text">or Register with</span>
              <span class="divider-line" />
            </div>

            <div class="login-icons">
              <button class="icon-btn" type="button" @click="goToLogin">
                <img class="icon-btn-svg" src="/brands/google-g.png" alt="" width="18" height="18" />
              </button>
              <button class="icon-btn" type="button" @click="goToRegister">
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
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'

const router = useRouter()
const route = useRoute()
const email = computed(() => route.query.email || 'your@email.com')

const otp = reactive(['', '', '', '', '', ''])
const otpRefs = ref([])

const countdown = ref(36)
let timer = null

const formattedCountdown = computed(() => {
  const mins = Math.floor(countdown.value / 60).toString().padStart(2, '0')
  const secs = (countdown.value % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
})

function startTimer() {
  clearInterval(timer)
  countdown.value = 36
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(timer)
    }
  }, 1000)
}

function onOtpInput(idx) {
  if (otp[idx] && idx < 5) {
    nextTick(() => otpRefs.value[idx + 1]?.focus())
  }
}

function onOtpKeydown(e, idx) {
  if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
    nextTick(() => otpRefs.value[idx - 1]?.focus())
  }
}

async function onPaste(e) {
  let text = ''
  if (e?.clipboardData) {
    text = e.clipboardData.getData('text')
  } else {
    try {
      text = await navigator.clipboard.readText()
    } catch { return }
  }
  const digits = text.replace(/\D/g, '').slice(0, 6)
  for (let i = 0; i < 6; i++) {
    otp[i] = digits[i] || ''
  }
  const focusIdx = Math.min(digits.length, 5)
  nextTick(() => otpRefs.value[focusIdx]?.focus())
}

function onVerify() {
  // TODO: implement verification logic
  router.push('/profile-setup')
}

function goToLogin() {
  router.push('/register')
}

function onResend() {
  if (countdown.value > 0) return
  // TODO: implement resend logic
  startTimer()
}

onMounted(() => startTimer())
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.verify-page {
  --background: #ffffff;
}

.verify-container {
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

.verify-content {
  position: relative;
  z-index: 1;
  padding: 0 38px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 212px);
  padding-bottom: 40px;
  display: flex;
  flex-direction: column;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 30px;
}

.heading {
  font-size: 24px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.72);
  margin: 0;
}

.subtitle {
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
  color: #6E6A7C;
  margin: 0;
}

.email-highlight {
  color: rgba(255, 141, 40, 0.85);
  font-weight: 600;
}

.otp-section {
  margin-bottom: 24px;
}

.otp-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.otp-inputs {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.otp-box {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 141, 40, 0.75);
  border-radius: 10px;
  background: transparent;
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.72);
  text-align: center;
  outline: none;
  box-shadow: 0 3px 4px 1px rgba(0, 0, 0, 0.16);
  box-sizing: border-box;
  -webkit-appearance: none;
}

.otp-box:focus {
  border-color: rgba(255, 141, 40, 1);
}

.paste-btn {
  align-self: flex-end;
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: #6E6A7C;
  cursor: pointer;
  padding: 0;
}

.action-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 36px;
  margin-bottom: 100px;
}

.verify-button {
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

.verify-button:active {
  transform: scale(0.97);
}

.resend-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
}

.resend-text {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.72);
  margin: 0;
}

.resend-link {
  color: rgba(255, 141, 40, 0.85);
  font-weight: 600;
  cursor: pointer;
}

.resend-link.disabled {
  opacity: 0.5;
  cursor: default;
}

.timer-text {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.72);
  margin: 0;
}

.alt-register {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  margin-top: auto;
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
  object-fit: contain;
}
</style>
