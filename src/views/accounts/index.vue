<template>
  <ion-page class="accounts-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <div class="page-header">
          <span class="page-title">Accounts</span>
          <div class="header-actions">
            <button class="icon-btn" @click="showSearch = !showSearch">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button class="icon-btn" @click="showSortMenu = !showSortMenu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/>
              </svg>
            </button>
            <button class="icon-btn add-btn" @click="openAddAccount">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="showSearch" class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search accounts..."
            class="search-input"
            @input="filterAccounts"
          />
        </div>

        <div class="accounts-island" v-if="!loading">
          <div v-if="myAccounts.length" class="account-section">
            <div class="section-header">
              <span class="section-title">My Accounts</span>
            </div>
            <div class="account-list">
              <div
                v-for="account in myAccounts"
                :key="account.id"
                class="account-item"
                @click="goFlowLog(account)"
              >
                <div class="account-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8D28" stroke-width="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="3"/>
                    <path d="M2 10h20"/>
                  </svg>
                </div>
                <div class="account-info">
                  <span class="account-name">{{ account.name }}</span>
                  <span class="account-meta">
                    {{ formatType(account.type || account.account_type) }}
                    <template v-if="account.currency"> · {{ account.currency }}</template>
                  </span>
                </div>
                <div class="account-end">
                  <span
                    v-if="account.current_balance != null || account.balance != null"
                    class="account-balance"
                    :class="(account.current_balance ?? account.balance ?? 0) >= 0 ? 'positive' : 'negative'"
                  >
                    {{ formatCurrency(account.current_balance ?? account.balance ?? 0, account.currency) }}
                  </span>
                  <button class="more-btn" @click.stop="openAccountOptions(account)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#6E6A7C">
                      <circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="sharedAccounts.length" class="account-section">
            <div class="section-header">
              <span class="section-title">Shared with Me</span>
            </div>
            <div class="account-list">
              <div
                v-for="account in sharedAccounts"
                :key="account.id"
                class="account-item"
                @click="goFlowLog(account)"
              >
                <div class="account-icon shared">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6E6A7C" stroke-width="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div class="account-info">
                  <span class="account-name">{{ account.name }}</span>
                  <span class="account-meta">
                    {{ formatType(account.type || account.account_type) }}
                    <template v-if="account.currency"> · {{ account.currency }}</template>
                  </span>
                </div>
                <div class="account-end">
                  <span
                    v-if="account.current_balance != null || account.balance != null"
                    class="account-balance"
                    :class="(account.current_balance ?? account.balance ?? 0) >= 0 ? 'positive' : 'negative'"
                  >
                    {{ formatCurrency(account.current_balance ?? account.balance ?? 0, account.currency) }}
                  </span>
                  <button class="more-btn" @click.stop="openAccountOptions(account)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#6E6A7C">
                      <circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!myAccounts.length && !sharedAccounts.length" class="empty-state">
            <p>No accounts found</p>
            <button class="add-first-btn" @click="openAddAccount">Add your first account</button>
          </div>
        </div>

        <div v-else class="loading-state">
          <ion-spinner name="crescent" />
        </div>
      </div>

      <div class="tab-spacer" />
    </ion-content>

    <ion-action-sheet
      :is-open="showOptions"
      :header="optionsAccount?.name"
      :buttons="accountOptionButtons"
      @didDismiss="onOptionsDismiss"
    />

    <ion-action-sheet
      :is-open="showSortMenu"
      header="Sort accounts"
      :buttons="sortButtons"
      @didDismiss="onSortDismiss"
    />

    <AccountForm
      :is-open="formOpen"
      :account="currentAccount"
      @close="formOpen = false"
      @success="onFormSuccess"
    />

    <ReconcileModal
      :visible="reconcileVisible"
      :account="accountForReconcile"
      @close="reconcileVisible = false"
      @success="onReconcileSuccess"
    />

    <FloatingAddButton @select="onFabSelect" />

  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onIonViewDidEnter } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonSpinner, IonActionSheet } from '@ionic/vue'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getAccounts, deleteAccount } from '@/api/accounting'
import { useSyncStore } from '@/store/sync'
import { refreshBootstrapCache } from '@/utils/bootstrapCache'
import { invalidateAccountingCache } from '@/db/readCache'
import AccountForm from './components/AccountForm.vue'
import ReconcileModal from './components/ReconcileModal.vue'
import FloatingAddButton from '@/components/dashboard/FloatingAddButton.vue'


const router = useRouter()
const syncStore = useSyncStore()

const allAccounts = ref([])
const loading = ref(false)
const searchQuery = ref('')
const showSearch = ref(false)
const showOptions = ref(false)
const showSortMenu = ref(false)
const optionsAccount = ref(null)
const formOpen = ref(false)
const currentAccount = ref(null)
const reconcileVisible = ref(false)
const accountForReconcile = ref(null)
const sortField = ref('name')

const filteredAccounts = computed(() => {
  let list = [...allAccounts.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => a.name?.toLowerCase().includes(q))
  }
  list.sort((a, b) => {
    if (sortField.value === 'balance') {
      return (b.current_balance ?? b.balance ?? 0) - (a.current_balance ?? a.balance ?? 0)
    }
    return (a.name || '').localeCompare(b.name || '')
  })
  return list
})

