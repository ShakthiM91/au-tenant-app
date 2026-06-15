<template>
  <ion-modal
    ref="modalRef"
    class="budget-setup-modal"
    :is-open="isOpen"
    @didDismiss="onDismiss"
    :initial-breakpoint="initialBreakpoint"
    :breakpoints="breakpoints"
    :handle="true"
  >
    <ion-header class="drawer-ion-header budget-setup-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button class="budget-setup-cancel" fill="clear" @click="emitClose">Cancel</ion-button>
        </ion-buttons>
        <ion-title class="budget-setup-title">Set up a budget</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="saving || loadingPlan" class="ok-btn" fill="clear" @click="onOk">OK</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="budget-setup-content">
      <div class="adaptive-sheet-body">
        <div class="form-group form-group--stack">
          <label class="form-label">Budget name</label>
          <input v-model="form.name" type="text" class="form-input" placeholder="" autocomplete="off" />
        </div>

        <div class="form-group form-group--stack">
          <label class="form-label">Budget Island</label>
          <div class="island-row">
            <input
              type="text"
              class="form-input form-input--embedded"
              readonly
              :value="lockedWorkspaceLabel"
            />
            <span v-if="selectedBalance != null" class="bal-hint">Bal: {{ formatMoney(selectedBalance, form.currency) }}</span>
          </div>
        </div>

        <div class="form-group form-group--row">
          <label class="form-label form-label--row">Budget frequency</label>
          <div class="seg-track">
            <div class="seg-row">
              <button
                type="button"
                class="seg-btn"
                :class="{ active: !form.is_recurring }"
                @click="form.is_recurring = false"
              >
                One time
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: form.is_recurring }"
                @click="form.is_recurring = true"
              >
                Recurring
              </button>
            </div>
          </div>
        </div>

        <div class="form-group form-group--row">
          <label class="form-label form-label--row">Budget period</label>
          <div class="seg-track seg-track--scroll">
            <div class="seg-row seg-row--scroll">
              <button
                type="button"
                class="seg-btn"
                :class="{ active: form.period_type === 'week' }"
                @click="setPeriod('week')"
              >
                Weekly
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: form.period_type === 'month' }"
                @click="setPeriod('month')"
              >
                Monthly
              </button>
              <template v-if="BUDGET_V2_FIELDS">
                <button type="button" class="seg-btn" disabled>Quarterly</button>
              </template>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: form.period_type === 'year' }"
                @click="setPeriod('year')"
              >
                Yearly
              </button>
              <button v-if="BUDGET_V2_FIELDS" type="button" class="seg-btn" disabled>Custom</button>
            </div>
          </div>
        </div>

        <div class="form-group form-group--row form-group--row-multiline">
          <label class="form-label form-label--row">Start date</label>
          <div class="seg-track seg-track--row-end">
            <div class="seg-row">
              <button type="button" class="seg-btn" :class="{ active: startMode === 'anchor' }" @click="applyAnchorStart">
                {{ anchorLabel }}
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: startMode === 'custom' }"
                @click="startMode = 'custom'"
              >
                Custom
              </button>
            </div>
          </div>
          <div v-if="startMode === 'custom'" class="date-pickers">
            <select v-model.number="customY" class="form-select form-select--narrow">
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
            </select>
            <select v-model.number="customM" class="form-select form-select--narrow">
              <option v-for="m in monthOptions" :key="m.v" :value="m.v">{{ m.label }}</option>
            </select>
            <select v-model.number="customD" class="form-select form-select--narrow">
              <option v-for="day in dayOptions" :key="day" :value="day">{{ day }}</option>
            </select>
          </div>
        </div>

        <div class="form-group form-group--row">
          <label class="form-label form-label--row">Currency</label>
          <ion-select
            v-model="form.currency"
            interface="action-sheet"
            placeholder="Select currency"
            class="ion-select-inline ion-select-flow-chevron currency-ion-select"
            @ionChange="onCurrencyIonChange"
          >
            <ion-select-option v-for="c in currencyOptions" :key="c.code" :value="c.code">
              {{ c.name }} ({{ c.code }})
            </ion-select-option>
            <span slot="end" class="select-flow-chevron" aria-hidden="true">
              <svg
                class="filter-chevron"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#A8A8A8"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </ion-select>
        </div>

        <div v-if="BUDGET_V2_FIELDS" class="form-group form-group--stack">
          <label class="form-label">Description</label>
          <input type="text" class="form-input" placeholder="" disabled />
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSelect,
  IonSelectOption
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import {
  getAccounts,
  getBudgetById,
  updateBudget
} from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'
import { useIonSheetHeight } from '@/composables/useIonSheetHeight'
import { BUDGET_V2_FIELDS } from '@/views/budgets/constants'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  /** 'create' | 'edit' */
  mode: { type: String, default: 'create' },
  /** Current workspace id (create: from route; edit: from loaded plan). Not user-editable. */
  workspaceId: { type: Number, default: null },
  workspaceName: { type: String, default: '' },
  planId: { type: [Number, String], default: null }
})

