<template>
  <ion-page class="transaction-form-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <!-- Add Entry Page Header -->
        <header class="entry-header">
          <button type="button" class="header-back" aria-label="Back" @click="$router.back()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColsor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 class="header-title">{{ isEdit ? 'Edit Transaction' : 'Add a Transaction' }}</h1>
          <div class="header-actions">
            <button
              v-if="!isEdit"
              type="button"
              class="header-icon-btn"
              aria-label="Save and add new"
              :disabled="saving"
              @click="submitAndAddNew"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>
            <button type="button" class="header-icon-btn header-icon-save" aria-label="Save" :disabled="saving" @click="submit(false)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- Transaction Switch -->
        <div class="transaction-switch">
          <button
            v-for="t in typeOptions"
            :key="t.value"
            type="button"
            class="switch-tab"
            :class="{ active: form.type === t.value, [t.value]: form.type === t.value }"
            @click="selectType(t.value)"
          >
            {{ t.label }}
          </button>
        </div>

        <form @submit.prevent="submit" class="entry-fields">
          <!-- Account + Balance row (income/expense) -->
          <div v-if="form.type !== 'transfer'" class="field-row field-account-row">
            <button type="button" class="account-trigger" @click="showAccountPicker = true">
              <svg class="account-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <span class="account-name">{{ selectedAccount?.name || 'Select Account' }}</span>
              <svg class="field-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <span v-if="selectedAccount" class="account-balance">Balance : {{ formatCurrency(selectedAccount.current_balance ?? selectedAccount.balance ?? 0, selectedAccount.currency) }}</span>
          </div>
          <!-- Transfer: From / To accounts -->
          <template v-if="form.type === 'transfer'">
            <div class="field-underline">
              <label class="field-label">From Account</label>
              <button type="button" class="field-value field-trigger" @click="showAccountPicker = true">
                {{ accountText || 'Select Account' }}
                <svg class="field-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>
            <div class="field-underline">
              <label class="field-label">To Account</label>
              <button type="button" class="field-value field-trigger" @click="showToAccountPicker = true">
                {{ toAccountText || 'Select Account' }}
                <svg class="field-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>
          </template>

          <!-- Date + Time row -->
          <div class="field-row field-datetime-row">
            <button type="button" class="datetime-trigger" @click="showDatePicker = true">
              <svg class="datetime-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>{{ dateDisplayValue }}</span>
              <svg class="field-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button type="button" class="datetime-trigger" @click="showTimePicker = true">
              <svg class="datetime-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>{{ timeDisplayValue }}</span>
              <svg class="field-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>

          <DatePicker
            :visible="showDatePicker"
            :model-value="dateOnlyValue"
            @close="showDatePicker = false"
            @select="onDateSelect"
          />
          <TimePicker
            :visible="showTimePicker"
            :model-value="timeOnlyValue"
            @close="showTimePicker = false"
            @select="onTimeSelect"
          />

          <!-- Category (income/expense only) - pills + Add New -->
          <div v-if="form.type !== 'transfer'" class="field-category">
            <label class="field-label">Category</label>
            <div class="category-pills">
              <button
                v-for="c in suggestedCategoryPills"
                :key="c.value"
                type="button"
                class="category-pill"
                :class="{ active: form.category_id === c.value }"
                @click="selectCategory(c.value)"
              >
                {{ c.text }}
              </button>
              <button type="button" class="category-pill category-pill-add" @click="showCategoryForm = true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add New Category
              </button>
            </div>
            <button v-if="categoryOptions.length === 0" type="button" class="field-trigger field-trigger-full" @click="showCategoryPicker = true">
              Select category
              <svg class="field-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>

          <!-- Amount -->
          <div class="field-underline">
            <label class="field-label">Amount</label>
            <div class="field-amount-row">
              <button
                type="button"
                class="field-input amount-trigger"
                :class="{ 'amount-placeholder': !form.amount }"
                @click="showCalculator = true"
              >
                {{ form.amount > 0 ? form.amount : '0' }}
              </button>
              <button type="button" class="field-currency" @click="showCurrencyPicker = true">
                {{ form.currency }}
                <svg class="field-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>
          </div>

          <AmountCalculator
            :visible="showCalculator"
            :model-value="form.amount"
            :currency="form.currency"
            :budget="budgetContext"
            @close="showCalculator = false"
            @select="onAmountSelect"
          />

          <!-- Description -->
          <div class="field-underline">
            <label class="field-label">Description</label>
            <input
              v-model="form.title"
              type="text"
              class="field-input"
              placeholder="Optional"
            />
          </div>

          <!-- Notes (optional, compact) -->
          <div class="field-underline">
            <label class="field-label">Notes</label>
            <input
              v-model="form.description"
              type="text"
              class="field-input"
              placeholder="Optional"
            />
          </div>

          <div v-if="creditWarning" class="form-warning">
            {{ creditWarning }}
          </div>
        </form>

        <!-- Add Transaction Buttons (bottom) -->
        <div class="entry-actions">
          <button type="button" class="action-discard" @click="$router.back()">
            Discard
          </button>
          <button
            v-if="!isEdit"
            type="button"
            class="action-secondary"
            :disabled="saving"
            @click="submitAndAddNew"
          >
            Save & Add New
          </button>
          <button type="button" class="action-save" :disabled="saving" @click="submit">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <div v-if="isEdit" class="form-actions">
          <button type="button" class="delete-btn" :disabled="saving" @click="onDelete">
            Delete Transaction
          </button>
        </div>
      </div>
    </ion-content>

    <!-- Account picker modal -->
    <ion-modal :is-open="showAccountPicker" @didDismiss="showAccountPicker = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ form.type === 'transfer' ? 'From Account' : 'Account' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showAccountPicker = false">Cancel</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-searchbar v-model="accountSearchQuery" placeholder="Search..." debounce="150" />
        <ion-list>
          <ion-item v-for="a in filteredAccountCols" :key="a.value" button @click="selectAccount(a.value)">
            <ion-label>{{ a.text }}</ion-label>
          </ion-item>
          <ion-item v-if="filteredAccountCols.length === 0">
            <ion-label color="medium">No accounts</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <!-- To account picker -->
    <ion-modal :is-open="showToAccountPicker" @didDismiss="showToAccountPicker = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>To Account</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showToAccountPicker = false">Cancel</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-searchbar v-model="toAccountSearchQuery" placeholder="Search..." debounce="150" />
        <ion-list>
          <ion-item v-for="a in filteredToAccountCols" :key="a.value" button @click="selectToAccount(a.value)">
            <ion-label>{{ a.text }}</ion-label>
          </ion-item>
          <ion-item v-if="filteredToAccountCols.length === 0">
            <ion-label color="medium">No accounts</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <!-- Category picker -->
    <ion-modal :is-open="showCategoryPicker" @didDismiss="showCategoryPicker = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Category</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showCategoryPicker = false">Cancel</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-searchbar v-model="categorySearchQuery" placeholder="Search..." debounce="150" />
        <ion-list>
          <ion-item v-for="c in filteredCategoryCols" :key="c.value" button @click="selectCategory(c.value); showCategoryPicker = false">
            <ion-label>{{ c.text }}</ion-label>
          </ion-item>
          <ion-item v-if="filteredCategoryCols.length === 0">
            <ion-label color="medium">No categories</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <!-- Currency picker -->
    <ion-modal :is-open="showCurrencyPicker" @didDismiss="showCurrencyPicker = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Currency</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showCurrencyPicker = false">Cancel</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item
            v-for="c in currencyOptions"
            :key="c.value"
            button
            @click="form.currency = c.value; showCurrencyPicker = false"
          >
            <ion-label>{{ c.text }}</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <CategoryForm
      :is-open="showCategoryForm"
      :category="null"
      :type="form.type"
      @close="showCategoryForm = false"
      @success="onCategoryFormSuccess"
    />
  </ion-page>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonSearchbar, IonList, IonItem, IonLabel } from '@ionic/vue'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import CategoryForm from '@/views/categories/components/CategoryForm.vue'
