<template>
  <ion-page class="transaction-form-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <!-- Add Entry Page Header -->
        <header class="entry-header">
          <button type="button" class="header-back" aria-label="Back" @click="$router.back()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 class="header-title">{{ isEdit ? 'Edit Transaction' : 'Add a Transaction' }}</h1>
          <div class="header-actions">
            <button
              v-if="isEdit"
              type="button"
              class="header-icon-btn header-icon-delete"
              aria-label="Delete transaction"
              :disabled="saving"
              @click="onDelete"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
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
          <!-- Date + Time (first, per design) -->
          <div class="field-row field-datetime-row">
            <button type="button" class="datetime-trigger" @click="showDatePicker = true">
              <svg class="datetime-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span class="datetime-trigger-text">{{ dateDisplayValue }}</span>
              <svg class="field-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button type="button" class="datetime-trigger" @click="showTimePicker = true">
              <svg class="datetime-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span class="datetime-trigger-text">{{ timeDisplayValue }}</span>
              <svg class="field-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>

          <!-- Island + Account side-by-side (income / expense) -->
          <div v-if="form.type !== 'transfer'" class="field-workspace-account-row">
            <div class="dual-col dual-col-workspace">
              <component
                :is="showWorkspaceRow ? 'button' : 'div'"
                :type="showWorkspaceRow ? 'button' : undefined"
                class="dual-col-block"
                :class="{ 'dual-col-block--clickable': showWorkspaceRow }"
                @click="showWorkspaceRow && (showWorkspacePicker = true)"
              >
                <div class="dual-col-top">
                  <svg class="dual-col-icon dual-col-icon-workspace" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2a10 10 0 0 1 0 20M12 5a7 7 0 0 1 0 14M12 8a4 4 0 0 1 0 8"/>
                  </svg>
                  <span class="dual-col-name">{{ selectedWorkspaceLabel }}</span>
                  <svg v-if="showWorkspaceRow" class="field-chevron dual-col-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </component>
            </div>
            <div class="dual-col-divider" aria-hidden="true" />
            <div class="dual-col dual-col-account">
              <button type="button" class="dual-col-block dual-col-block--clickable" @click="showAccountPicker = true">
                <div class="dual-col-top">
                  <svg class="dual-col-icon dual-col-icon-account" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                    <rect x="2" y="6" width="20" height="14" rx="2"/>
                    <path d="M2 10h20"/>
                    <path d="M6 14h4"/>
                  </svg>
                  <span class="dual-col-name">{{ selectedAccount?.name || 'Select account' }}</span>
                  <svg class="field-chevron dual-col-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <span v-if="selectedAccount" class="dual-col-meta">
                  {{ formatCurrency(selectedAccount.current_balance ?? selectedAccount.balance ?? 0, selectedAccount.currency) }}
                </span>
              </button>
            </div>
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

          <!-- Title -->
          <div class="field-underline">
            <label class="field-label">Title</label>
            <input
              v-model="form.title"
              type="text"
              class="field-input"
              placeholder="Optional"
            />
          </div>

          <!-- Category (income/expense only) -->
          <div v-if="showCategorySection" class="field-category">
            <label class="field-label">Category</label>
            <button
              type="button"
              class="category-field-line field-trigger"
              @click="showCategoryPicker = true"
            >
              <span
                class="category-field-value"
                :class="{ 'category-field-placeholder': !categoryText }"
              >{{ categoryText || 'Select category' }}</span>
              <svg class="field-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
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
            <button
              v-if="showBrowseAllCategories"
              type="button"
              class="category-browse-all"
              @click="showCategoryPicker = true"
            >
              <span class="category-browse-all-label">Browse all categories</span>
              <span class="category-browse-all-count">{{ categoryOptions.length }}</span>
              <svg class="category-browse-all-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
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
            @close="showCalculator = false"
            @select="onAmountSelect"
          />

          <!-- Description -->
          <div class="field-underline field-underline-last">
            <label class="field-label">Description</label>
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
      </div>
    </ion-content>

    <!-- Workspace / island picker (create, no workspace in URL) -->
    <ion-modal :is-open="showWorkspacePicker" @didDismiss="showWorkspacePicker = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Select island</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showWorkspacePicker = false">Cancel</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-searchbar v-model="workspaceSearchQuery" placeholder="Search..." debounce="150" />
        <ion-list>
          <ion-item
            v-for="w in filteredWorkspaceOptions"
            :key="w.id === null || w.id === undefined ? 'default' : w.id"
            button
            @click="selectWorkspace(w.id)"
          >
            <ion-label>
              {{ w.name }}
              <span v-if="w.tenant_name" class="workspace-item-tenant"> · {{ w.tenant_name }}</span>
            </ion-label>
          </ion-item>
          <ion-item v-if="filteredWorkspaceOptions.length === 0">
            <ion-label color="medium">No islands</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

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
      :workspace-id="categoryFormWorkspaceId"
      @close="showCategoryForm = false"
      @success="onCategoryFormSuccess"
    />
  </ion-page>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonSearchbar, IonList, IonItem, IonLabel } from '@ionic/vue'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import CategoryForm from '@/views/categories/components/CategoryForm.vue'
