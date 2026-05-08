<template>
  <ion-page class="budget-plan-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <div class="page-header">
          <button type="button" class="back-btn" aria-label="Cancel" @click="onCancel">Cancel</button>
          <span class="page-title">Set planned amount</span>
          <button type="button" class="save-btn" :disabled="saving" @click="onSave">Save</button>
        </div>

        <p v-if="draft?.name" class="plan-hint">{{ draft.name }} · {{ draft.workspace_label }}</p>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent" />
        </div>

        <template v-else>
          <p v-if="childrenExceedParentWarning" class="warn-banner">{{ childrenExceedParentWarning }}</p>

          <section v-for="group in parentGroups" :key="group.parent.id" class="budget-card">
            <div class="card-head">
              <span class="card-title">{{ group.parent.name }}</span>
              <span class="card-sum">Σ {{ formatNum(groupSum(group)) }}</span>
            </div>
            <div class="card-rows">
              <template v-if="group.leaves.length">
                <div v-for="leaf in group.leaves" :key="leaf.id" class="amount-row">
                  <span class="grip" aria-hidden="true">
                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
                      <rect x="0" y="0" width="12" height="2.5" rx="1" fill="#A8A8A8" />
                      <rect x="0" y="4.5" width="12" height="4" rx="1" fill="#A8A8A8" />
                      <rect x="0" y="10.5" width="12" height="2.5" rx="1" fill="#A8A8A8" />
                    </svg>
                  </span>
                  <span class="leaf-name">{{ leaf.name }}</span>
                  <input
                    v-model="budgetByCategoryId[leaf.id].text"
                    type="text"
                    inputmode="decimal"
                    class="amount-input"
                    placeholder="0"
                    @blur="normalizeAmount(leaf.id)"
                  />
                </div>
              </template>
              <div v-else class="amount-row">
                <span class="grip" aria-hidden="true" />
                <span class="leaf-name">{{ group.parent.name }}</span>
                <input
                  v-model="budgetByCategoryId[group.parent.id].text"
                  type="text"
                  inputmode="decimal"
                  class="amount-input"
                  placeholder="0"
                  @blur="normalizeAmount(group.parent.id)"
                />
              </div>
            </div>
          </section>

          <div v-if="!parentGroups.length" class="empty-state">
            <p>No expense categories in this island.</p>
          </div>
        </template>
      </div>
      <div class="tab-spacer" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonSpinner } from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getCategoryTree, createBudget } from '@/api/accounting'
import { budgetSetupDraft, clearBudgetSetupDraft } from '@/views/budgets/draftStore'

const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const draft = ref(null)
const expenseTree = ref([])
/** category id -> { text } */
const budgetByCategoryId = reactive({})

function ensureRow(id) {
  const n = Number(id)
  if (!budgetByCategoryId[n]) budgetByCategoryId[n] = { text: '' }
  return budgetByCategoryId[n]
}

function parseAmount(v) {
  const s = String(v ?? '')
    .replace(/,/g, '')
    .trim()
  const x = parseFloat(s)
  return Number.isFinite(x) ? x : 0
}

function normalizeAmount(id) {
  const row = ensureRow(id)
  const n = parseAmount(row.text)
  row.text = n > 0 ? String(n) : ''
}

/** Collect deepest categories under a root (for budget lines). */
function collectLeaves(node) {
  if (!node) return []
  const kids = Array.isArray(node.children) ? node.children : []
  if (!kids.length) return [node]
  return kids.flatMap(collectLeaves)
}

const parentGroups = computed(() => {
  const roots = expenseTree.value || []
  return roots.map((parent) => ({
    parent,
    leaves: collectLeaves(parent).filter((n) => Number(n.id) !== Number(parent.id))
  }))
})

function groupSum(group) {
  if (group.leaves.length) {
    return group.leaves.reduce((s, leaf) => s + parseAmount(budgetByCategoryId[leaf.id]?.text), 0)
  }
  return parseAmount(budgetByCategoryId[group.parent.id]?.text)
}

const childrenExceedParentWarning = computed(() => {
  const msgs = []
  for (const g of parentGroups.value) {
    if (!g.leaves.length) continue
    const pst = budgetByCategoryId[g.parent.id]
    const pb = parseAmount(pst?.text)
    if (pb <= 0) continue
    const sum = g.leaves.reduce((s, leaf) => s + parseAmount(budgetByCategoryId[leaf.id]?.text), 0)
    if (sum > pb) {
      msgs.push(`Under "${g.parent.name}", sub-categories total ${sum.toFixed(2)} vs parent ${pb.toFixed(2)}.`)
    }
  }
  return msgs.length ? msgs.join(' ') : ''
})

