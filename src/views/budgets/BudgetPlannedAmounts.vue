<template>
  <ion-page class="budget-plan-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <div class="page-header">
          <button type="button" class="back-btn" aria-label="Cancel" @click="onCancel">Cancel</button>
          <span class="page-title">{{ isEditMode ? 'Edit planned amount' : 'Set planned amount' }}</span>
          <button type="button" class="save-btn" :disabled="saving" @click="onSave">Save</button>
        </div>

        <p v-if="draft?.name" class="plan-hint">{{ draft.name }} · {{ planWorkspaceHint }}</p>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent" />
        </div>

        <template v-else>
          <p v-if="childrenExceedParentWarning" class="warn-banner">{{ childrenExceedParentWarning }}</p>

          <section v-for="group in parentGroups" :key="group.parent.id" class="budget-card">
            <div class="card-head" :class="{ 'card-head--has-children': group.leaves.length }">
              <span class="card-title">{{ group.parent.name }}</span>
              <div class="card-head-aside">
                <div class="amount-stepper">
                  <button
                    type="button"
                    class="amount-stepper__btn"
                    aria-label="Decrease by 500"
                    @click="adjustAmount(group.parent.id, -AMOUNT_STEP)"
                  >
                    −
                  </button>
                  <input
                    v-model="budgetByCategoryId[group.parent.id].text"
                    type="text"
                    inputmode="decimal"
                    class="amount-input amount-input--head"
                    placeholder="0"
                    @blur="normalizeAmount(group.parent.id)"
                  />
                  <button
                    type="button"
                    class="amount-stepper__btn"
                    aria-label="Increase by 500"
                    @click="adjustAmount(group.parent.id, AMOUNT_STEP)"
                  >
                    +
                  </button>
                </div>
                <span v-if="group.leaves.length" class="card-sum-label">Σ {{ formatNum(groupSum(group)) }}</span>
              </div>
            </div>
            <div v-if="group.leaves.length" class="card-rows">
              <div v-for="leaf in group.leaves" :key="leaf.id" class="amount-row">
                <span class="grip" aria-hidden="true">
                  <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
                    <rect x="0" y="0" width="12" height="2.5" rx="1" fill="#A8A8A8" />
                    <rect x="0" y="4.5" width="12" height="4" rx="1" fill="#A8A8A8" />
                    <rect x="0" y="10.5" width="12" height="2.5" rx="1" fill="#A8A8A8" />
                  </svg>
                </span>
                <span class="leaf-name">{{ leaf.name }}</span>
                <div class="amount-stepper">
                  <button
                    type="button"
                    class="amount-stepper__btn"
                    aria-label="Decrease by 500"
                    @click="adjustAmount(leaf.id, -AMOUNT_STEP)"
                  >
                    −
                  </button>
                  <input
                    v-model="budgetByCategoryId[leaf.id].text"
                    type="text"
                    inputmode="decimal"
                    class="amount-input"
                    placeholder="0"
                    @blur="normalizeAmount(leaf.id)"
                  />
                  <button
                    type="button"
                    class="amount-stepper__btn"
                    aria-label="Increase by 500"
                    @click="adjustAmount(leaf.id, AMOUNT_STEP)"
                  >
                    +
                  </button>
                </div>
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
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonSpinner } from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { getApiErrorMessage } from '@/utils/apiError'
import { getCategoryTree, getBudgetById, createBudget, updateBudget } from '@/api/accounting'
import { budgetSetupDraft, clearBudgetSetupDraft } from '@/views/budgets/draftStore'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const draft = ref(null)
const editBudgetId = ref(null)
const expenseTree = ref([])
/** category id -> { text } */
const budgetByCategoryId = reactive({})

const AMOUNT_STEP = 500

const isEditMode = computed(() => editBudgetId.value != null)

const planWorkspaceHint = computed(() => formatWorkspaceIslandLabel(draft.value?.workspace_label))

function formatWorkspaceIslandLabel(label) {
  const text = String(label || '').trim()
  if (!text) return 'island'
  if (/island/i.test(text)) return text
  return `${text} island`
}

function workspaceLabelFromQuery() {
  const q = route.query.workspace_name
  if (q == null || q === '') return ''
  return typeof q === 'string' ? decodeURIComponent(q) : String(q)
}

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

