<template>
  <Teleport to="ion-app">
    <Transition name="drawer-fade">
      <div v-if="isOpen" class="drawer-backdrop" @click="$emit('close')" />
    </Transition>
    <Transition name="drawer-slide">
      <div v-if="isOpen" class="drawer-sheet">
        <div class="drawer-handle" />
        <ion-header class="drawer-ion-header">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="$emit('close')">Cancel</ion-button>
            </ion-buttons>
            <ion-title>{{ isEdit ? 'Edit Account' : 'Add New Account' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button :disabled="saving || saveDisabled" @click="submit">
                {{ saving ? 'Saving...' : (isEdit ? 'Save' : 'Add') }}
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <div class="drawer-body-scroll">
        <form @submit.prevent="submit" class="drawer-form">
          <p v-if="isEdit && !canEditAccountMeta" class="form-permission-hint">
            You can view this account but do not have permission to change it.
          </p>
          <p v-else-if="!isEdit && workspaceOptions.length === 0" class="form-permission-hint">
            You do not have permission to add accounts in any workspace you can access.
          </p>
          <div class="form-group">
            <label class="form-label">Account Name</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="Enter account name"
              :disabled="formDisabled"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Island</label>
            <ion-select
              v-model="form.workspace_id"
              interface="action-sheet"
              placeholder="Select island"
              class="ion-select-inline"
              :disabled="formDisabled"
            >
              <ion-select-option v-for="w in workspaceOptions" :key="w.value ?? 'default'" :value="w.value">
                {{ w.text }}
              </ion-select-option>
            </ion-select>
          </div>

          <div v-if="!isEdit && showSuggestedNames" class="form-group">
            <label class="form-label-suggested">Suggested Account Names</label>
            <div class="suggested-pills">
              <button
                v-for="s in suggestedNames"
                :key="s"
                type="button"
                class="pill"
                :disabled="formDisabled"
                @click="selectSuggestedName(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Currency</label>
              <ion-select
                v-model="form.currency"
                interface="action-sheet"
                placeholder="Select currency"
                class="ion-select-inline"
                :disabled="formDisabled"
              >
                <ion-select-option v-for="c in currencyOptions" :key="c.code" :value="c.code">
                  {{ c.name }} ({{ c.code }})
                </ion-select-option>
              </ion-select>
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Account Type</label>
              <ion-select
                v-model="form.type"
                interface="action-sheet"
                placeholder="Select type"
                class="ion-select-inline"
                :disabled="formDisabled"
              >
                <ion-select-option v-for="t in typeOptions" :key="t.value" :value="t.value">
                  {{ t.text }}
                </ion-select-option>
              </ion-select>
            </div>
          </div>

          <div v-if="form.type !== 'cash'" class="form-group">
            <label class="form-label">Account Number</label>
            <input
              v-model="form.account_number"
              type="text"
              class="form-input"
              placeholder="Optional"
              :disabled="formDisabled"
            />
          </div>

          <div v-if="!isEdit" class="form-group">
            <label class="form-label">Initial Balance</label>
            <input
              v-model.number="form.initial_balance"
              type="number"
              step="0.01"
              class="form-input"
              placeholder="0"
              :disabled="formDisabled"
            />
          </div>

          <div v-if="form.type === 'credit_card' || form.type === 'loan'" class="form-group">
            <label class="form-label">Credit Limit</label>
            <input
              v-model.number="form.credit_limit"
              type="number"
              step="0.01"
              class="form-input"
              placeholder="Optional"
              :disabled="formDisabled"
            />
          </div>

          <div v-if="form.type === 'bank' || form.type === 'savings'" class="form-group">
            <label class="form-label">Bank Name</label>
            <input
              v-model="form.bank_name"
              type="text"
              class="form-input"
              placeholder="Optional"
              :disabled="formDisabled"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="form.description"
              class="form-textarea"
              placeholder="Optional"
              rows="2"
              :disabled="formDisabled"
            />
          </div>

          <div v-if="isEdit" class="form-group">
            <label class="form-label">Status</label>
            <ion-select
              v-model="form.is_active"
              interface="action-sheet"
              placeholder="Select status"
              class="ion-select-inline"
              :disabled="formDisabled"
            >
              <ion-select-option :value="true">Active</ion-select-option>
              <ion-select-option :value="false">Inactive</ion-select-option>
            </ion-select>
          </div>
        </form>
        </div>
      </div>
    </Transition>

  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  IonSelect,
  IonSelectOption,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createAccount, updateAccount } from '@/api/accounting'
import { getWorkspaces } from '@/api/workspace'
import { getTenantCurrencies, getTenantDefaultCurrency } from '@/api/currency'
import { useUserStore } from '@/store/user'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  account: { type: Object, default: null },
  preselectedWorkspaceId: { type: [Number, String], default: null }
})

