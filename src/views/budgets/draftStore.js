import { ref } from 'vue'

/** In-memory handoff from BudgetSetupSheet → BudgetPlannedAmounts (avoid serializing in URL). */
export const budgetSetupDraft = ref(null)

export function clearBudgetSetupDraft() {
  budgetSetupDraft.value = null
}
