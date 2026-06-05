<template>
  <ion-page class="survey-page">
    <ion-content :fullscreen="true" :scroll-y="true" class="survey-ion-content">
      <div class="survey-viewport">
        <div v-if="loading" class="state-block">
          <div class="spinner" />
          <p>Loading survey…</p>
        </div>

        <div v-else-if="loadError" class="state-block">
          <p class="error-text">{{ loadError }}</p>
          <button type="button" class="secondary-btn" @click="goHome">Go to home</button>
        </div>

        <div v-else-if="currentQuestion" class="survey-stage">
          <div class="survey-center">
            <QuestionHeader
              :number="questionNumber"
              :text="currentQuestion.question_text"
            />

            <div class="survey-answer-group">
              <TextAnswer
                v-if="isText"
                v-model="textValue"
                placeholder="Your answer"
                :disabled="submitting"
                @submit="handleContinue"
              />
              <DateAnswer
                v-else-if="isDate"
                v-model="textValue"
                :disabled="submitting"
              />
              <ChoiceOptions
                v-else
                :options="currentQuestion.options || []"
                :selected-ids="selectedOptionIds"
                :disabled="submitting"
                @select="onSelectOption"
              />

              <SurveyActions
                :show-continue="showContinueButton"
                :show-skip-step="showSkipThisStep"
                :validation-error="validationError"
                :disabled="submitting"
                @continue="handleContinue"
                @skip-step="handleSkipStep"
              />
            </div>
          </div>

          <footer v-if="showSkipPersonalization" class="survey-footer">
            <button
              type="button"
              class="footer-skip-btn"
              :disabled="submitting"
              @click="handleSkipPersonalization"
            >
              Skip the personalization →
            </button>
          </footer>
        </div>
      </div>

      <SubmittingOverlay :show="submitting" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useOnboardingSurvey } from '@/composables/useOnboardingSurvey'
import { HOME_ROUTE } from '@/utils/onboardingSurvey/constants'
import QuestionHeader from './components/QuestionHeader.vue'
import ChoiceOptions from './components/ChoiceOptions.vue'
import TextAnswer from './components/TextAnswer.vue'
import DateAnswer from './components/DateAnswer.vue'
import SurveyActions from './components/SurveyActions.vue'
import SubmittingOverlay from './components/SubmittingOverlay.vue'

const router = useRouter()

const {
  loading,
  submitting,
  loadError,
  validationError,
  currentQuestion,
  questionNumber,
  showSkipPersonalization,
  showSkipThisStep,
  isText,
  isDate,
  isFreeform,
  isMultiSelect,
  selectedOptionIds,
  textValue,
  loadSurvey,
  toggleOption,
  onContinue,
  skipThisStep,
  skipPersonalization
} = useOnboardingSurvey()

const showContinueButton = computed(
  () => isFreeform.value || isMultiSelect.value
)

onMounted(() => {
  loadSurvey()
})

function goHome() {
  router.replace(HOME_ROUTE)
}

async function navigateIfRoute(route) {
  if (route) await router.replace(route)
}

async function handleContinue() {
  const route = await onContinue()
  await navigateIfRoute(route)
}

async function onSelectOption(optionId) {
  toggleOption(optionId)
  if (!isMultiSelect.value) {
    const route = await onContinue()
    await navigateIfRoute(route)
  }
}

async function handleSkipStep() {
  const route = await skipThisStep()
  await navigateIfRoute(route)
}

async function handleSkipPersonalization() {
  const route = await skipPersonalization()
  await navigateIfRoute(route)
}
</script>

<style scoped>
.survey-page {
  --background: #ffffff;
}

.survey-ion-content {
  --background: #ffffff;
  --padding-top: 0;
  --padding-bottom: 0;
  --offset-top: 0;
  --offset-bottom: 0;
}

.survey-ion-content::part(scroll) {
  height: 100%;
}

.survey-viewport {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: var(--au-app-height, 100dvh);
  box-sizing: border-box;
  padding:
    env(safe-area-inset-top, 0px)
    env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px)
    env(safe-area-inset-left, 0px);
  background: #ffffff;
}

.survey-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.survey-center {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  width: 100%;
  max-width: 320px;
  margin: auto;
  padding: 0 24px;
  box-sizing: border-box;
}

.survey-answer-group {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  align-self: stretch;
  gap: 20px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.survey-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 16px 24px 8px;
}

.footer-skip-btn {
  border: none;
  background: none;
  padding: 8px 4px;
  font-size: 13px;
  color: rgba(110, 106, 124, 0.75);
  cursor: pointer;
}

.footer-skip-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.state-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  color: #6e6a7c;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 141, 40, 0.25);
  border-top-color: #ff8d28;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.error-text {
  text-align: center;
  margin: 0;
}

.secondary-btn {
  padding: 10px 20px;
  border: 1px solid rgba(255, 141, 40, 0.85);
  border-radius: 10px;
  background: #fff;
  color: #ff8d28;
  font-weight: 600;
  cursor: pointer;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