const emit = defineEmits(['close', 'success'])

const userStore = useUserStore()

const suggestedNames = ['Cash', 'Bank Account', 'Credit Card', 'PayPal','Binance Account']

const isEdit = computed(() => !!props.account?.id)
const saving = ref(false)
/** Shown only for new accounts; hidden after user picks a suggestion pill. */
const showSuggestedNames = ref(true)
const currencyOptions = ref([])
const workspaceOptions = ref([])
/** Raw GET /workspaces rows (includes permission_scope for invitees). */
const workspaceRows = ref([])

const typeOptions = [
  { text: 'Bank', value: 'bank' },
  { text: 'Cash', value: 'cash' },
  { text: 'Credit Card', value: 'credit_card' },
  { text: 'Loan', value: 'loan' },
  { text: 'Savings', value: 'savings' },
  { text: 'Investment', value: 'investment' },
  { text: 'Other', value: 'other' }
]

/** Aligns with accounts index: add account / edit account meta for invitees. */
function scopeAllowsAddAccount(scope) {
  if (!scope) return true
  return !!(scope.implicit_full || scope.full_access || scope.edit_transaction)
}

function scopeAllowsEditAccountMeta(scope) {
  if (!scope) return true
  return !!(scope.implicit_full || scope.full_access || scope.edit_transaction)
}

const canEditAccountMeta = computed(() => {
  if (!isEdit.value) return true
  const acc = props.account
  if (!acc?.id) return true
  const p = acc.permissions
  if (p && typeof p === 'object' && Object.prototype.hasOwnProperty.call(p, 'view')) {
    return !!(p.edit_transaction || p.full_access)
  }
  const wid = acc.workspace_id
  if (wid == null || wid === '') return true
  const row = workspaceRows.value.find((w) => Number(w.id) === Number(wid))
  const s = row?.permission_scope
  if (!s) return true
  return scopeAllowsEditAccountMeta(s)
})

const formDisabled = computed(() => isEdit.value && !canEditAccountMeta.value)

const saveDisabled = computed(
  () => formDisabled.value || (!isEdit.value && workspaceOptions.value.length === 0)
)

const form = reactive({
  name: '',
  account_number: '',
  type: 'bank',
  currency: 'USD',
  workspace_id: null,
  initial_balance: 0,
  credit_limit: null,
  bank_name: '',
  description: '',
  is_active: true
})

function toBoolean(v) {
  if (v === null || v === undefined) return true
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  return Boolean(v)
}

function rebuildWorkspaceOptions() {
  const list = workspaceRows.value
  const opts = []
  const editing = isEdit.value
  const currentWs =
    props.account?.workspace_id != null && props.account?.workspace_id !== ''
      ? Number(props.account.workspace_id)
      : null
  for (const w of Array.isArray(list) ? list : []) {
    const id = Number(w.id)
    const s = w.permission_scope
    if (editing) {
      if (!(scopeAllowsEditAccountMeta(s) || (currentWs != null && !Number.isNaN(currentWs) && id === currentWs))) {
        continue
      }
    } else if (!scopeAllowsAddAccount(s)) {
      continue
    }
    const name = w.name?.endsWith('Island') ? w.name : (w.name || 'My Island') + ' Island'
    opts.push({ value: id, text: name })
  }
  workspaceOptions.value = opts
}

async function loadWorkspaces() {
  try {
    const res = await getWorkspaces()
    const list = res?.data ?? []
    workspaceRows.value = Array.isArray(list) ? list : []
    rebuildWorkspaceOptions()
  } catch (_) {
    workspaceRows.value = []
    workspaceOptions.value = []
  }
}

async function loadCurrencies() {
  try {
    const res = await getTenantCurrencies()
    const data = res?.data ?? res
    const list = Array.isArray(data) ? data : (data?.data || [])
    currencyOptions.value = list
  } catch (_) {
    currencyOptions.value = [{ code: 'USD', name: 'US Dollar' }]
  }
}

/** New account: user preference if still enabled, else tenant default, else first enabled. */
async function applyDefaultCurrencyForNewAccountForm() {
  const list = currencyOptions.value
  if (!list.length) {
    form.currency = 'USD'
    return
  }
  const userCode = userStore.defaultCurrencyCode
  if (
    userCode &&
    list.some((c) => String(c.code).toUpperCase() === userCode)
  ) {
    form.currency = userCode
    return
  }
  try {
    const def = await getTenantDefaultCurrency()
    const d = def?.data?.data ?? def?.data ?? def
    const code = d?.code ? String(d.code).toUpperCase() : null
    if (code && list.some((c) => String(c.code).toUpperCase() === code)) {
      form.currency = code
      return
    }
  } catch (_) {
    /* fall through */
  }
  form.currency = list[0].code
}

function selectSuggestedName(s) {
  form.name = s
  showSuggestedNames.value = false
}

