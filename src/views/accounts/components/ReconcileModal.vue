<template>
  <Teleport to="ion-app">
    <Transition name="drawer-fade">
      <div v-if="visible && account" class="drawer-backdrop" @click="handleClose" />
    </Transition>
    <Transition name="drawer-slide">
      <div v-if="visible && account" class="drawer-sheet" @click.stop>
        <div class="drawer-handle" />
        <h2 class="drawer-title">Reconcile Balance</h2>

        <div class="drawer-form">
          <div class="form-group">
            <label class="form-label subtle-label">Account</label>
            <div class="account-row">
              <div class="account-selects">
                <div class="fake-select">
                  <span class="fake-select-text">{{ accountDisplayName }}</span>
                  <svg class="fake-select-chev" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
                    <path fill="currentColor" d="M6 8L0 0h12z"/>
                  </svg>
                </div>
                <div class="fake-select">
                  <span class="fake-select-text">{{ accountTypeLabel }}</span>
                  <svg class="fake-select-chev" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
                    <path fill="currentColor" d="M6 8L0 0h12z"/>
                  </svg>
                </div>
              </div>
              <span class="account-bal">Bal: {{ formatCurrency(currentBalance, account.currency) }}</span>
            </div>
            <p v-if="workspaceLine" class="account-workspace-sub">{{ workspaceLine }}</p>
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

        <div class="drawer-footer">
          <button type="button" class="btn-cancel" @click="handleClose">
            Cancel
          </button>
          <button
            type="button"
            class="btn-add"
            :disabled="submitDisabled || submitLoading"
            @click="handleSubmit"
          >
            {{ submitLoading ? 'Saving…' : difference === 0 ? 'Close' : 'Save' }}
          </button>
        </div>
      </div>
    </Transition>

    <ion-modal
      :is-open="showCategoryPicker && !!account"
      @didDismiss="showCategoryPicker = false"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Category</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showCategoryPicker = false">Cancel</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
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
      </ion-content>
    </ion-modal>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonLabel
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

const accountTypeLabel = computed(() => formatAccountType(props.account?.type))

function formatAccountType(t) {
  const map = {
    bank: 'Bank',
    cash: 'Cash',
    credit_card: 'Credit Card',
    loan: 'Loan',
    savings: 'Savings',
    investment: 'Investment',
    other: 'Other'
  }
  if (t == null || t === '') return 'Other'
  const key = String(t).toLowerCase()
  return map[key] || String(t).replace(/_/g, ' ')
}

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
/* Drawer shell — match AccountForm.vue */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
}

.drawer-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  z-index: 1001;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.drawer-handle {
  width: 36px;
  height: 4px;
  background: #d6d9dd;
  border-radius: 2px;
  margin: 12px auto 8px;
}

.drawer-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  text-align: center;
  margin: 0 0 20px;
  padding: 0 24px;
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

.account-workspace-sub {
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: #9e9e9e;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 24px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel {
  padding: 10px 20px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 500;
  color: #a7a7a7;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.btn-add {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  background: #ff8d28;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Reconcile-specific */
.account-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.account-selects {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.fake-select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 8px 10px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fafafa;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.fake-select-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  max-width: 140px;
}

.fake-select-chev {
  flex-shrink: 0;
  color: #a8a8a8;
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

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s ease-out;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateY(100%);
}
</style>