const emit = defineEmits(['close', 'continue-create', 'updated'])

const SHEET_PCT = 92
const { modalRef, breakpoints, initialBreakpoint } = useIonSheetHeight(() => props.isOpen, SHEET_PCT)

const saving = ref(false)
const loadingPlan = ref(false)
const workspaceOptions = ref([])
const balancesByWsKey = ref(new Map())
const currencyOptions = ref([{ code: 'USD', name: 'US Dollar' }])

const startMode = ref('anchor')

const form = reactive({
  workspace_id: null,
  name: '',
  period_type: 'month',
  is_recurring: true,
  currency: 'USD'
})

const customY = ref(new Date().getFullYear())
const customM = ref(new Date().getMonth() + 1)
const customD = ref(new Date().getDate())

const monthOptions = [
  { v: 1, label: 'Jan' },
  { v: 2, label: 'Feb' },
  { v: 3, label: 'Mar' },
  { v: 4, label: 'Apr' },
  { v: 5, label: 'May' },
  { v: 6, label: 'Jun' },
  { v: 7, label: 'Jul' },
  { v: 8, label: 'Aug' },
  { v: 9, label: 'Sep' },
  { v: 10, label: 'Oct' },
  { v: 11, label: 'Nov' },
  { v: 12, label: 'Dec' }
]

const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  const out = []
  for (let i = y - 2; i <= y + 8; i++) out.push(i)
  return out
})

const dayOptions = computed(() => {
  const dim = daysInMonth(customY.value, customM.value)
  const out = []
  for (let d = 1; d <= dim; d++) out.push(d)
  return out
})

watch([customY, customM], () => {
  const dim = daysInMonth(customY.value, customM.value)
  if (customD.value > dim) customD.value = dim
})

function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate()
}

const anchorLabel = computed(() => {
  if (form.period_type === 'week') return 'Start of Week'
  if (form.period_type === 'year') return '1st of Year'
  return '1st of Month'
})

const lockedWorkspaceLabel = computed(() => {
  if (props.workspaceName) return props.workspaceName
  const id = form.workspace_id
  const row = workspaceOptions.value.find((w) => w.id === id)
  return row?.label || '—'
})

function wsKey(id) {
  return id == null ? 'null' : String(id)
}

const selectedBalance = computed(() => {
  const id = form.workspace_id
  return balancesByWsKey.value.get(wsKey(id)) ?? null
})

function pad(n) {
  return String(n).padStart(2, '0')
}

function toYmd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function startOfWeekMonday(d = new Date()) {
  const x = new Date(d)
  const day = x.getDay()
  const monOffset = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + monOffset)
  x.setHours(12, 0, 0, 0)
  return x
}

function firstOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0, 0)
}

function firstOfYear(d = new Date()) {
  return new Date(d.getFullYear(), 0, 1, 12, 0, 0, 0)
}

function anchorDateForPeriod(periodType) {
  const now = new Date()
  if (periodType === 'week') return startOfWeekMonday(now)
  if (periodType === 'year') return firstOfYear(now)
  return firstOfMonth(now)
}

function computeStartYmd() {
  if (startMode.value === 'custom') {
    const dim = daysInMonth(customY.value, customM.value)
    const d = Math.min(customD.value, dim)
    return `${customY.value}-${pad(customM.value)}-${pad(d)}`
  }
  return toYmd(anchorDateForPeriod(form.period_type))
}

function computeEndYmd(startYmd) {
  const [y, m, d] = startYmd.split('-').map(Number)
  const start = new Date(y, m - 1, d, 12, 0, 0, 0)
  if (form.period_type === 'week') {
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return toYmd(end)
  }
  if (form.period_type === 'month') {
    const end = new Date(y, m, 0, 12, 0, 0, 0)
    return toYmd(end)
  }
  const end = new Date(y, 11, 31, 12, 0, 0, 0)
  return toYmd(end)
}

function setPeriod(p) {
  form.period_type = p
  if (startMode.value === 'anchor') applyAnchorStart()
}

function applyAnchorStart() {
  startMode.value = 'anchor'
  const a = anchorDateForPeriod(form.period_type)
  customY.value = a.getFullYear()
  customM.value = a.getMonth() + 1
  customD.value = a.getDate()
}

function syncCustomPickersFromYmd(ymd) {
  const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return
  customY.value = Number(m[1])
  customM.value = Number(m[2])
  customD.value = Number(m[3])
}

function emitClose() {
  emit('close')
}