function formatNum(n) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n || 0)
}

function initRowsFromTree(nodes) {
  for (const root of nodes || []) {
    const leaves = collectLeaves(root)
    const targets = leaves.length ? leaves : [root]
    for (const t of targets) {
      ensureRow(t.id)
    }
    if (leaves.length) ensureRow(root.id)
  }
}

onMounted(async () => {
  draft.value = budgetSetupDraft.value
  if (!draft.value?.workspace_id) {
    showToast('Start from Set up a Budget')
    clearBudgetSetupDraft()
    router.replace({ name: 'Categories' })
    return
  }
  loading.value = true
  try {
    const res = await getCategoryTree('expense', draft.value.workspace_id)
    const data = res?.data ?? (res?.success ? res?.data : []) ?? []
    expenseTree.value = Array.isArray(data) ? data : []
    initRowsFromTree(expenseTree.value)
  } catch {
    showToast('Failed to load categories')
    expenseTree.value = []
  } finally {
    loading.value = false
  }
})

function onCancel() {
  clearBudgetSetupDraft()
  router.back()
}

function buildItemsForApi() {
  const out = []
  for (const g of parentGroups.value) {
    if (g.leaves.length) {
      for (const leaf of g.leaves) {
        const amt = parseAmount(budgetByCategoryId[leaf.id]?.text)
        if (amt > 0) out.push({ category_id: Number(leaf.id), amount: amt, is_divertable: false })
      }
      const parentAmt = parseAmount(budgetByCategoryId[g.parent.id]?.text)
      if (parentAmt > 0) out.push({ category_id: Number(g.parent.id), amount: parentAmt, is_divertable: false })
    } else {
      const amt = parseAmount(budgetByCategoryId[g.parent.id]?.text)
      if (amt > 0) out.push({ category_id: Number(g.parent.id), amount: amt, is_divertable: false })
    }
  }
  return out
}

async function onSave() {
  if (!draft.value) {
    showToast('Nothing to save')
    return
  }
  const items = buildItemsForApi()
  if (!items.length) {
    showToast('Enter at least one planned amount')
    return
  }
  saving.value = true
  try {
    const payload = {
      workspace_id: draft.value.workspace_id,
      name: draft.value.name,
      period_type: draft.value.period_type,
      start_date: draft.value.start_date,
      end_date: draft.value.end_date,
      currency: draft.value.currency || 'USD',
      is_recurring: draft.value.is_recurring,
      status: 'active',
      items
    }
    const res = await createBudget(payload)
    const id = res?.id ?? res?.data?.id ?? res?.data?.data?.id
    clearBudgetSetupDraft()
    if (!id) {
      showToast('Budget created')
      router.replace({ name: 'Categories' })
      return
    }
    showToast('Budget created')
    router.replace({
      name: 'BudgetOverview',
      params: { id: String(id) },
      query: {
        workspace_id: String(draft.value.workspace_id),
        workspace_name: draft.value.workspace_label || ''
      }
    })
  } catch (e) {
    showToast(e?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.budget-plan-page {
  --background: #f5f5f7;
}

.budget-plan-page ion-content {
  --background: #f5f5f7;
}

.page-container {
  padding: 0 16px;
  padding-top: env(safe-area-inset-top, 20px);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0 12px;
}

.back-btn,
.save-btn {
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  color: #ff8d28;
  -webkit-tap-highlight-color: transparent;
}

.page-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #000;
}

.plan-hint {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  margin: 0 0 14px;
  text-align: center;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.warn-banner {
  background: rgba(255, 141, 40, 0.12);
  color: #8a4a00;
  font-size: 13px;
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 14px;
}

.budget-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 14px;
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #ff8d28;
}

.card-sum {
  font-size: 15px;
  font-weight: 600;
  color: #ff8d28;
}

.card-rows {
  padding: 0 12px 12px;
}

.amount-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px;
  border-top: 1px solid #f0f0f0;
}

.amount-row:first-child {
  border-top: none;
}

.grip {
  flex-shrink: 0;
  opacity: 0.85;
}

.leaf-name {
  flex: 1;
  font-size: 15px;
  color: #1a1a2e;
}

.amount-input {
  width: 112px;
  text-align: right;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a2e;
}

.amount-input:focus {
  outline: none;
  border-color: #ff8d28;
  box-shadow: 0 0 0 1px #ff8d28;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #a7a7a7;
}

.tab-spacer {
  height: 80px;
}
</style>