import DatePicker from '@/components/DatePicker.vue'
import TimePicker from '@/components/TimePicker.vue'
import AmountCalculator from '@/components/AmountCalculator.vue'
import { createTransaction, updateTransaction, getTransactionById, deleteTransaction, getCategoryTree, getAccounts, getPrimaryAccount, getBudgetContext } from '@/api/accounting'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'
import { useSyncStore } from '@/store/sync'

const route = useRoute()
const router = useRouter()
const syncStore = useSyncStore()
const id = route.params.id
const isEdit = !!id

const getCurrentDateTimeString = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const normalizeTransactionDateTime = (value) => {
  if (!value) return getCurrentDateTimeString()
  const s = String(value).trim()
  if (s.length === 10 && s.match(/^\d{4}-\d{2}-\d{2}$/)) return `${s} 00:00:00`
  const date = new Date(s)
  if (Number.isNaN(date.getTime())) return getCurrentDateTimeString()
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function dateToDatetimeLocal(s) {
  if (!s) return ''
  const d = new Date(s.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const form = reactive({
  transaction_number: '',
  title: '',
  type: 'income',
  account_id: null,
  to_account_id: null,
  category_id: null,
  amount: 0,
  currency: 'USD',
  description: '',
  transaction_date: getCurrentDateTimeString(),
  status: 'completed'
})

const typeOptions = [
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
  { label: 'Transfer', value: 'transfer' }
]

const accountOptions = ref([])
const categoryOptions = ref([])
const currencyOptions = ref([{ value: 'USD', text: 'USD' }])
const saving = ref(false)
const creditWarning = ref(null)
const accountSearchQuery = ref('')
const toAccountSearchQuery = ref('')
const categorySearchQuery = ref('')
const showAccountPicker = ref(false)
const showToAccountPicker = ref(false)
const showCategoryPicker = ref(false)
const showCurrencyPicker = ref(false)
const showCategoryForm = ref(false)
const showDatePicker = ref(false)
const showTimePicker = ref(false)
const showCalculator = ref(false)
const budgetContext = ref(null)

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount ?? 0)
}

const dateInputValue = computed(() => dateToDatetimeLocal(form.transaction_date))

function formatDateDisplay(s) {
  if (!s) return 'dd.mm.yyyy'
  const d = new Date(s.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return 'dd.mm.yyyy'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${d.getFullYear()}`
}

function formatTimeDisplay(s) {
  if (!s) return '00:00'
  const d = new Date(s.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return '00:00'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const dateDisplayValue = computed(() => formatDateDisplay(form.transaction_date))
const timeDisplayValue = computed(() => formatTimeDisplay(form.transaction_date))
const dateOnlyValue = computed(() => {
  const s = form.transaction_date
  if (!s) return ''
  const d = new Date(s.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})
const timeOnlyValue = computed(() => {
  const s = form.transaction_date
  if (!s) return '00:00'
  const d = new Date(s.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return '00:00'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

function onAmountSelect(val) {
  form.amount = val
}

function onDateSelect(dateStr) {
  if (dateStr) {
    form.transaction_date = `${dateStr} ${timeOnlyValue.value}:00`
  }
}

function onTimeSelect(timeStr) {
  if (timeStr) {
    const datePart = dateOnlyValue.value || new Date().toISOString().slice(0, 10)
    form.transaction_date = `${datePart} ${timeStr}:00`
  }
}

const suggestedCategoryPills = computed(() => categoryOptions.value.slice(0, 6))

function selectCategory(value) {
  form.category_id = value
  loadBudgetContext(value)
}

const selectedAccount = computed(() => {
  if (form.account_id == null) return null
  return accountOptions.value.find((a) => Number(a.id) === Number(form.account_id)) || null
})

const selectedToAccount = computed(() => {
  if (form.to_account_id == null) return null
  return accountOptions.value.find((a) => Number(a.id) === Number(form.to_account_id)) || null
})

const accountText = computed(() => {
  const acc = selectedAccount.value
  if (!acc) return ''
  const bal = acc.current_balance ?? acc.balance ?? 0
  return `${acc.name} (${formatCurrency(bal, acc.currency)})`
})

const toAccountText = computed(() => {
  const acc = selectedToAccount.value
  if (!acc) return ''
  const bal = acc.current_balance ?? acc.balance ?? 0
  return `${acc.name} (${formatCurrency(bal, acc.currency)})`
})

const categoryText = computed(() => {
  if (form.category_id == null) return ''
  const c = categoryOptions.value.find((c) => Number(c.value) === Number(form.category_id))
  return c?.text || ''
})

const accountCols = computed(() =>
  accountOptions.value.map((a) => ({
    text: `${a.name} (${formatCurrency(a.current_balance ?? a.balance, a.currency)})`,
    value: Number(a.id)
  }))
)

const filteredAccountCols = computed(() => {
  const q = (accountSearchQuery.value || '').trim().toLowerCase()
  if (!q) return accountCols.value
  return accountCols.value.filter((a) => a.text.toLowerCase().includes(q))
})

const toAccountCols = computed(() => {
  const fromId = form.account_id != null ? Number(form.account_id) : null
  return accountOptions.value
    .filter((a) => Number(a.id) !== fromId)
    .map((a) => ({
      text: `${a.name} (${formatCurrency(a.current_balance ?? a.balance, a.currency)})`,
      value: Number(a.id)
    }))
})

const filteredToAccountCols = computed(() => {
  const q = (toAccountSearchQuery.value || '').trim().toLowerCase()
  if (!q) return toAccountCols.value
  return toAccountCols.value.filter((a) => a.text.toLowerCase().includes(q))
})

const filteredCategoryCols = computed(() => {
  const q = (categorySearchQuery.value || '').trim().toLowerCase()
  if (!q) return categoryOptions.value
  return categoryOptions.value.filter((c) => c.text.toLowerCase().includes(q))
})

function filterActiveCategories(categories) {
  return (categories || [])
    .filter((cat) => cat.is_active !== false)
    .map((cat) => ({
      ...cat,
      children: cat.children?.length ? filterActiveCategories(cat.children) : []
    }))
}

function flatten(arr, pre = '', parentId = null) {
  const out = []
  for (const c of arr || []) {
    const t = pre ? `${pre} > ${c.name}` : c.name
    out.push({ value: Number(c.id), text: t, parentId: parentId != null ? Number(parentId) : null })
    if (c.children?.length) out.push(...flatten(c.children, t, c.id))
  }
  return out
}

async function loadOptions() {
  try {
    const [accRes, curRes] = await Promise.all([
      getAccounts({ is_active: true }),
      getTenantCurrencies().catch(() => ({ data: { data: [{ code: 'USD', name: 'USD' }] } }))
    ])
    if (accRes?.data) accountOptions.value = accRes.data
    const cur = curRes?.data?.data ?? curRes?.data
    if (Array.isArray(cur) && cur.length) {
      currencyOptions.value = cur.map((c) => ({ value: c.code, text: `${c.code} - ${c.name || c.code}` }))
    }
    const def = await getTenantDefaultCurrency().catch(() => null)
    const dc = def?.data?.data ?? def?.data
    if (dc?.code) form.currency = dc.code
    else if (currencyOptions.value.length && !form.currency) form.currency = currencyOptions.value[0].value
  } catch (_) {
    if (!form.currency) form.currency = 'USD'
  }
}

async function loadCategories() {
  if (form.type === 'transfer') {
    categoryOptions.value = []
    return
  }
  try {
    const r = await getCategoryTree(form.type)
    const data = r?.data || r?.data?.data || []
    const filtered = filterActiveCategories(Array.isArray(data) ? data : [])
    categoryOptions.value = flatten(filtered)
  } catch (_) {
    categoryOptions.value = []
  }
}

async function onCategoryFormSuccess() {
  showCategoryForm.value = false
  await loadCategories()
}

async function loadBudgetContext(categoryId) {
  if (!categoryId || form.type !== 'expense') {
    budgetContext.value = null
    return
  }
  try {
    // If it's a subcategory, use its parent's ID for budget lookup
    const cat = categoryOptions.value.find(c => c.value === Number(categoryId))
    const lookupId = cat?.parentId ?? categoryId
    const date = (form.transaction_date || new Date().toISOString()).slice(0, 10)
    const res = await getBudgetContext({ category_id: lookupId, date })
    const data = res?.data?.data ?? res?.data ?? res
    // Only set if we have meaningful budget data
    if (data && data.monthly_limit != null) {
      budgetContext.value = data
    } else {
      budgetContext.value = null
    }
  } catch {
    budgetContext.value = null
  }
}

function checkCreditLimit() {
  if (!selectedAccount.value || form.amount == null) {
    creditWarning.value = null
    return
  }
  const account = selectedAccount.value
  if ((account.type === 'credit_card' || account.type === 'loan') && account.credit_limit) {
    const newBalance = (account.current_balance ?? account.balance ?? 0) - Number(form.amount)
    if (newBalance < -account.credit_limit) {
      creditWarning.value = `May exceed credit limit. New balance: ${formatCurrency(newBalance, account.currency)}`
    } else {
      creditWarning.value = null
    }
  } else {
    creditWarning.value = null
  }
}

function selectType(value) {
  form.type = value
  budgetContext.value = null
  if (value === 'transfer') {
    form.category_id = null
    if (form.to_account_id != null && form.to_account_id === form.account_id) form.to_account_id = null
  } else {
    form.category_id = null
    form.to_account_id = null
  }
  loadCategories()
}

function selectAccount(value) {
  form.account_id = value
  showAccountPicker.value = false
  if (selectedAccount.value?.currency) {
    const code = selectedAccount.value.currency
    if (currencyOptions.value.some((c) => c.value === code)) form.currency = code
  }
  checkCreditLimit()
}

function selectToAccount(value) {
  form.to_account_id = value
  showToAccountPicker.value = false
  if (form.type === 'transfer' && selectedToAccount.value?.currency) {
    const code = selectedToAccount.value.currency
    if (currencyOptions.value.some((c) => c.value === code)) form.currency = code
  }
}

function onDateInput(e) {
  const v = e.target?.value
  if (v) form.transaction_date = normalizeTransactionDateTime(v)
}

watch(
  () => form.type,
  (newType, oldType) => {
    if (newType === oldType) return
    if (newType !== 'transfer') {
      loadCategories()
      form.category_id = null
      form.to_account_id = null
    } else {
      categoryOptions.value = []
      form.category_id = null
    }
  }
)

watch([() => form.amount, () => form.account_id], () => checkCreditLimit())

async function loadEdit() {
  if (!id) return
  try {
    const r = await getTransactionById(id)
    const t = r?.data || r
    if (t) {
      form.transaction_number = t.transaction_number || ''
      form.title = t.title || ''
      form.type = t.type || 'income'
      form.amount = parseFloat(t.amount) || 0
      form.currency = t.currency || 'USD'
      form.description = t.description || ''
      form.transaction_date = normalizeTransactionDateTime(t.transaction_date)
      form.status = t.status || 'completed'
      form.account_id = t.account_id != null ? Number(t.account_id) : null
      form.to_account_id = t.to_account_id != null ? Number(t.to_account_id) : null
      form.category_id = t.category_id != null ? Number(t.category_id) : null
      await loadCategories()
    }
  } catch (e) {
    showToast('Failed to load')
    router.back()
  }
}

async function submit(stayAndAddNew = false) {
  const amt = Number(form.amount)
  if (!form.account_id) {
    showToast('Select an account')
    return
  }
  if (form.type === 'transfer' && !form.to_account_id) {
    showToast('Select to account')
    return
  }
  if (form.type !== 'transfer' && !form.category_id) {
    showToast('Select a category')
    return
  }
  if (amt < 0.01) {
    showToast('Amount must be greater than 0')
    return
  }
  saving.value = true
  try {
    const body = {
      transaction_number: (form.transaction_number || '').trim() || `TXN-${Date.now()}`,
      title: form.title?.trim() || null,
      type: form.type,
      account_id: form.account_id,
      to_account_id: form.type === 'transfer' ? form.to_account_id : null,
      category_id: form.type !== 'transfer' ? form.category_id : null,
      amount: amt,
      currency: form.currency,
      description: form.description?.trim() || null,
      transaction_date: normalizeTransactionDateTime(form.transaction_date),
      status: form.status
    }
    const res = isEdit ? await updateTransaction(id, body) : await createTransaction(body)
    if (res?.queued) {
      showToast('Saved locally. Will sync when online.')
      syncStore.setLastQueuedTransaction({ id: res.id, payload: body })
    } else if (!stayAndAddNew) {
      showToast(isEdit ? 'Updated' : 'Created')
    }
    syncStore.setTransactionListInvalidated()

    if (stayAndAddNew && !isEdit) {
      form.transaction_number = `TXN-${Date.now()}`
      form.title = ''
      form.description = ''
      form.amount = 0
      form.transaction_date = getCurrentDateTimeString()
      form.category_id = null
      form.to_account_id = null
      await loadCategories()
      showToast('Saved. Add another.')
    } else {
      router.back()
    }
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}

async function submitAndAddNew() {
  await submit(true)
}

const validTypes = ['income', 'expense', 'transfer']

async function onDelete() {
  try {
    await showConfirmDialog({ title: 'Delete', message: 'Delete this transaction?' })
    await deleteTransaction(id)
    showToast('Deleted')
    syncStore.setTransactionListInvalidated()
    router.back()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

onMounted(async () => {
  await loadOptions()
  if (isEdit) {
    await loadEdit()
  } else {
    const queryType = route.query.type
    const queryAccountId = route.query.account_id
    if (queryType && validTypes.includes(queryType)) form.type = queryType
    form.transaction_number = `TXN-${Date.now()}`
    form.transaction_date = getCurrentDateTimeString()
    form.amount = 0
    await loadCategories()
    const accountId = queryAccountId != null ? Number(queryAccountId) : null
    if (accountId != null && accountOptions.value.some((a) => Number(a.id) === accountId)) {
      form.account_id = accountId
      checkCreditLimit()
    } else {
      try {
        const res = await getPrimaryAccount()
        const primaryId = res?.data?.account_id ?? null
        if (primaryId != null && accountOptions.value.some((a) => a.id === primaryId)) {
          form.account_id = primaryId
          checkCreditLimit()
        }
      } catch (_) {}
    }
  }
})
</script>

<style scoped>
.transaction-form-page {
  --background: #fff;
}

.transaction-form-page ion-content {
  --background: #fff;
}

.page-container {
  padding: 0 24px;
  padding-top: env(safe-area-inset-top, 12px);
  padding-bottom: calc(env(safe-area-inset-bottom) + 100px);
  min-height: 100%;
}

/* Add Entry Page Header */
.entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 20px;
  gap: 12px;
}

.header-back {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #ff8d28;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  text-align: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #a8a8a8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-icon-save {
  color: #ff8d28;
}

/* Transaction Switch */
.transaction-switch {
  display: flex;
  align-items: center;
  background: rgba(168, 168, 168, 0.24);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 24px;
}

.switch-tab {
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #a8a8a8;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.switch-tab.active {
  color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.switch-tab.income.active {
  background: #52bf90;
}

.switch-tab.expense.active {
  background: rgba(195, 0, 16, 0.85);
}

.switch-tab.transfer.active {
  background: #1989fa;
}

/* Entry Fields */
.entry-fields {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid rgba(168, 168, 168, 0.8);
  gap: 12px;
}

.field-account-row .account-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 16px;
  color: #1a1a2e;
  text-align: left;
}

.account-icon {
  flex-shrink: 0;
  color: #a8a8a8;
}

.account-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-balance {
  flex-shrink: 0;
  font-size: 14px;
  color: #a8a8a8;
}

.field-datetime-row {
  flex-wrap: wrap;
}

.datetime-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  padding: 8px 0;
  cursor: pointer;
  font-size: 15px;
  color: #1a1a2e;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.datetime-icon {
  flex-shrink: 0;
  color: #a8a8a8;
}


.field-category {
  padding: 14px 0;
  border-bottom: 1px solid rgba(168, 168, 168, 0.8);
}

.field-category .field-label {
  margin-bottom: 10px;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 141, 40, 0.5);
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  color: #e67a00;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.category-pill.active {
  background: rgba(255, 141, 40, 0.25);
  color: #d66a00;
}

.category-pill-add {
  background: transparent;
  border: 1px solid rgba(255, 141, 40, 0.5);
  color: #e67a00;
}

.field-trigger-full {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 16px;
  color: #a8a8a8;
}

.field-underline {
  border-bottom: 1px solid rgba(168, 168, 168, 0.8);
  padding: 14px 0;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #a8a8a8;
  margin-bottom: 6px;
}

.field-value,
.field-input {
  width: 100%;
  font-size: 16px;
  color: #1a1a2e;
  background: none;
  border: none;
  outline: none;
  padding: 0;
  text-align: left;
}

.field-value::placeholder,
.field-input::placeholder {
  color: #a8a8a8;
}

.field-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  min-height: 24px;
}

.field-chevron {
  flex-shrink: 0;
  color: #a8a8a8;
}

.field-amount-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-amount-row .field-input {
  flex: 1;
  min-width: 0;
}

.amount-trigger {
  text-align: left;
  cursor: pointer;
  font-size: 16px;
  color: #1a1a2e;
  -webkit-tap-highlight-color: transparent;
}

.amount-trigger.amount-placeholder {
  color: #a8a8a8;
}

.field-currency {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
}

.form-warning {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 193, 7, 0.15);
  color: #856404;
  font-size: 13px;
}

/* Add Transaction Buttons (bottom) */
.entry-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px 24px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #eee;
}

.action-discard {
  font-size: 16px;
  font-weight: 500;
  color: #a8a8a8;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
}

.action-secondary {
  font-size: 16px;
  font-weight: 500;
  color: #a8a8a8;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
}

.action-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-save {
  font-size: 16px;
  font-weight: 600;
  color: #ff8d28;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
}

.action-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(168, 168, 168, 0.3);
}

.delete-btn {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(195, 0, 16, 0.5);
  background: transparent;
  color: rgba(195, 0, 16, 0.9);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
