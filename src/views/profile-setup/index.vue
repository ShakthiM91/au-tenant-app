<template>
  <ion-page class="profile-setup-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="setup-container">
        <div class="pattern-bg">
          <div class="pattern-grid">
            <div v-for="n in 42" :key="n" class="pattern-cell" />
          </div>
          <div class="pattern-gradient-line" />
          <div class="pattern-fade-left" />
          <div class="pattern-fade-bottom" />
          <div class="pattern-fade-top" />
        </div>

        <div class="setup-content">
          <div class="header-section">
            <h1 class="heading">Tell us a bit about you!</h1>
            <p class="subtitle">We'd be thrilled to get to know you better.</p>
          </div>

          <form class="form-section" @submit.prevent="onSubmit">
            <div class="field-group">
              <label class="field-label">When can we celebrate your birthday with you?</label>
              <div class="date-labels">
                <span class="date-col-label date-year-label">Year</span>
                <span class="date-col-label date-month-label">Month</span>
                <span class="date-col-label date-day-label">Day</span>
              </div>
              <div class="date-inputs">
                <input
                  v-model="form.year"
                  type="text"
                  inputmode="numeric"
                  maxlength="4"
                  class="date-input date-year"
                  placeholder="YYYY"
                />
                <input
                  v-model="form.month"
                  type="text"
                  inputmode="numeric"
                  maxlength="2"
                  class="date-input date-month"
                  placeholder="MM"
                />
                <input
                  v-model="form.day"
                  type="text"
                  inputmode="numeric"
                  maxlength="2"
                  class="date-input date-day"
                  placeholder="DD"
                />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">We'd like to know how you identify yourself</label>
              <div class="select-wrapper">
                <select v-model="form.gender" class="field-select">
                  <option value="" disabled>Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="rather-not-say">I'd rather not say</option>
                </select>
                <svg class="select-caret" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11l3 3 3-3" stroke="#A8A8A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Which corner of the earth you're from?</label>
              <div class="select-wrapper">
                <select v-model="form.country" class="field-select">
                  <option value="" disabled>Select country</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="au">Australia</option>
                  <option value="ca">Canada</option>
                  <option value="other">Other</option>
                </select>
                <svg class="select-caret" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11l3 3 3-3" stroke="#A8A8A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">We'd like to know who referred you to us?</label>
              <div class="referral-wrapper">
                <input
                  v-model="form.referral"
                  type="text"
                  class="field-input"
                  placeholder="Referral code"
                />
                <svg class="scan-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M2 9V6a4 4 0 014-4h3" stroke="rgba(0,0,0,0.72)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 2h3a4 4 0 014 4v3" stroke="rgba(0,0,0,0.72)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 16v2a4 4 0 01-4 4h-2" stroke="rgba(0,0,0,0.72)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 15v3a4 4 0 004 4h3" stroke="rgba(0,0,0,0.72)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M5 12h14" stroke="rgba(0,0,0,0.72)" stroke-width="1.5" stroke-linecap="round"/>
                  <rect x="7" y="6.5" width="10" height="11" rx="1" stroke="rgba(0,0,0,0.72)" stroke-width="1.5"/>
                </svg>
              </div>
            </div>
          </form>

          <div class="bottom-section">
            <button class="done-button" @click="onSubmit">All Done !</button>
            <p class="privacy-text">
              We prioritize your privacy and security. We strive to protect your information and keep your data safe at every level.
            </p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'

const router = useRouter()

const form = reactive({
  year: '',
  month: '',
  day: '',
  gender: '',
  country: '',
  referral: ''
})

function onSubmit() {
  // TODO: implement profile save logic
  router.push('/welcome')
}
</script>

<style scoped>
.profile-setup-page {
  --background: #ffffff;
}

.setup-container {
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

.setup-content {
  position: relative;
  z-index: 1;
  padding: 0 38px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 127px);
  padding-bottom: 40px;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
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

.form-section {
  display: flex;
  flex-direction: column;
  gap: 25px;
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

.date-labels {
  display: flex;
  gap: 10px;
  padding: 0 11px;
}

.date-col-label {
  font-size: 10px;
  color: #6E6A7C;
  text-align: center;
}

.date-year-label {
  width: 94px;
}

.date-month-label {
  width: 56px;
}

.date-day-label {
  width: 56px;
}

.date-inputs {
  display: flex;
  gap: 10px;
  padding: 0 11px;
}

.date-input {
  height: 38px;
  border: 1px solid rgba(255, 141, 40, 0.75);
  border-radius: 10px;
  background: transparent;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.72);
  text-align: center;
  outline: none;
  box-shadow: 0 3px 4px 1px rgba(0, 0, 0, 0.16);
  box-sizing: border-box;
}

.date-input::placeholder {
  color: rgba(0, 0, 0, 0.3);
}

.date-input:focus {
  border-color: rgba(255, 141, 40, 1);
}

.date-year {
  width: 94px;
}

.date-month {
  width: 56px;
}

.date-day {
  width: 56px;
}

.select-wrapper {
  position: relative;
  margin: 0 11px;
}

.field-select {
  width: 100%;
  height: 38px;
  padding: 0 36px 0 10px;
  border: 1px solid rgba(255, 141, 40, 0.75);
  border-radius: 10px;
  background: transparent;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.72);
  outline: none;
  box-shadow: 0 3px 4px 1px rgba(0, 0, 0, 0.16);
  box-sizing: border-box;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.field-select:focus {
  border-color: rgba(255, 141, 40, 1);
}

.select-caret {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  pointer-events: none;
}

.referral-wrapper {
  position: relative;
  margin: 0 11px;
}

.field-input {
  width: 100%;
  height: 38px;
  padding: 0 40px 0 10px;
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

.scan-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.bottom-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 40px;
}

.done-button {
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

.done-button:active {
  transform: scale(0.97);
}

.privacy-text {
  font-size: 10px;
  color: #6E6A7C;
  text-align: center;
  line-height: 1.5;
  margin: 0;
  padding: 0 10px;
}
</style>