const myAccounts = computed(() =>
  filteredAccounts.value.filter(a => !a.is_shared)
)

const sharedAccounts = computed(() =>
  filteredAccounts.value.filter(a => a.is_shared)
)

const accountOptionButtons = [
  { text: 'View Flow Log', role: 'flow-log' },
  { text: 'Add Transaction', role: 'add-transaction' },
  { text: 'Reconcile', role: 'reconcile' },
  { text: 'Edit', role: 'edit' },
  { text: 'Delete', role: 'destructive', cssClass: 'action-sheet-danger' },
  { text: 'Cancel', role: 'cancel' }
]

const sortButtons = [
  { text: 'Sort by Name', role: 'name' },
  { text: 'Sort by Balance', role: 'balance' },
  { text: 'Cancel', role: 'cancel' }
]

function formatCurrency(v, code) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code || 'USD',
    minimumFractionDigits: 2
  }).format(v || 0)
}

function formatType(type) {
  const map = {
    bank: 'Bank', cash: 'Cash', credit_card: 'Credit Card',
    loan: 'Loan', savings: 'Savings', investment: 'Investment', other: 'Other'
  }
  return map[type] || type || ''
}

function goFlowLog(account) {
  const name = encodeURIComponent(account.name || 'Account')
  const cur = encodeURIComponent(account.currency || 'USD')
  router.push(`/accounts/${account.id}/flow-log?name=${name}&currency=${cur}`)
}

function openAccountOptions(account) {
  optionsAccount.value = { ...account }
  showOptions.value = true
}

function onOptionsDismiss(ev) {
  const role = ev.detail?.role
  const account = optionsAccount.value
  showOptions.value = false

  if (!account || role === 'cancel' || role === 'backdrop') return

  if (role === 'flow-log') goFlowLog(account)
  else if (role === 'add-transaction') router.push(`/transactions/create?account_id=${account.id}`)
  else if (role === 'reconcile') openReconcile(account)
  else if (role === 'edit') openEditAccount(account)
  else if (role === 'destructive') onDelete(account)
}

function onSortDismiss(ev) {
  const role = ev.detail?.role
  showSortMenu.value = false
  if (role === 'name' || role === 'balance') sortField.value = role
}

function openAddAccount() {
  currentAccount.value = null
  formOpen.value = true
}

function openEditAccount(account) {
  currentAccount.value = { ...account }
  formOpen.value = true
}

function openReconcile(account) {
  accountForReconcile.value = { ...account }
  reconcileVisible.value = true
}

async function onReconcileSuccess() {
  reconcileVisible.value = false
  accountForReconcile.value = null
  await invalidateAccountingCache({ accounts: true })
  await load()
}

async function onFormSuccess() {
  formOpen.value = false
  currentAccount.value = null
  await invalidateAccountingCache({ accounts: true })
  await load()
}

async function onDelete(account) {
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${account.name}"?` })
    const res = await deleteAccount(account.id)
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'Deleted')
    await invalidateAccountingCache({ accounts: true })
    await load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

function filterAccounts() { /* reactive via computed */ }

function onFabSelect(type) {
  router.push(`/transactions/create?type=${type}`)
}


async function load() {
  loading.value = true
  try {
    const res = await getAccounts()
    const data = res?.data ?? res ?? []
    allAccounts.value = Array.isArray(data) ? data : []
  } catch (e) {
    showToast('Failed to load accounts')
    allAccounts.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
onIonViewDidEnter(async () => {
  if (syncStore.invalidatedAccountIds?.size > 0) syncStore.clearAllInvalidated()
  await load()
  refreshBootstrapCache().catch(() => {})
})
</script>

<style scoped>
.accounts-page {
  --background: #F5F5F7;
}

.accounts-page ion-content {
  --background: #F5F5F7;
}

.page-container {
  padding: 0 16px;
  padding-top: env(safe-area-inset-top, 20px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0 10px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A2E;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  -webkit-tap-highlight-color: transparent;
}

.search-bar {
  margin-bottom: 12px;
  min-width: 0;
}

.search-input {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #E8E8E8;
  background: #fff;
  font-size: 14px;
  color: #1A1A2E;
  outline: none;
}

.search-input:focus {
  border-color: #FF8D28;
}

.accounts-island {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.account-section {
  margin-bottom: 16px;
}

.account-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: #A7A7A7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px;
  border-bottom: 1px solid #F5F5F7;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.account-item:last-child {
  border-bottom: none;
}

.account-item:active {
  background: #F5F5F7;
  border-radius: 8px;
}

.account-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 141, 40, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.account-icon.shared {
  background: rgba(110, 106, 124, 0.1);
}

.account-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-meta {
  font-size: 11px;
  color: #A7A7A7;
}

.account-end {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.account-balance {
  font-size: 13px;
  font-weight: 600;
}

.account-balance.positive {
  color: #52BF90;
}

.account-balance.negative {
  color: rgba(195, 0, 16, 0.74);
}

.more-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  -webkit-tap-highlight-color: transparent;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.empty-state p {
  font-size: 14px;
  color: #A7A7A7;
  margin-bottom: 16px;
}

.add-first-btn {
  background: #FF8D28;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.tab-spacer {
  height: 80px;
}

.action-sheet-danger {
  color: rgba(195, 0, 16, 0.74) !important;
}
</style>