function onDismiss() {
  emit('close')
}

function formatMoney(amount, code) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)
  } catch {
    return `${amount?.toFixed?.(2) ?? amount}`
  }
}

function extractAccountsList(res) {
  const d = res?.data
  if (Array.isArray(d)) return d
  if (d && Array.isArray(d.data)) return d.data
  return []
}

async function loadBalances() {
  try {
    const res = await getAccounts({ is_active: true })
    const list = extractAccountsList(res)
    const map = new Map()
    let sumNull = 0
    for (const a of list) {
      const bal = parseFloat(a.current_balance ?? a.balance ?? 0) || 0
      const wid = a.workspace_id
      if (wid == null || wid === '') sumNull += bal
      else {
        const k = wsKey(Number(wid))
        map.set(k, (map.get(k) || 0) + bal)
      }
    }
    map.set('null', sumNull)
    balancesByWsKey.value = map
  } catch {
    balancesByWsKey.value = new Map()
  }
}

async function loadWorkspaces() {
  try {
    const [ownRes, sharedRes] = await Promise.all([getWorkspaces(), getSharedWorkspaces()])
    const own = Array.isArray(ownRes?.data) ? ownRes.data : []
    const shared = Array.isArray(sharedRes?.data?.active) ? sharedRes.data.active : []
    const opts = []
    for (const w of own) {
      opts.push({
        key: String(w.id),
        id: Number(w.id),
        label: w.name || `Island ${w.id}`
      })
    }
    for (const w of shared) {
      opts.push({
        key: `s-${w.id}`,
        id: Number(w.id),
        label: w.tenant_name ? `${w.name || 'Shared'} (${w.tenant_name})` : w.name || 'Shared island'
      })
    }
    workspaceOptions.value = opts
  } catch {
    workspaceOptions.value = []
  }
}

async function loadCurrencies() {
  try {
    const [listRes, defaultRes] = await Promise.all([
      getTenantCurrencies().catch(() => ({ data: { data: [] } })),
      getTenantDefaultCurrency().catch(() => null)
    ])
    const list = listRes?.data?.data ?? listRes?.data ?? []
    currencyOptions.value = Array.isArray(list) && list.length ? list : [{ code: 'USD', name: 'US Dollar' }]
    const def = defaultRes?.data?.data ?? defaultRes?.data
    if (props.mode === 'create' && def?.code) form.currency = String(def.code).toUpperCase().slice(0, 3)
    else if (props.mode === 'create' && currencyOptions.value[0]?.code) {
      form.currency = currencyOptions.value[0].code
    }
  } catch {
    currencyOptions.value = [{ code: 'USD', name: 'US Dollar' }]
  }
}

function pickWorkspaceDefault() {
  if (props.workspaceId != null && props.workspaceId !== '') {
    form.workspace_id = Number(props.workspaceId)
    return
  }
  form.workspace_id = null
}

function onCurrencyIonChange(ev) {
  const v = ev.detail.value
  if (v != null && v !== '') form.currency = String(v).toUpperCase().slice(0, 3)
}

async function loadPlanForEdit() {
  if (!props.planId) return
  loadingPlan.value = true
  try {
    const res = await getBudgetById(props.planId)
    const data = res?.data
    if (!data) {
      showToast('Budget not found')
      emitClose()
      return
    }
    form.workspace_id =
      data.workspace_id != null && data.workspace_id !== '' ? Number(data.workspace_id) : null
    form.name = data.name || ''
    form.period_type = data.period_type || 'month'
    form.is_recurring = data.is_recurring !== false && data.is_recurring !== 0
    form.currency = (data.currency || 'USD').toString().slice(0, 3)
    const sd = String(data.start_date || '').slice(0, 10)
    const anchor = toYmd(anchorDateForPeriod(form.period_type))
    if (sd === anchor) {
      startMode.value = 'anchor'
    } else {
      startMode.value = 'custom'
      syncCustomPickersFromYmd(sd)
    }
  } catch {
    showToast('Failed to load budget')
    emitClose()
  } finally {
    loadingPlan.value = false
  }
}

watch(
  () => props.isOpen,
  async (open) => {
    if (!open) return
    await Promise.all([loadWorkspaces(), loadBalances(), loadCurrencies()])
    if (props.mode === 'create') {
      form.name = ''
      form.period_type = 'month'
      form.is_recurring = true
      pickWorkspaceDefault()
      startMode.value = 'anchor'
      applyAnchorStart()
    } else {
      await loadPlanForEdit()
    }
  }
)