import DatePicker from '@/components/DatePicker.vue'
import TimePicker from '@/components/TimePicker.vue'
import AmountCalculator from '@/components/AmountCalculator.vue'
import { createTransaction, updateTransaction, getTransactionById, deleteTransaction, getCategoryTree, getPrimaryAccount } from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces } from '@/api/workspace'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'
import { useSyncStore } from '@/store/sync'
import { invalidateAccountingCache } from '@/db/readCache'

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
const showWorkspacePicker = ref(false)
const workspaceSearchQuery = ref('')
const workspaceOptions = ref([])
const manualWorkspaceId = ref(null)
const workspacePicked = ref(false)
/** Workspace of the transaction’s account (edit mode); used when URL has no workspace_id. */
const editWorkspaceId = ref(null)
/** Skips form.type watcher reset while hydrating edit payload (avoids clearing category_id). */
const suppressTypeWatchReset = ref(false)

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

/** How many category chips to show before offering “browse all”. */
const CATEGORY_PILL_PREVIEW_COUNT = 6

const suggestedCategoryPills = computed(() =>
  categoryOptions.value.slice(0, CATEGORY_PILL_PREVIEW_COUNT)
)

const showBrowseAllCategories = computed(
  () => categoryOptions.value.length > CATEGORY_PILL_PREVIEW_COUNT
)

