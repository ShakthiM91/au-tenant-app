<template>
  <ion-modal
    ref="mainModalRef"
    :is-open="visible && !!account"
    @didDismiss="onMainDismiss"
    :initial-breakpoint="mainInitialBreakpoint"
    :breakpoints="mainBreakpoints"
    :handle="true"
  >
    <ion-header class="drawer-ion-header">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="handleClose">Cancel</ion-button>
            </ion-buttons>
            <ion-title>Reconcile Balance</ion-title>
            <ion-buttons slot="end">
              <ion-button
                :disabled="submitDisabled || submitLoading"
                @click="handleSubmit"
              >
                {{ submitLoading ? 'Saving…' : difference === 0 ? 'Close' : 'Save' }}
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
    </ion-header>
    <ion-content class="reconcile-modal-content">
        <div class="adaptive-sheet-body">
        <div class="drawer-form">
          <div class="form-group">
            <label class="form-label subtle-label">Account</label>
            <div class="account-row">
              <div class="account-info">
                <span v-if="workspaceLine" class="account-workspace-line">{{ workspaceLine }}</span>
                <span class="account-name-line">{{ accountDisplayName }}</span>
              </div>
              <span class="account-bal">Bal: {{ formatCurrency(currentBalance, account.currency) }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label subtle-label">Correct Account Balance should be</label>
            <input
              :value="latestBalanceInput"
              type="text"
              inputmode="decimal"
              class="hero-amount-input"
              placeholder="0.00"
              @input="onLatestBalanceNativeInput"
            />
          </div>

          <template v-if="difference !== null">
            <div class="form-group">
              <label class="form-label subtle-label">Balance Gap is</label>
              <div class="gap-line-wrap">
                <span
                  class="gap-amount"
                  :class="{ 'gap-amount--lined': difference !== 0 }"
                >
                  {{ gapDisplayAmount }}
                </span>
              </div>
            </div>

            <p v-if="difference !== 0" class="adjust-hint">
              This amount should be added as an
              <span class="adjust-hint-type" :class="difference > 0 ? 'income' : 'expense'">
                {{ difference > 0 ? 'Income' : 'Expense' }}
              </span>
            </p>
          </template>

          <template v-if="difference !== null && difference !== 0">
            <div class="form-group">
              <label class="form-label subtle-label">Category</label>
              <button type="button" class="category-picker-line" @click="showCategoryPicker = true">
                <span :class="{ 'picker-placeholder': !categoryText }">
                  {{ categoryText || 'Select category' }}
                </span>
              </button>
            </div>
            <div class="form-group">
              <label class="form-label subtle-label">Title</label>
              <input
                v-model="transactionTitle"
                type="text"
                class="form-input"
                placeholder="Transaction title (shown on the entry)"
                autocomplete="off"
              />
            </div>
          </template>
        </div>
        </div>
    </ion-content>
  </ion-modal>

  <ion-modal
    ref="catModalRef"
    :is-open="showCategoryPicker && !!account"
    @didDismiss="showCategoryPicker = false"
    :initial-breakpoint="catInitialBreakpoint"
    :breakpoints="catBreakpoints"
    :handle="true"
  >
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="showCategoryPicker = false">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Category</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div class="adaptive-sheet-body">
        <ion-list>
          <ion-item
            v-for="c in categoryCols"
            :key="c.value"
            button
            @click="selectCategory(c.value)"
          >
            <ion-label>{{ c.text }}</ion-label>
          </ion-item>
        </ion-list>
        </div>
      </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useIonSheetHeight } from '@/composables/useIonSheetHeight'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createTransaction, getCategoryTree } from '@/api/accounting'

const props = defineProps({
  visible: { type: Boolean, default: false },
  account: { type: Object, default: null }
})

const emit = defineEmits(['close', 'success'])

const latestBalanceInput = ref('')
const categoryId = ref(null)
const transactionTitle = ref('')
const submitLoading = ref(false)
const showCategoryPicker = ref(false)
const categoryOptions = ref([])

const MAIN_SHEET_PCT = 78
const CATEGORY_PICKER_SHEET_PCT = 62

const { modalRef: mainModalRef, breakpoints: mainBreakpoints, initialBreakpoint: mainInitialBreakpoint } =
  useIonSheetHeight(() => props.visible && !!props.account, MAIN_SHEET_PCT)

const { modalRef: catModalRef, breakpoints: catBreakpoints, initialBreakpoint: catInitialBreakpoint } =
  useIonSheetHeight(() => showCategoryPicker.value && !!props.account, CATEGORY_PICKER_SHEET_PCT)

const currentBalance = computed(() => {
  if (!props.account) return 0
  return parseFloat(props.account.current_balance ?? props.account.balance) || 0
})

const difference = computed(() => {
  const raw = latestBalanceInput.value
  if (raw === '' || raw === null || raw === undefined) return null
  return Math.round(((parseFloat(raw) || 0) - currentBalance.value) * 100) / 100
})

const workspaceLine = computed(() => {
  const n = props.account?.workspace_name
  return n != null && String(n).trim() !== '' ? String(n).trim() : ''
})

const accountDisplayName = computed(() => {
  const n = props.account?.name
  return n != null && String(n).trim() !== '' ? String(n).trim() : 'Account'
})

const gapDisplayAmount = computed(() => {
  if (difference.value === null) return ''
  return formatNumberGrouped(Math.abs(difference.value))
})

const categoryCols = computed(() =>
  categoryOptions.value.map(c => ({ text: c.text, value: c.value }))
)

