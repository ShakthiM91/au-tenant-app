import { ref, computed, shallowRef } from 'vue'
import { getOnboardingSurvey, submitOnboardingResponse } from '@/api/onboarding'
import { HOME_ROUTE, ONBOARDING_ROUTE, SURVEY_PROCESSING_ROUTE } from '@/utils/onboardingSurvey/constants'
import { clearSurveyGateCache, isPostRegisterFlow, markSurveyGatePassed } from '@/utils/onboardingSurvey/resolveDestination'
import {
  isTreeSurvey,
  isTextQuestion,
  isDateQuestion,
  isFreeformQuestion,
  isValidDateAnswer,
  sortQuestions,
  questionsById,
  canSkipPersonalization,
  canSkipThisStep,
  isQuestionRequired,
  durationSince,
  buildAnswersPayload
} from '@/utils/onboardingSurvey/helpers'

export function useOnboardingSurvey() {
  const survey = shallowRef(null)
  const loading = ref(true)
  const submitting = ref(false)
  const loadError = ref('')
  const validationError = ref('')

  const answers = ref(new Map())
  const scoreIndex = ref(0)
  const treePathLength = ref(1)
  const currentTreeQuestionId = ref(null)

  const questionShownAt = ref(null)
  const selectedOptionIds = ref([])
  const textValue = ref('')

  const orderedQuestions = computed(() =>
    survey.value ? sortQuestions(survey.value.questions) : []
  )

  const questionMap = computed(() => questionsById(survey.value?.questions || []))

  const isTree = computed(() => isTreeSurvey(survey.value))

  const currentQuestion = computed(() => {
    if (!survey.value) return null
    if (isTree.value) {
      return currentTreeQuestionId.value
        ? questionMap.value.get(currentTreeQuestionId.value) ?? null
        : null
    }
    return orderedQuestions.value[scoreIndex.value] ?? null
  })

  const questionNumber = computed(() => {
    if (isTree.value) return treePathLength.value
    return scoreIndex.value + 1
  })

  const showSkipPersonalization = computed(() =>
    canSkipPersonalization(survey.value, currentQuestion.value, questionMap.value)
  )

  const showSkipThisStep = computed(() => canSkipThisStep(currentQuestion.value))

  const isText = computed(() => isTextQuestion(currentQuestion.value))

  const isDate = computed(() => isDateQuestion(currentQuestion.value))

  const isFreeform = computed(() => isFreeformQuestion(currentQuestion.value))

  const isMultiSelect = computed(
    () => !isFreeform.value && Boolean(currentQuestion.value?.allow_multiple)
  )

  async function loadSurvey() {
    loading.value = true
    loadError.value = ''
    try {
      const res = await getOnboardingSurvey()
      survey.value = res.data
      answers.value = new Map()
      scoreIndex.value = 0
      treePathLength.value = 1
      if (isTreeSurvey(res.data)) {
        currentTreeQuestionId.value = res.data.start_question_id
      } else {
        currentTreeQuestionId.value = null
      }
      resetQuestionInput()
    } catch (err) {
      loadError.value =
        err?.response?.data?.error || err?.message || 'Failed to load survey'
    } finally {
      loading.value = false
    }
  }

  function resetQuestionInput() {
    questionShownAt.value = Date.now()
    selectedOptionIds.value = []
    textValue.value = ''
    validationError.value = ''
  }

  function restoreInputFromAnswers(question) {
    const saved = answers.value.get(question.id)
    if (!saved) {
      resetQuestionInput()
      return
    }
    questionShownAt.value = Date.now()
    validationError.value = ''
    if (saved.textValue != null) {
      textValue.value = saved.textValue
      selectedOptionIds.value = []
    } else {
      textValue.value = ''
      selectedOptionIds.value = [...(saved.optionIds || [])]
    }
  }

  function toggleOption(optionId) {
    const id = Number(optionId)
    if (isMultiSelect.value) {
      const set = new Set(selectedOptionIds.value)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      selectedOptionIds.value = [...set]
    } else {
      selectedOptionIds.value = [id]
    }
    validationError.value = ''
  }

  function validateCurrentAnswer() {
    const q = currentQuestion.value
    if (!q) return false
    if (isFreeform.value) {
      const text = textValue.value?.trim()
      if (isQuestionRequired(q) && !text) {
        validationError.value = isDate.value ? 'Please enter a complete date' : 'Please enter your answer'
        return false
      }
      if (isDate.value && text && !isValidDateAnswer(text)) {
        validationError.value = 'Please enter a valid date'
        return false
      }
      return true
    }
    if (isQuestionRequired(q) && !selectedOptionIds.value.length) {
      validationError.value = 'Please select an answer'
      return false
    }
    return true
  }

  function saveCurrentAnswer() {
    const q = currentQuestion.value
    if (!q) return
    const durationMs = durationSince(questionShownAt.value)
    if (isFreeform.value) {
      const text = textValue.value?.trim()
      if (!text && !isQuestionRequired(q)) {
        answers.value.delete(q.id)
        return
      }
      answers.value.set(q.id, { textValue: text, durationMs })
    } else if (selectedOptionIds.value.length) {
      answers.value.set(q.id, {
        optionIds: [...selectedOptionIds.value],
        durationMs
      })
    }
  }

  async function submitResponse({ completionStatus, skippedAtQuestionId = null }) {
    submitting.value = true
    validationError.value = ''
    try {
      const payload = {
        answers: buildAnswersPayload(answers.value),
        completion_status: completionStatus
      }
      if (skippedAtQuestionId != null) {
        payload.skipped_at_question_id = skippedAtQuestionId
      }
      await submitOnboardingResponse(payload)
      clearSurveyGateCache()
      markSurveyGatePassed()
      if (isPostRegisterFlow()) {
        return completionStatus === 'completed' ? SURVEY_PROCESSING_ROUTE : ONBOARDING_ROUTE
      }
      return HOME_ROUTE
    } catch (err) {
      validationError.value =
        err?.response?.data?.error || err?.message || 'Failed to submit'
      return null
    } finally {
      submitting.value = false
    }
  }

  async function continueScore() {
    if (!validateCurrentAnswer()) return null
    saveCurrentAnswer()
    const nextIndex = scoreIndex.value + 1
    if (nextIndex >= orderedQuestions.value.length) {
      return submitResponse({ completionStatus: 'completed' })
    }
    scoreIndex.value = nextIndex
    const nextQ = orderedQuestions.value[nextIndex]
    if (answers.value.has(nextQ.id)) restoreInputFromAnswers(nextQ)
    else resetQuestionInput()
    return null
  }

  async function continueTree() {
    if (!validateCurrentAnswer()) return null
    saveCurrentAnswer()
    const q = currentQuestion.value
    const selectedId = selectedOptionIds.value[0]
    const option = (q.options || []).find((o) => o.id === selectedId)
    if (!option) {
      validationError.value = 'Please select an answer'
      return null
    }
    if (option.is_terminal) {
      return submitResponse({ completionStatus: 'completed' })
    }
    if (option.next_question_id) {
      currentTreeQuestionId.value = option.next_question_id
      treePathLength.value += 1
      const nextQ = questionMap.value.get(option.next_question_id)
      if (nextQ && answers.value.has(nextQ.id)) restoreInputFromAnswers(nextQ)
      else resetQuestionInput()
      return null
    }
    validationError.value = 'Invalid survey configuration'
    return null
  }

  async function onContinue() {
    if (isTree.value) return continueTree()
    return continueScore()
  }

  async function skipThisStep() {
    const q = currentQuestion.value
    if (!q || isQuestionRequired(q)) return null
    answers.value.delete(q.id)
    if (isTree.value) {
      validationError.value = 'This question cannot be skipped in a branching survey'
      return null
    }
    const nextIndex = scoreIndex.value + 1
    if (nextIndex >= orderedQuestions.value.length) {
      return submitResponse({ completionStatus: 'completed' })
    }
    scoreIndex.value = nextIndex
    resetQuestionInput()
    return null
  }

  async function skipPersonalization() {
    const q = currentQuestion.value
    if (!q || !showSkipPersonalization.value) return null
    saveCurrentAnswer()
    return submitResponse({
      completionStatus: 'skipped',
      skippedAtQuestionId: q.id
    })
  }

  return {
    survey,
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
  }
}
