import { clearAttachmentCache } from '@/api/attachment'
import { clearSurveyGateCache } from '@/utils/onboardingSurvey/resolveDestination'
import { clearBudgetSetupDraft } from '@/views/budgets/draftStore'

/** Module-level / in-memory caches that are not wiped by IndexedDB or storage clears alone. */
export function clearInMemoryAppCaches() {
  clearSurveyGateCache()
  clearBudgetSetupDraft()
  clearAttachmentCache()
}