function resetForm() {
  const acc = props.account
  if (acc?.id) {
    form.name = acc.name || ''
    form.account_number = acc.account_number || ''
    form.type = acc.type || acc.account_type || 'bank'
    form.currency = acc.currency || 'USD'
    form.workspace_id = acc.workspace_id != null ? Number(acc.workspace_id) : null
    form.initial_balance = acc.initial_balance ?? 0
    form.credit_limit = acc.credit_limit ?? null
    form.bank_name = acc.bank_name || ''
    form.description = acc.description || ''
    form.is_active = toBoolean(acc.is_active)
    showSuggestedNames.value = false
  } else {
    showSuggestedNames.value = true
    form.name = ''
    form.account_number = ''
    form.type = 'bank'
    form.currency = 'USD'
    form.workspace_id = props.preselectedWorkspaceId != null ? Number(props.preselectedWorkspaceId) : null
    form.initial_balance = 0
    form.credit_limit = null
    form.bank_name = ''
    form.description = ''
    form.is_active = true
  }
}

watch(
  () => [props.isOpen, props.account],
  async ([open]) => {
    if (open) {
      await Promise.all([loadWorkspaces(), loadCurrencies()])
      resetForm()
      rebuildWorkspaceOptions()
      if (!props.account?.id) {
        if (
          form.workspace_id != null &&
          !workspaceOptions.value.some((o) => o.value === form.workspace_id)
        ) {
          form.workspace_id = workspaceOptions.value[0]?.value ?? null
        }
        await applyDefaultCurrencyForNewAccountForm()
      }
    }
  },
  { immediate: true }
)

async function submit() {
  if (isEdit.value && !canEditAccountMeta.value) {
    showToast('You do not have permission to edit this account')
    return
  }
  if (!isEdit.value) {
    if (workspaceOptions.value.length === 0) {
      showToast('You do not have permission to add accounts')
      return
    }
    if (
      form.workspace_id != null &&
      !workspaceOptions.value.some((o) => o.value === form.workspace_id)
    ) {
      showToast('You do not have permission to add accounts in this workspace')
      return
    }
  }
  const name = (form.name || '').trim()
  if (!name) {
    showToast('Enter account name')
    return
  }
  if (name.length < 2 || name.length > 255) {
    showToast('Name should be 2–255 characters')
    return
  }
  saving.value = true
  try {
    const data = {
      name,
      account_number:
        form.type === 'cash' ? null : (form.account_number?.trim() || null),
      type: form.type,
      currency: form.currency || 'USD',
      workspace_id: form.workspace_id != null ? form.workspace_id : null,
      credit_limit: (form.type === 'credit_card' || form.type === 'loan') ? (form.credit_limit ?? null) : null,
      bank_name: (form.type === 'bank' || form.type === 'savings') ? (form.bank_name?.trim() || null) : null,
      description: form.description?.trim() || null,
      is_active: form.is_active
    }
    if (!isEdit.value) data.initial_balance = form.initial_balance ?? 0

    const res = isEdit.value
      ? await updateAccount(props.account.id, data)
      : await createAccount(data)
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : (isEdit.value ? 'Updated' : 'Created'))
    emit('success')
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
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
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
  background: #fff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  z-index: 1001;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.drawer-ion-header {
  flex-shrink: 0;
}

.drawer-body-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.drawer-handle {
  width: 36px;
  height: 4px;
  background: #D6D9DD;
  border-radius: 2px;
  margin: 12px auto 8px;
}

.drawer-form {
  padding: 0 24px 24px;
}

.form-permission-hint {
  margin: 0 0 16px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.4;
  color: #5c5c6e;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group.flex-1 {
  flex: 1;
  min-width: 0;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
  margin-bottom: 6px;
}

.form-label-suggested {
  display: block;
  font-size: 12px;
  color: #A7A7A7;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 0;
  border: none;
  border-bottom: 1px solid #E8E8E8;
  background: transparent;
  font-size: 15px;
  color: #1A1A2E;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-bottom-color: #FF8D28;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #A7A7A7;
}

.ion-select-inline {
  width: 100%;
  padding: 10px 0;
  padding-inline-start: 0;
  padding-inline-end: 0;
  border: none;
  border-bottom: 1px solid #E8E8E8;
  border-radius: 0;
  background: transparent;
  font-size: 15px;
  color: #1A1A2E;
  max-width: 100%;
}

.ion-select-inline::part(container) {
  border: none;
  background: transparent;
}

.form-textarea {
  resize: none;
  min-height: 60px;
}

.suggested-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  padding: 8px 14px;
  border-radius: 20px;
  border: none;
  background: rgba(255, 141, 40, 0.15);
  color: #E67A00;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.pill:hover,
.pill:active {
  background: rgba(255, 141, 40, 0.25);
}

/* Transitions */
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