async function onOk() {
  const name = (form.name || '').trim()
  if (!name) {
    showToast('Enter a budget name')
    return
  }
  if (props.mode === 'create' && (form.workspace_id == null || form.workspace_id === '')) {
    showToast('Open budget setup from an island')
    return
  }
  const start_date = computeStartYmd()
  const end_date = computeEndYmd(start_date)
  if (new Date(start_date) > new Date(end_date)) {
    showToast('Invalid date range')
    return
  }

  const workspace_label =
    workspaceOptions.value.find((w) => w.id === form.workspace_id)?.label || lockedWorkspaceLabel.value

  if (props.mode === 'edit' && props.planId) {
    saving.value = true
    try {
      await updateBudget(props.planId, {
        name,
        period_type: form.period_type,
        start_date,
        end_date,
        currency: form.currency,
        is_recurring: form.is_recurring
      })
      showToast('Budget updated')
      emit('updated')
      emitClose()
    } catch (e) {
      showToast(e?.message || 'Failed to update')
    } finally {
      saving.value = false
    }
    return
  }

  emit('continue-create', {
    workspace_id: form.workspace_id,
    workspace_label,
    name,
    period_type: form.period_type,
    is_recurring: form.is_recurring,
    start_date,
    end_date,
    currency: form.currency
  })
  emitClose()
}
</script>

<style scoped>
.budget-setup-modal {
  --border-radius: 16px 16px 0 0;
}

.budget-setup-content {
  --background: #ffffff;
}

.drawer-ion-header {
  flex-shrink: 0;
}

.budget-setup-header :deep(ion-toolbar) {
  --background: #ffffff;
  --border-width: 0 0 1px 0;
  --border-color: #ebebeb;
  --min-height: 52px;
}

.budget-setup-header :deep(.budget-setup-title) {
  font-weight: 700;
  font-size: 17px;
  color: #1a1a1a;
}

.budget-setup-cancel {
  --color: rgba(0, 0, 0, 0.45);
  font-weight: 400;
  font-size: 16px;
}

.ok-btn {
  --color: #ff8d28;
  font-weight: 600;
  font-size: 16px;
}

.adaptive-sheet-body {
  padding: 12px 20px 32px;
  min-height: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group--stack .form-label {
  margin-bottom: 6px;
}

.form-group--row,
.form-group--row-multiline {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  align-items: center;
  column-gap: 14px;
  row-gap: 10px;
}

.form-group--row-multiline {
  align-items: start;
}

.form-group--row-multiline > .form-label--row {
  margin-top: 9px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 8px;
}

.form-label--row {
  margin-bottom: 0;
  white-space: nowrap;
}

.form-input {
  width: 100%;
  padding: 10px 0;
  border: none;
  border-bottom: 1px solid #e5e5e5;
  background: transparent;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  outline: none;
}

.form-input::placeholder {
  color: rgba(0, 0, 0, 0.25);
}

.form-input--embedded {
  flex: 1;
  min-width: 140px;
  width: auto;
}

.form-input:focus {
  border-bottom-color: #ff8d28;
}

.form-select {
  width: 100%;
  padding: 10px 8px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  background: #fff;
  color: #1a1a1a;
}

.ion-select-inline {
  width: 100%;
  padding: 10px 0;
  padding-inline-start: 0;
  padding-inline-end: 0;
  border: none;
  border-bottom: 1px solid #e8e8e8;
  border-radius: 0;
  background: transparent;
  font-size: 15px;
  color: #1a1a2e;
  max-width: 100%;
}

.ion-select-inline::part(container) {
  border: none;
  background: transparent;
}

.currency-ion-select {
  min-width: 0;
  justify-self: stretch;
}

.form-select--narrow {
  flex: 1;
  min-width: 0;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  text-align: left;
  text-align-last: auto;
  background-image: none;
}

.island-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.bal-hint {
  font-size: 13px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  flex-shrink: 0;
}

.seg-track {
  min-width: 0;
  background: #ececec;
  border-radius: 10px;
  padding: 3px;
  width: 100%;
}

.seg-track--scroll {
  overflow: hidden;
}

.seg-track--row-end {
  justify-self: stretch;
}

.seg-row {
  display: flex;
  gap: 0;
  flex-wrap: nowrap;
  align-items: stretch;
}

.seg-row--scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.seg-row--scroll::-webkit-scrollbar {
  display: none;
}

.seg-btn {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.38);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.seg-row--scroll .seg-btn {
  flex: 0 0 auto;
  padding: 8px 14px;
}

.seg-btn.active {
  background: #ffffff;
  color: #ff8d28;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.seg-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.form-group--row-multiline .date-pickers {
  grid-column: 1 / -1;
  margin-top: 0;
}

.date-pickers {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 360px) {
  .form-group--row,
  .form-group--row-multiline {
    grid-template-columns: 1fr;
  }

  .form-group--row-multiline > .form-label--row {
    margin-top: 0;
  }

  .seg-track--row-end {
    justify-self: stretch;
  }
}
</style>