function selectCategory(value) {
  form.category_id = value
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

/** From URL (?workspace_id=) when opening create from an island */
const workspaceIdFromRoute = computed(() => {
  const id = route.query.workspace_id
  return id != null && id !== '' ? Number(id) : null
})

/**
 * Resolved workspace for API calls: number = island, null = default (no workspace), undefined = create flow and user has not chosen yet.
 */
const effectiveWorkspaceId = computed(() => {
  if (isEdit) {
    return workspaceIdFromRoute.value ?? editWorkspaceId.value ?? null
  }
  if (workspaceIdFromRoute.value != null) {
    return workspaceIdFromRoute.value
  }
  if (!workspacePicked.value) {
    return undefined
  }
  return manualWorkspaceId.value
})

/** Minimal account rows for pickers without GET /api/accounting/accounts (matches mobile: no account list fetch). */
function syntheticAccount({ id, name, currency, workspaceId = null }) {
  const nid = Number(id)
  if (Number.isNaN(nid)) return null
  return {
    id: nid,
    name: (name && String(name).trim()) || `Account ${nid}`,
    current_balance: null,
    balance: null,
    currency: currency || 'USD',
    type: null,
    credit_limit: null,
    is_active: true,
    workspace_id: workspaceId
  }
}

function mergeUniqueAccounts(rows) {
  const map = new Map()
  for (const a of rows) {
    if (!a || a.id == null) continue
    const nid = Number(a.id)
    if (Number.isNaN(nid)) continue
    map.set(nid, { ...a, id: nid })
  }
  return [...map.values()]
}

function setAccountOptionsFromTransaction(t) {
  const rows = []
  const cur = t.currency || 'USD'
  const ws =
    t.account_workspace_id != null && t.account_workspace_id !== ''
      ? Number(t.account_workspace_id)
      : null
  const aid = t.account_id != null ? Number(t.account_id) : null
  const toId = t.to_account_id != null ? Number(t.to_account_id) : null
  if (aid != null && !Number.isNaN(aid)) {
    const row = syntheticAccount({ id: aid, name: t.account_name, currency: cur, workspaceId: ws })
    if (row) rows.push(row)
  }
  if (toId != null && !Number.isNaN(toId) && toId !== aid) {
    const row = syntheticAccount({ id: toId, name: t.to_account_name, currency: cur, workspaceId: ws })
    if (row) rows.push(row)
  }
  accountOptions.value = mergeUniqueAccounts(rows)
}

function filterAccountOptionsToWorkspace() {
  if (isEdit) return
  const wid = effectiveWorkspaceId.value
  accountOptions.value = accountOptions.value.filter((a) => {
    const w = a.workspace_id
    if (wid == null) return w == null || w === undefined || w === ''
    return Number(w) === Number(wid)
  })
}

/** @returns {{ primaryId: number | null }} */
async function hydrateCreateAccountOptions() {
  const rows = []
  const qAid = route.query.account_id
  const accountId = qAid != null && qAid !== '' ? Number(qAid) : null
  let nameHint = ''
  if (route.query.account_name) {
    try {
      nameHint = decodeURIComponent(String(route.query.account_name))
    } catch {
      nameHint = String(route.query.account_name)
    }
  }
  const cur = form.currency || 'USD'
  const curFromQuery = route.query.currency ? String(route.query.currency) : cur

  let wsForRow = null
  if (workspaceIdFromRoute.value != null) wsForRow = workspaceIdFromRoute.value
  else if (route.query.default_island === '1') wsForRow = null
  else if (workspacePicked.value) wsForRow = manualWorkspaceId.value

  if (accountId != null && !Number.isNaN(accountId)) {
    const row = syntheticAccount({
      id: accountId,
      name: nameHint || 'Account',
      currency: curFromQuery,
      workspaceId: wsForRow
    })
    if (row) rows.push(row)
  }

  let primaryId = null
  try {
    const res = await getPrimaryAccount()
    primaryId = res?.data?.account_id ?? res?.account_id ?? null
    if (primaryId != null && !rows.some((r) => Number(r.id) === Number(primaryId))) {
      const row = syntheticAccount({
        id: primaryId,
        name: 'Primary account',
        currency: cur,
        workspaceId: null
      })
      if (row) rows.push(row)
    }
  } catch (_) {}

  accountOptions.value = mergeUniqueAccounts(rows)
  filterAccountOptionsToWorkspace()
  return { primaryId }
}

const showWorkspaceRow = computed(() => {
  if (isEdit) return false
  if (workspaceIdFromRoute.value != null) return false
  if (route.query.default_island === '1') return false
  return true
})

const showCategorySection = computed(() => {
  if (form.type === 'transfer') return false
  if (isEdit) return true
  return effectiveWorkspaceId.value !== undefined
})

const selectedWorkspaceLabel = computed(() => {
  if (isEdit) {
    const wid = workspaceIdFromRoute.value ?? editWorkspaceId.value
    if (wid == null) {
      const d = workspaceOptions.value.find(o => o.id === null)
      return d?.name || 'Default Island'
    }
    const name = route.query.workspace_name
    if (name && workspaceIdFromRoute.value != null) {
      try {
        return decodeURIComponent(String(name))
      } catch {
        return String(name)
      }
    }
    const w = workspaceOptions.value.find(o => o.id === wid)
    return w?.name || 'Island'
  }
  if (route.query.default_island === '1') {
    const name = route.query.workspace_name
    if (name) {
      try {
        return decodeURIComponent(String(name))
      } catch {
        return String(name)
      }
    }
    return 'Default Island'
  }
  if (workspaceIdFromRoute.value != null) {
    const name = route.query.workspace_name
    if (name) {
      try {
        return decodeURIComponent(String(name))
      } catch {
        return String(name)
      }
    }
    const w = workspaceOptions.value.find(o => o.id === workspaceIdFromRoute.value)
    return w?.name || 'Island'
  }
  if (!workspacePicked.value) return 'Select island'
  if (manualWorkspaceId.value == null) {
    const d = workspaceOptions.value.find(o => o.id === null)
    return d?.name || 'Default Island'
  }
  const w = workspaceOptions.value.find(o => o.id === manualWorkspaceId.value)
  return w?.name || 'Island'
})

const filteredWorkspaceOptions = computed(() => {
  const q = (workspaceSearchQuery.value || '').trim().toLowerCase()
  if (!q) return workspaceOptions.value
  return workspaceOptions.value.filter(w => (w.name || '').toLowerCase().includes(q))
})

/** Pass through to CategoryForm; null = default-tenant categories */
const categoryFormWorkspaceId = computed(() => {
  if (!showCategorySection.value) return null
  const v = effectiveWorkspaceId.value
  return v === undefined ? null : v
})

async function loadWorkspaceOptions() {
  try {
    const [ownRes, sharedRes] = await Promise.all([getWorkspaces(), getSharedWorkspaces()])
    const own = Array.isArray(ownRes?.data) ? ownRes.data : []
    const shared = Array.isArray(sharedRes?.data?.active) ? sharedRes.data.active : []
    const opts = [{ id: null, name: 'Default Island' }]
    for (const ws of own) {
      opts.push({ id: Number(ws.id), name: ws.name || 'My island', is_shared: false })
    }
    for (const ws of shared) {
      opts.push({
        id: Number(ws.id),
        name: ws.name || 'Shared island',
        is_shared: true,
        tenant_name: ws.tenant_name
      })
    }
    workspaceOptions.value = opts
  } catch (_) {
    workspaceOptions.value = [{ id: null, name: 'Default Island' }]
  }
}

function selectWorkspace(wsId) {
  manualWorkspaceId.value = wsId
  workspacePicked.value = true
  form.category_id = null
  showWorkspacePicker.value = false
  loadOptions().then(() => {
    filterAccountOptionsToWorkspace()
    if (form.account_id != null && !accountOptions.value.some(a => Number(a.id) === Number(form.account_id))) {
      form.account_id = null
    }
    loadCategories()
    checkCreditLimit()
  })
}

/** Currencies only — no GET /api/accounting/accounts (mobile loads accounts once; we use synthetic rows). */
async function loadOptions() {
  try {
    const curRes = await getTenantCurrencies().catch(() => ({ data: { data: [{ code: 'USD', name: 'USD' }] } }))
    const cur = curRes?.data?.data ?? curRes?.data
    if (Array.isArray(cur) && cur.length) {
      currencyOptions.value = cur.map((c) => ({ value: c.code, text: `${c.code} - ${c.name || c.code}` }))
    }
    if (!isEdit) {
      const def = await getTenantDefaultCurrency().catch(() => null)
      const dc = def?.data?.data ?? def?.data
      if (dc?.code) form.currency = dc.code
      else if (currencyOptions.value.length && !form.currency) form.currency = currencyOptions.value[0].value
    }
  } catch (_) {
    if (!form.currency) form.currency = 'USD'
  }
}

async function loadCategories() {
  if (form.type === 'transfer') {
    categoryOptions.value = []
    return
  }
  const ws = effectiveWorkspaceId.value
  if (ws === undefined) {
    categoryOptions.value = []
    return
  }
  try {
    const r = await getCategoryTree(form.type, ws)
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
    if (suppressTypeWatchReset.value) return
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
  suppressTypeWatchReset.value = true
  try {
    const r = await getTransactionById(id)
    const t = r?.data || r
    if (!t) return

    const catId = t.category_id != null ? Number(t.category_id) : null
    const aid = t.account_id != null ? Number(t.account_id) : null
    const toId = t.to_account_id != null ? Number(t.to_account_id) : null

    editWorkspaceId.value = null
    const aw = t.account_workspace_id
    if (aw != null && aw !== '') {
      editWorkspaceId.value = Number(aw)
    }

    form.transaction_number = t.transaction_number || ''
    form.title = t.title || ''
    form.amount = parseFloat(t.amount) || 0
    form.currency = t.currency || 'USD'
    form.description = t.description || ''
    form.transaction_date = normalizeTransactionDateTime(t.transaction_date)
    form.status = t.status || 'completed'
    form.account_id = aid
    form.to_account_id = toId
    form.category_id = null
    form.type = t.type || 'income'

    setAccountOptionsFromTransaction(t)
    await loadOptions()
    await loadCategories()
    await nextTick()
    form.category_id = catId
  } catch (e) {
    showToast('Failed to load')
    router.back()
  } finally {
    suppressTypeWatchReset.value = false
  }
}

async function submit(stayAndAddNew = false) {
  const amt = Number(form.amount)
  if (!isEdit && effectiveWorkspaceId.value === undefined) {
    showToast('Select an island')
    return
  }
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
    await invalidateAccountingCache({ accounts: false, categories: false })
    syncStore.addInvalidatedAccountIds([form.account_id, form.to_account_id].filter(Boolean))

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
    await invalidateAccountingCache({ accounts: false, categories: false })
    router.back()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

onMounted(async () => {
  await loadWorkspaceOptions()

  if (!isEdit && workspaceIdFromRoute.value != null) {
    workspacePicked.value = true
  }

  if (!isEdit && route.query.default_island === '1') {
    workspacePicked.value = true
    manualWorkspaceId.value = null
  }

  if (isEdit) {
    editWorkspaceId.value = null
    await loadEdit()
  } else {
    await loadOptions()
    const queryType = route.query.type
    const queryAccountId = route.query.account_id
    if (queryType && validTypes.includes(queryType)) form.type = queryType
    form.transaction_number = `TXN-${Date.now()}`
    form.transaction_date = getCurrentDateTimeString()
    form.amount = 0
    await loadCategories()
    const { primaryId } = await hydrateCreateAccountOptions()
    const accountId = queryAccountId != null && queryAccountId !== '' ? Number(queryAccountId) : null
    if (accountId != null && accountOptions.value.some((a) => Number(a.id) === accountId)) {
      form.account_id = accountId
    } else if (
      primaryId != null &&
      accountOptions.value.some((a) => Number(a.id) === Number(primaryId))
    ) {
      form.account_id = primaryId
    }
    checkCreditLimit()
  }
})
</script>

<style scoped>
.workspace-item-tenant {
  font-size: 13px;
  font-weight: 400;
  color: #a8a8a8;
}

.transaction-form-page {
  --background: #fff;
}

.transaction-form-page ion-content {
  --background: #fff;
}

.page-container {
  padding: 0 22px;
  padding-top: env(safe-area-inset-top, 12px);
  padding-bottom: calc(env(safe-area-inset-bottom) + 32px);
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
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  text-align: center;
  letter-spacing: -0.02em;
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

.header-icon-delete {
  color: rgba(195, 0, 16, 0.75);
}

/* Transaction Switch — light track, white pill + colored label when active */
.transaction-switch {
  display: flex;
  align-items: center;
  background: #e8e8ea;
  border-radius: 999px;
  padding: 3px;
  margin-bottom: 20px;
}

.switch-tab {
  flex: 1;
  padding: 10px 8px;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: #9a9a9e;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  appearance: none;
  outline: none;
}

.switch-tab::-moz-focus-inner {
  border: 0;
  padding: 0;
}

.switch-tab:focus:not(:focus-visible) {
  outline: none;
}

.switch-tab:focus-visible {
  outline: 2px solid rgba(255, 141, 40, 0.45);
  outline-offset: 2px;
}

.switch-tab.active {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.switch-tab.income.active {
  color: #52bf90;
}

.switch-tab.expense.active {
  color: #c30010;
}

.switch-tab.transfer.active {
  color: #1989fa;
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
  padding: 16px 0;
  border-bottom: 1px solid rgba(168, 168, 168, 0.55);
  gap: 12px;
}

.field-datetime-row {
  flex-wrap: nowrap;
}

.datetime-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  padding: 4px 0;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a2e;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.datetime-trigger-text {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.datetime-icon {
  flex-shrink: 0;
  color: #a8a8a8;
}

/* Island + account columns */
.field-workspace-account-row {
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 18px 0;
  border-bottom: 1px solid rgba(168, 168, 168, 0.55);
}

.dual-col {
  flex: 1;
  min-width: 0;
}

.dual-col-divider {
  width: 1px;
  flex-shrink: 0;
  margin: 0 12px;
  background: rgba(168, 168, 168, 0.45);
  align-self: stretch;
  min-height: 44px;
}

.dual-col-block {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  text-align: left;
  font: inherit;
  color: inherit;
}

.dual-col-block--clickable {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.dual-col-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dual-col-icon {
  flex-shrink: 0;
  color: #a8a8a8;
}

.dual-col-name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dual-col-chevron {
  flex-shrink: 0;
}

.dual-col-meta {
  display: block;
  margin-top: 6px;
  padding-left: 30px;
  font-size: 13px;
  font-weight: 500;
  color: #a8a8a8;
  line-height: 1.3;
}


.field-category {
  padding: 18px 0;
  border-bottom: 1px solid rgba(168, 168, 168, 0.55);
}

.field-category .field-label {
  margin-bottom: 8px;
}

.category-field-line {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 12px;
  margin-bottom: 4px;
  border: none;
  border-bottom: 1px solid rgba(168, 168, 168, 0.55);
  background: none;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a2e;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.category-field-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-field-placeholder {
  color: #a8a8a8;
  font-weight: 400;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 141, 40, 0.55);
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  color: #ff8d28;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.category-pill.active {
  background: rgba(255, 141, 40, 0.12);
  color: #e56700;
  border-color: rgba(255, 141, 40, 0.75);
}

.category-pill-add {
  background: transparent;
  border: 1.5px solid rgba(255, 141, 40, 0.65);
  color: #ff8d28;
  font-weight: 600;
}

.category-browse-all {
  width: 100%;
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 141, 40, 0.5);
  background: rgba(255, 141, 40, 0.08);
  color: #ff8d28;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  appearance: none;
  outline: none;
  transition: background 0.15s, border-color 0.15s;
}

.category-browse-all:active {
  background: rgba(255, 141, 40, 0.14);
  border-color: rgba(255, 141, 40, 0.65);
}

.category-browse-all:focus-visible {
  outline: 2px solid rgba(255, 141, 40, 0.45);
  outline-offset: 2px;
}

.category-browse-all-label {
  flex: 1;
  min-width: 0;
}

.category-browse-all-count {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: #e56700;
  background: rgba(255, 141, 40, 0.16);
  padding: 5px 9px;
  border-radius: 999px;
}

.category-browse-all-chevron {
  flex-shrink: 0;
  color: #ff8d28;
  opacity: 0.9;
}

.field-underline {
  border-bottom: 1px solid rgba(168, 168, 168, 0.55);
  padding: 18px 0;
}

.field-underline-last {
  border-bottom: none;
  padding-bottom: 8px;
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

</style>
