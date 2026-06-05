export function isTreeSurvey(survey) {
  return survey?.survey_mode === 'decision_tree'
}

export function isTextQuestion(question) {
  return question?.input_type === 'text'
}

export function isDateQuestion(question) {
  return question?.input_type === 'date'
}

export function isFreeformQuestion(question) {
  return isTextQuestion(question) || isDateQuestion(question)
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDateAnswer(value) {
  const raw = String(value || '').trim()
  if (!ISO_DATE_RE.test(raw)) return false
  const d = new Date(`${raw}T00:00:00.000Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === raw
}

export function sortQuestions(questions) {
  return [...(questions || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

export function questionsById(questions) {
  return new Map((questions || []).map((q) => [q.id, q]))
}

export function canSkipPersonalization(survey, currentQuestion, byId) {
  if (!survey?.skip_allowed_from_question_id || !currentQuestion) return false
  const skipQ = byId.get(Number(survey.skip_allowed_from_question_id))
  if (!skipQ) return false
  const skipOrder = skipQ.sort_order ?? 0
  const atOrder = currentQuestion.sort_order ?? 0
  return atOrder >= skipOrder
}

export function isQuestionRequired(question) {
  if (!question) return true
  const v = question.is_required
  if (v === false || v === 0 || v === '0') return false
  return true
}

export function canSkipThisStep(question) {
  return question && !isQuestionRequired(question)
}

export function durationSince(shownAt) {
  if (!shownAt) return 0
  return Math.max(0, Date.now() - shownAt)
}

export function buildAnswersPayload(answerMap) {
  const rows = []
  for (const [questionId, entry] of answerMap.entries()) {
    const row = {
      question_id: Number(questionId),
      duration_ms: entry.durationMs ?? 0
    }
    if (entry.textValue != null && String(entry.textValue).trim() !== '') {
      row.text_value = String(entry.textValue).trim()
    } else if (entry.optionIds?.length === 1) {
      row.option_id = entry.optionIds[0]
    } else if (entry.optionIds?.length > 1) {
      row.option_ids = [...entry.optionIds]
    }
    rows.push(row)
  }
  return rows
}