function adjustAmount(id, delta) {
  const row = ensureRow(id)
  const next = Math.max(0, parseAmount(row.text) + delta)
  row.text = next > 0 ? String(next) : ''
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
  const parentAmt = parseAmount(budgetByCategoryId[group.parent.id]?.text)
  if (!group.leaves.length) return parentAmt
  return (
    parentAmt +
    group.leaves.reduce((s, leaf) => s + parseAmount(budgetByCategoryId[leaf.id]?.text), 0)
  )
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

function initRowsFromItems(items) {
  for (const item of items || []) {
    if (item?.category_id == null) continue
    const row = ensureRow(item.category_id)
    const amt = parseFloat(item.amount) || 0
    row.text = amt > 0 ? String(amt) : ''
  }
}

async function loadCreateMode() {
  draft.value = budgetSetupDraft.value
  if (!draft.value?.workspace_id) {
    showToast('Start from Set up a Budget')
    clearBudgetSetupDraft()
    router.replace({ name: 'Categories' })
    return
  }
  const res = await getCategoryTree('expense', draft.value.workspace_id)
  const data = res?.data ?? (res?.success ? res?.data : []) ?? []
  expenseTree.value = Array.isArray(data) ? data : []
  initRowsFromTree(expenseTree.value)
}

async function loadEditMode(budgetId) {
  const res = await getBudgetById(budgetId)
  const plan = res?.data
  if (!plan?.workspace_id) {
    showToast('Budget not found')
    router.back()
    return
  }
  editBudgetId.value = budgetId
  draft.value = {
    name: plan.name,
    workspace_id: plan.workspace_id,
    workspace_label: workspaceLabelFromQuery() || plan.name || ''
  }
  const treeRes = await getCategoryTree('expense', plan.workspace_id)
  const data = treeRes?.data ?? (treeRes?.success ? treeRes?.data : []) ?? []
  expenseTree.value = Array.isArray(data) ? data : []
  initRowsFromTree(expenseTree.value)
  initRowsFromItems(plan.items)
}

onMounted(async () => {
  loading.value = true
  try {
    const budgetId = route.query.budget_id
    if (budgetId) {
      await loadEditMode(budgetId)
    } else {
      await loadCreateMode()
    }
  } catch {
    showToast('Failed to load categories')
    expenseTree.value = []
  } finally {
    loading.value = false
  }
})

function onCancel() {
  if (isEditMode.value) {
    router.back()
    return
  }
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
    if (isEditMode.value) {
      await updateBudget(editBudgetId.value, { items })
      showToast('Planned amounts updated')
      router.back()
      return
    }

    const payload = {
      workspace_id: draft.value.workspace_id,
      name: draft.value.name,
      period_type: draft.value.period_type,
      start_date: draft.value.start_date,
      end_date: draft.value.end_date,
      currency: draft.value.currency || 'USD',
      is_recurring: draft.value.is_recurring,
      status: 'draft',
      items
    }
    const res = await createBudget(payload)
    const id = res?.id ?? res?.data?.id ?? res?.data?.data?.id
    const wsId = draft.value.workspace_id
    const wsLabel = draft.value.workspace_label || ''
    clearBudgetSetupDraft()
    if (!id) {
      showToast('Budget saved as draft')
      router.replace({ name: 'BudgetManagement', query: { workspace_id: String(wsId), workspace_name: wsLabel } })
      return
    }
    showToast('Budget saved as draft')
    router.replace({
      name: 'BudgetOverview',
      params: { id: String(id) },
      query: {
        workspace_id: String(wsId),
        workspace_name: wsLabel
      }
    })
  } catch (e) {
    showToast(getApiErrorMessage(e, 'Failed to save'))
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
  gap: 12px;
  padding: 14px 16px 12px;
}

.card-head--has-children {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.card-title {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: 700;
  color: #ff8d28;
}

.card-head-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.card-sum-label {
  font-size: 13px;
  font-weight: 600;
  color: #ff8d28;
  white-space: nowrap;
}

.amount-input--head {
  width: 72px;
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
  min-width: 0;
  font-size: 15px;
  color: #1a1a2e;
}

.amount-stepper {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.amount-stepper__btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid #ff8d28;
  background: #fff;
  color: #ff8d28;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.amount-stepper__btn:active {
  background: rgba(255, 141, 40, 0.1);
}

.amount-input {
  width: 72px;
  text-align: right;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 8px;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a2e;
  flex-shrink: 0;
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