const categoryText = computed(() => {
  const c = categoryCols.value.find(x => x.value === categoryId.value)
  return c ? c.text : ''
})

const submitDisabled = computed(() => {
  if (difference.value === null) return true
  if (difference.value === 0) return false
  return categoryId.value == null
})

function formatNumberGrouped(amount) {
  const n = Number(amount)
  if (Number.isNaN(n)) return '0.00'
  const parts = Math.abs(n).toFixed(2).split('.')
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${intPart}.${parts[1]}`
}

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2
  }).format(amount)
}

function flatten(arr, pre = '') {
  const out = []
  for (const c of arr || []) {
    if (c.is_active === false) continue
    const t = pre ? `${pre} > ${c.name}` : c.name
    out.push({ value: Number(c.id), text: t })
    if (c.children?.length) out.push(...flatten(c.children, t))
  }
  return out
}

async function loadCategories(type) {
  if (!type) return
  const wsRaw = props.account?.workspace_id
  const workspaceId =
    wsRaw != null && wsRaw !== '' && !Number.isNaN(Number(wsRaw)) ? Number(wsRaw) : null
  try {
    const r = await getCategoryTree(type, workspaceId)
    const data = r?.data ?? r?.data?.data ?? []
    categoryOptions.value = flatten(Array.isArray(data) ? data : [])
  } catch (_) {
    categoryOptions.value = []
  }
}

function onLatestBalanceNativeInput(e) {
  latestBalanceInput.value = e.target?.value != null ? String(e.target.value) : ''
}

function selectCategory(value) {
  categoryId.value = value
  showCategoryPicker.value = false
}

watch(
  () => [props.visible, props.account, difference.value],
  async ([visible, account, diff]) => {
    if (!visible || !account) return
    if (diff !== null && diff !== 0) {
      await loadCategories(diff > 0 ? 'income' : 'expense')
    } else {
      categoryOptions.value = []
    }
  }
)

watch(() => props.visible, (visible) => {
  if (!visible) {
    showCategoryPicker.value = false
  }
  if (visible && props.account) {
    const bal = props.account.current_balance ?? props.account.balance
    latestBalanceInput.value = bal != null ? String(bal) : ''
    categoryId.value = null
    transactionTitle.value = ''
  }
})

function onMainDismiss() {
  handleClose()
}

function handleClose() {
  showCategoryPicker.value = false
  emit('close')
}

function getCurrentDateTimeString() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function handleSubmit() {
  if (difference.value === 0) {
    showToast('No adjustment needed')
    handleClose()
    return
  }

  if (difference.value === null || categoryId.value == null) {
    showToast(difference.value === null ? 'Enter correct balance' : 'Select a category')
    return
  }

  submitLoading.value = true
  try {
    const type = difference.value > 0 ? 'income' : 'expense'
    const amount = Math.abs(difference.value)
    const title = transactionTitle.value?.trim()
    const description = title || 'Balance reconciliation'

    const res = await createTransaction({
      transaction_number: `RECON-${Date.now()}`,
      type,
      account_id: props.account.id,
      category_id: categoryId.value,
      amount,
      currency: props.account.currency || 'USD',
      description,
      transaction_date: getCurrentDateTimeString(),
      status: 'completed'
    })

    showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'Balance reconciled')
    emit('success')
    handleClose()
  } catch (e) {
    showToast(e?.response?.data?.error || e?.message || 'Failed')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.reconcile-modal-content {
  --background: #ffffff;
}

.adaptive-sheet-body {
  min-height: 0;
}

.drawer-ion-header {
  flex-shrink: 0;
}

.drawer-form {
  padding: 0 24px 8px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.form-label.subtle-label {
  color: #757575;
}

.form-input {
  width: 100%;
  padding: 10px 0;
  border: none;
  border-bottom: 1px solid #e8e8e8;
  background: transparent;
  font-size: 15px;
  color: #1a1a2e;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-bottom-color: #ff8d28;
}

.form-input::placeholder {
  color: #a7a7a7;
}

.category-picker-line {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  border-bottom: 1px solid #e8e8e8;
  background: transparent;
  padding: 10px 0;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a2e;
  cursor: pointer;
  transition: border-color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.category-picker-line:focus {
  outline: none;
  border-bottom-color: #ff8d28;
}

.picker-placeholder {
  color: #a7a7a7;
  font-weight: 400;
}

/* Reconcile-specific */
.account-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.account-workspace-line {
  font-size: 13px;
  font-weight: 500;
  color: #9e9e9e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-name-line {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-bal {
  font-size: 13px;
  font-weight: 500;
  color: #9e9e9e;
  white-space: nowrap;
  align-self: center;
}

.hero-amount-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-bottom: 1px solid #e8e8e8;
  background: transparent;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  text-align: right;
  padding: 8px 0 10px;
  line-height: 1.15;
  outline: none;
  transition: border-color 0.2s;
}

.hero-amount-input:focus {
  border-bottom-color: #ff8d28;
}

.hero-amount-input::placeholder {
  color: #e0e0e0;
}

.gap-line-wrap {
  text-align: right;
  padding-bottom: 2px;
}

.gap-amount {
  display: inline-block;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.15;
  min-width: min(100%, 280px);
  text-align: right;
}

.gap-amount--lined {
  border-bottom: 1px solid #1976d2;
  padding-bottom: 6px;
}

.adjust-hint {
  margin: -8px 0 0;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #616161;
  line-height: 1.45;
}

.adjust-hint-type {
  font-weight: 700;
}

.adjust-hint-type.expense {
  color: #c62828;
}

.adjust-hint-type.income {
  color: #2e7d32;
}

</style>
