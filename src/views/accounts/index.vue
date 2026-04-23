<template>
  <ion-page class="accounts-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <div class="page-header" :class="{ 'above-menu-backdrop': showAddMenu }">
          <span class="page-title">
            Accounts
            <span v-if="workspaceMode === 'private'" class="workspace-mode-badge">Private</span>
          </span>
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
            <div class="add-btn-wrapper">
              <button
                class="icon-btn add-btn"
                @click="showAddMenu = !showAddMenu; closeIslandPopover(); closeAccountPopover()"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <Transition name="popover-fade">
                <div v-if="showAddMenu" class="add-popover" @click.stop>
                  <button class="popover-option" @click="onAddIsland">Add an Island</button>
                  <button
                    v-if="headerShowsAddAccount"
                    class="popover-option"
                    @click="onAddAccount"
                  >
                    Add an Account
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <Transition name="fade">
          <div
            v-if="showAddMenu || showIslandOptions || showOptions"
            class="add-menu-backdrop"
            @click="showAddMenu = false; closeIslandPopover(); closeAccountPopover()"
          />
        </Transition>

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
          <!-- Pending workspace invitations (cross-tenant) -->
          <section v-if="pendingWorkspaceInvitations.length" class="section-block">
            <h3 class="section-label">Invitations</h3>
            <div class="invitation-cards">
              <div
                v-for="inv in pendingWorkspaceInvitations"
                :key="'inv-' + inv.id"
                class="invitation-card"
              >
                <div class="invitation-text">
                  <p class="invitation-title">{{ formatInvitationMessage(inv) }}</p>
                </div>
                <div class="invitation-actions">
                  <button
                    type="button"
                    class="invitation-btn invitation-btn--decline"
                    :disabled="invitationBusyId === inv.id"
                    @click="onDeclineInvitation(inv)"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    class="invitation-btn invitation-btn--accept"
                    :disabled="invitationBusyId === inv.id"
                    @click="onAcceptInvitation(inv)"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- My Accounts -->
          <section v-if="myAccountsGroups.length" class="section-block">
            <h3 class="section-label">My Accounts</h3>
            <div class="island-cards">
              <div
                v-for="group in myAccountsGroups"
                :key="'my-' + (group.island.id ?? 'default')"
                class="island-card"
                :class="{
                  'above-menu-backdrop':
                    isIslandPopoverOpenFor(group) || groupHasOpenAccountPopover(group)
                }"
              >
                <div class="island-header">
                  <span class="island-name">{{ group.island.name.endsWith('Island') ? group.island.name : group.island.name + ' Island' }}</span>
                  <div class="island-more-wrapper" @click.stop>
                    <button type="button" class="more-btn icon-only" @click.stop="toggleIslandPopover(group, $event)">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF8D28">
                        <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                      </svg>
                    </button>
                    <Transition name="popover-fade">
                      <div
                        v-if="isIslandPopoverOpenFor(group)"
                        class="island-options-popover"
                        :class="{ 'island-options-popover--up': optionsPopoverOpenUp }"
                        @click.stop
                      >
                        <button
                          v-for="item in buildIslandMenuItems(group)"
                          :key="item.role"
                          type="button"
                          class="island-popover-option"
                          :class="{ destructive: item.destructive }"
                          @click="onIslandPopoverSelect(item.role, group)"
                        >
                          {{ item.label }}
                        </button>
                      </div>
                    </Transition>
                  </div>
                </div>
                <div v-if="group.accounts.length" class="account-rows">
                  <div
                    v-for="account in group.accounts"
                    :key="account.id"
                    class="account-row"
                    @click="goFlowLog(account)"
                  >
                    <div class="account-left">
                      <span class="account-name">{{ account.name }}</span>
                      <span class="account-updated">{{ formatUpdatedAgo(account) }}</span>
                    </div>
                    <div class="account-right">
                      <span v-if="account.current_balance != null || account.balance != null" class="account-balance">
                        {{ formatCurrency(account.current_balance ?? account.balance ?? 0, account.currency) }}
                      </span>
                      <ion-icon :icon="peopleOutline" class="group-icon" />
                      <div class="account-more-wrapper" @click.stop>
                        <button type="button" class="more-btn" @click.stop="toggleAccountPopover(account, group, $event)">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#A8A8A8">
                            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                          </svg>
                        </button>
                        <Transition name="popover-fade">
                          <div
                            v-if="isAccountPopoverOpenFor(account)"
                            class="island-options-popover"
                            :class="{ 'island-options-popover--up': optionsPopoverOpenUp }"
                            @click.stop
                          >
                            <button
                              v-for="item in buildAccountMenuItems(account, group)"
                              :key="item.role"
                              type="button"
                              class="island-popover-option"
                              :class="{ destructive: item.destructive }"
                              @click="onAccountPopoverSelect(item.role, account)"
                            >
                              {{ item.label }}
                            </button>
                          </div>
                        </Transition>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else-if="!group.hasAccountsRaw" class="workspace-empty-prompt">
                  <template v-if="islandScopeAllowsAddAccount(effectiveIslandPermissionScope(group.island))">
                    <p>Create your first account in this island to start tracking balances and transactions.</p>
                    <button type="button" class="add-first-btn" @click="openAddAccountForGroup(group)">
                      Create your first account
                    </button>
                  </template>
                  <template v-else>
                    <p>No accounts in this island yet.</p>
                  </template>
                </div>
                <p v-else class="workspace-search-empty">No accounts match your search.</p>
              </div>
            </div>
          </section>

          <!-- Shared with Me -->
          <section v-if="sharedWithMeGroups.length" class="section-block">
            <h3 class="section-label">Shared with Me</h3>
            <div class="island-cards">
              <div
                v-for="group in sharedWithMeGroups"
                :key="'shared-' + group.island.id"
                class="island-card"
                :class="{
                  'above-menu-backdrop':
                    isIslandPopoverOpenFor(group) || groupHasOpenAccountPopover(group)
                }"
              >
                <div class="island-header">
                  <span class="island-name shared">
                    {{ group.island.tenant_name ? `${group.island.tenant_name}'s ${group.island.name}` : group.island.name }}{{ (!group.island.name || !group.island.name.toLowerCase().includes('island')) ? ' Island' : '' }}
                  </span>
                  <div class="island-more-wrapper" @click.stop>
                    <button type="button" class="more-btn icon-only" @click.stop="toggleIslandPopover(group, $event)">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF8D28">
                        <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                      </svg>
                    </button>
                    <Transition name="popover-fade">
                      <div
                        v-if="isIslandPopoverOpenFor(group)"
                        class="island-options-popover"
                        :class="{ 'island-options-popover--up': optionsPopoverOpenUp }"
                        @click.stop
                      >
                        <button
                          v-for="item in buildIslandMenuItems(group)"
                          :key="item.role"
                          type="button"
                          class="island-popover-option"
                          :class="{ destructive: item.destructive }"
                          @click="onIslandPopoverSelect(item.role, group)"
                        >
                          {{ item.label }}
                        </button>
                      </div>
                    </Transition>
                  </div>
                </div>
                <div v-if="group.accounts.length" class="account-rows">
                  <div
                    v-for="account in group.accounts"
                    :key="account.id"
                    class="account-row"
                    @click="goFlowLog(account)"
                  >
                    <div class="account-left">
                      <span class="account-name">{{ account.name }}</span>
                      <span class="account-updated">{{ formatUpdatedAgo(account) }}</span>
                    </div>
                    <div class="account-right">
                      <span v-if="account.current_balance != null || account.balance != null" class="account-balance">
                        {{ formatCurrency(account.current_balance ?? account.balance ?? 0, account.currency) }}
                      </span>
                      <ion-icon :icon="peopleOutline" class="group-icon" title="Shared" />
                      <div class="account-more-wrapper" @click.stop>
                        <button type="button" class="more-btn" @click.stop="toggleAccountPopover(account, group, $event)">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#A8A8A8">
                            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                          </svg>
                        </button>
                        <Transition name="popover-fade">
                          <div
                            v-if="isAccountPopoverOpenFor(account)"
                            class="island-options-popover"
                            :class="{ 'island-options-popover--up': optionsPopoverOpenUp }"
                            @click.stop
                          >
                            <button
                              v-for="item in buildAccountMenuItems(account, group)"
                              :key="item.role"
                              type="button"
                              class="island-popover-option"
                              :class="{ destructive: item.destructive }"
                              @click="onAccountPopoverSelect(item.role, account)"
                            >
                              {{ item.label }}
                            </button>
                          </div>
                        </Transition>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else-if="!group.hasAccountsRaw" class="workspace-empty-prompt">
                  <template v-if="islandScopeAllowsAddAccount(effectiveIslandPermissionScope(group.island))">
                    <p>Create your first account in this island to start tracking balances and transactions.</p>
                    <button type="button" class="add-first-btn" @click="openAddAccountForGroup(group)">
                      Create your first account
                    </button>
                  </template>
                  <template v-else>
                    <p>No accounts in this island yet.</p>
                  </template>
                </div>
                <p v-else class="workspace-search-empty">No accounts match your search.</p>
              </div>
            </div>
          </section>

          <div
            v-if="!myAccountsGroups.length && !sharedWithMeGroups.length && !pendingWorkspaceInvitations.length"
            class="empty-state"
          >
            <p>No accounts found</p>
            <button
              v-if="anyIslandAllowsAddAccount"
              class="add-first-btn"
              @click="showAddMenu = true"
            >
              Add your first account
            </button>
          </div>
        </div>

        <div v-else class="loading-state">
          <ion-spinner name="crescent" />
        </div>
      </div>

      <div class="tab-spacer" />
    </ion-content>

    <ion-modal
      ref="sortModalRef"
      :is-open="showSortMenu"
      @didDismiss="showSortMenu = false"
      :initial-breakpoint="sortInitialBreakpoint"
      :breakpoints="sortBreakpoints"
      :handle="true"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Sort accounts</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="sort-sheet-content">
        <div class="adaptive-sheet-body">
        <ion-list lines="full">
          <ion-item button detail="false" @click="applyAccountSort('name')">
            <ion-label>Sort by Name</ion-label>
          </ion-item>
          <ion-item button detail="false" @click="applyAccountSort('balance')">
            <ion-label>Sort by Balance</ion-label>
          </ion-item>
          <ion-item button detail="false" lines="none" @click="showSortMenu = false">
            <ion-label color="medium">Cancel</ion-label>
          </ion-item>
        </ion-list>
        </div>
      </ion-content>
    </ion-modal>

    <AccountForm
      :is-open="formOpen"
      :account="currentAccount"
      :preselected-workspace-id="accountFormWorkspaceId ?? null"
      @close="formOpen = false; accountFormWorkspaceId = null"
      @success="onFormSuccess"
    />

    <IslandForm
      :is-open="islandFormOpen"
      :workspace="islandFormWorkspace"
      @close="islandFormOpen = false; islandFormWorkspace = null"
      @success="onIslandFormSuccess"
    />

    <ShareAccess
      :is-open="showShareAccess"
      :group="shareAccessGroup"
      @close="showShareAccess = false; shareAccessGroup = null"
      @success="onShareAccessSuccess"
    />

    <ReconcileModal
      :visible="reconcileVisible"
      :account="accountForReconcile"
      @close="reconcileVisible = false"
      @success="onReconcileSuccess"
    />

    <FloatingAddButton v-if="showAccountsFab" @select="onFabSelect" />

  </ion-page>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onIonViewDidEnter } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonIcon
} from '@ionic/vue'
import { peopleOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getAccounts, getAccountsByWorkspace, deleteAccount } from '@/api/accounting'
import {
  getWorkspaces,
  getSharedWorkspaces,
  deleteWorkspace,
  acceptWorkspaceInvitation,
  declineWorkspaceInvitation
} from '@/api/workspace'
import { useSyncStore } from '@/store/sync'
import { refreshBootstrapCache } from '@/utils/bootstrapCache'
import { invalidateAccountingCache, setCached, CACHE_KEYS } from '@/db/readCache'
import AccountForm from './components/AccountForm.vue'
import IslandForm from './components/IslandForm.vue'
import ShareAccess from './components/ShareAccess.vue'
import ReconcileModal from './components/ReconcileModal.vue'
import FloatingAddButton from '@/components/FloatingAddButton.vue'
import { useIonSheetHeight } from '@/composables/useIonSheetHeight'


const route = useRoute()
const router = useRouter()
const syncStore = useSyncStore()

const islandGroups = ref([]) // { island: { id, name, is_shared }, accounts: [] }
/** Cross-tenant workspaces with member_status === 'pending' from GET /workspaces/shared */
const pendingWorkspaceInvitations = ref([])
const invitationBusyId = ref(null)
const workspaceMode = ref('shared') // 'shared' | 'private' — driven by tenant setting
/** Start true so first paint shows loading until ionViewDidEnter runs load(). */
const loading = ref(true)
const searchQuery = ref('')
const showSearch = ref(false)
const showOptions = ref(false)
const showSortMenu = ref(false)
const optionsAccount = ref(null)
const formOpen = ref(false)
const currentAccount = ref(null)
const showAddMenu = ref(false)
/** Open island/account options popover above the trigger when there isn’t room below (tab bar / FAB). */
const optionsPopoverOpenUp = ref(false)
const islandFormOpen = ref(false)
const islandFormWorkspace = ref(null)
const showIslandOptions = ref(false)
const optionsGroup = ref(null)
const showShareAccess = ref(false)
const shareAccessGroup = ref(null)
const accountFormWorkspaceId = ref(null)
const reconcileVisible = ref(false)
const accountForReconcile = ref(null)
const sortField = ref('name')

const SORT_SHEET_PCT = 38

const {
  modalRef: sortModalRef,
  breakpoints: sortBreakpoints,
  initialBreakpoint: sortInitialBreakpoint
} = useIonSheetHeight(() => showSortMenu.value, SORT_SHEET_PCT)

function filterAndSortAccounts(accounts) {
  let list = [...(accounts || [])]
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
}

function effectiveIslandPermissionScope(island) {
  if (island?.permission_scope) return island.permission_scope
  if (!island?.is_shared) {
    return {
      view: true,
      add_transaction: true,
      edit_transaction: true,
      reconcile: true,
      full_access: true,
      implicit_full: true
    }
  }
  return {
    view: false,
    add_transaction: false,
    edit_transaction: false,
    reconcile: false,
    full_access: false,
    implicit_full: false
  }
}

function islandScopeAllowsView(scope) {
  return scope && !!scope.view
}

function islandScopeAllowsAddTransaction(scope) {
  return scope && !!(scope.add_transaction || scope.full_access || scope.implicit_full)
}

function islandScopeAllowsAddAccount(scope) {
  return scope && !!(scope.implicit_full || scope.full_access || scope.edit_transaction)
}

function islandScopeAllowsManageCategories(scope) {
  return scope && !!(scope.implicit_full || scope.full_access || scope.edit_transaction)
}

const islandGroupsFiltered = computed(() =>
  islandGroups.value.map(g => ({
    ...g,
    accounts: filterAndSortAccounts(g.accounts),
    hasAccountsRaw: (g.accounts || []).length > 0
  }))
)

const myAccountsGroups = computed(() =>
  islandGroupsFiltered.value.filter(g => !g.island.is_shared)
)

const sharedWithMeGroups = computed(() =>
  islandGroupsFiltered.value.filter(g => g.island.is_shared)
)

const showAccountsFab = computed(() =>
  islandGroupsFiltered.value.some((g) =>
    islandScopeAllowsAddTransaction(effectiveIslandPermissionScope(g.island))
  )
)

const anyIslandAllowsAddAccount = computed(() =>
  islandGroupsFiltered.value.some((g) =>
    islandScopeAllowsAddAccount(effectiveIslandPermissionScope(g.island))
  )
)

const headerShowsAddAccount = computed(() => anyIslandAllowsAddAccount.value)

/** Inviter label: prefer email (matches “user2@gami.com …”), then name, then fallback. */
function inviterDisplayLabel(inv) {
  if (inv.invited_by_email) return inv.invited_by_email
  if (inv.invited_by_name) return inv.invited_by_name
  return 'Someone'
}

/** Workspace phrase for “… invited you to the …” — lowercase, always ends with “island”. */
function workspacePhraseForInvite(inv) {
  const raw = (inv.name || 'workspace').trim()
  const lower = raw.toLowerCase()
  if (lower.endsWith('island')) return lower
  return `${lower} island`
}

function formatInvitationMessage(inv) {
  return `${inviterDisplayLabel(inv)} invited you to the ${workspacePhraseForInvite(inv)}`
}

async function onAcceptInvitation(inv) {
  const id = inv.id
  if (invitationBusyId.value != null) return
  invitationBusyId.value = id
  try {
    await acceptWorkspaceInvitation(id)
    showToast('Invitation accepted')
    await invalidateAccountingCache({ accounts: true })
    await load()
  } catch (e) {
    showToast(e?.message || 'Could not accept invitation')
  } finally {
    invitationBusyId.value = null
  }
}

async function onDeclineInvitation(inv) {
  try {
    await showConfirmDialog({
      title: 'Decline invitation',
      message: 'Decline this workspace invitation?',
      confirmText: 'Decline',
      cancelText: 'Cancel'
    })
  } catch {
    return
  }
  const id = inv.id
  if (invitationBusyId.value != null) return
  invitationBusyId.value = id
  try {
    await declineWorkspaceInvitation(id)
    showToast('Invitation declined')
    await invalidateAccountingCache({ accounts: true })
    await load()
  } catch (e) {
    showToast(e?.message || 'Could not decline invitation')
  } finally {
    invitationBusyId.value = null
  }
}

const accountMenuTemplate = [
  { role: 'flow-log', label: 'Account Flow Log', destructive: false },
  { role: 'add-transaction', label: 'Add a Transaction', destructive: false },
  { role: 'reconcile', label: 'Reconcile', destructive: false },
  { role: 'edit', label: 'Edit', destructive: false },
  { role: 'destructive', label: 'Delete', destructive: true }
]

function buildAccountMenuItems(account, group) {
  const island = group?.island || {}
  const isShared = !!island.is_shared
  const p = account?.permissions
  const scope = effectiveIslandPermissionScope(island)

  if (isShared && p) {
    const canView = p.view !== false && islandScopeAllowsView(scope)
    const canAdd =
      islandScopeAllowsAddTransaction(scope) && !!(p.add_transaction || p.full_access)
    const canRec = !!(p.reconcile || p.full_access)
    const canEdit = !!(p.edit_transaction || p.full_access)
    return accountMenuTemplate.filter((item) => {
      switch (item.role) {
        case 'flow-log':
          return canView
        case 'add-transaction':
          return canAdd
        case 'reconcile':
          return canRec
        case 'edit':
        case 'destructive':
          return canEdit
        default:
          return true
      }
    })
  }

  if (!isShared && p && typeof p === 'object' && Object.prototype.hasOwnProperty.call(p, 'view')) {
    const canView = p.view !== false
    const canAdd = !!(p.add_transaction || p.full_access)
    const canRec = !!(p.reconcile || p.full_access)
    const canEdit = !!(p.edit_transaction || p.full_access)
    return accountMenuTemplate.filter((item) => {
      switch (item.role) {
        case 'flow-log':
          return canView
        case 'add-transaction':
          return canAdd
        case 'reconcile':
          return canRec
        case 'edit':
        case 'destructive':
          return canEdit
        default:
          return true
      }
    })
  }

  const canViewIsland = islandScopeAllowsView(scope)
  const canAddIsland = islandScopeAllowsAddTransaction(scope)
  const canRecIsland = scope && !!(scope.reconcile || scope.full_access || scope.implicit_full)
  const canEditIsland = scope && !!(scope.edit_transaction || scope.full_access || scope.implicit_full)
  return accountMenuTemplate.filter((item) => {
    switch (item.role) {
      case 'flow-log':
        return canViewIsland
      case 'add-transaction':
        return canAddIsland
      case 'reconcile':
        return canRecIsland
      case 'edit':
      case 'destructive':
        return canEditIsland
      default:
        return true
    }
  })
}

function sameIslandGroup(a, b) {
  if (!a || !b) return false
  const ai = a.island || {}
  const bi = b.island || {}
  return (ai.id ?? null) === (bi.id ?? null) && !!ai.is_shared === !!bi.is_shared
}

function buildIslandMenuItems(group) {
  const island = group?.island || {}
  const isDefault = island.id == null
  const isShared = !!island.is_shared
  const scope = effectiveIslandPermissionScope(island)
  const canShare = island.can_share_workspace === true
  const hideDelete = isDefault || !canShare
  const hideRename = isDefault || !canShare
  const hideShare = isShared || !canShare

  const showAddEntry = islandScopeAllowsAddTransaction(scope)
  const showTxLog = islandScopeAllowsView(scope)
  const showCategories = islandScopeAllowsManageCategories(scope)
  const showAddAccount = !isShared && islandScopeAllowsAddAccount(scope)

  const items = []
  if (showAddEntry) {
    items.push({ role: 'add-entry', label: 'Add a Transaction', destructive: false })
  }
  if (showAddAccount) {
    items.push({ role: 'add-account', label: 'Add Account', destructive: false })
  }
  if (showTxLog) {
    items.push({ role: 'transaction-log', label: 'Transaction Log', destructive: false })
  }
  if (showCategories) {
    items.push({ role: 'manage-categories', label: 'Manage Categories', destructive: false })
  }
  if (!hideRename) items.push({ role: 'rename', label: 'Rename Island', destructive: false })
  if (!hideShare) items.push({ role: 'share-access', label: 'Share Access', destructive: false })
  if (!hideDelete) items.push({ role: 'destructive', label: 'Delete Island', destructive: true })
  return items
}

const POPOVER_RESERVE_BOTTOM_PX = 108
const POPOVER_ITEM_ROW_PX = 46
const POPOVER_VERTICAL_PAD_PX = 14
const POPOVER_MAX_HEIGHT_PX = 320

function estimatedPopoverHeightPx(itemCount) {
  if (itemCount < 1) return POPOVER_MAX_HEIGHT_PX
  return Math.min(itemCount * POPOVER_ITEM_ROW_PX + POPOVER_VERTICAL_PAD_PX, POPOVER_MAX_HEIGHT_PX)
}

function setPopoverOpenUpFromTrigger(triggerEl, itemCount) {
  optionsPopoverOpenUp.value = false
  if (!triggerEl?.getBoundingClientRect) return
  const rect = triggerEl.getBoundingClientRect()
  const vh = window.visualViewport?.height ?? window.innerHeight
  const spaceBelow = vh - POPOVER_RESERVE_BOTTOM_PX - rect.bottom
  const spaceAbove = rect.top - 48
  const need = estimatedPopoverHeightPx(itemCount)
  if (spaceBelow >= need) {
    optionsPopoverOpenUp.value = false
    return
  }
  if (spaceAbove >= need || spaceAbove > spaceBelow) {
    optionsPopoverOpenUp.value = true
  }
}

function isIslandPopoverOpenFor(group) {
  return showIslandOptions.value && sameIslandGroup(optionsGroup.value, group)
}

function toggleIslandPopover(group, event) {
  showAddMenu.value = false
  closeAccountPopover()
  if (isIslandPopoverOpenFor(group)) {
    closeIslandPopover()
  } else {
    const trigger = event?.currentTarget
    const n = buildIslandMenuItems(group).length
    optionsGroup.value = group
    showIslandOptions.value = true
    nextTick(() => setPopoverOpenUpFromTrigger(trigger, n))
  }
}

function closeIslandPopover() {
  showIslandOptions.value = false
  optionsGroup.value = null
  optionsPopoverOpenUp.value = false
}

function onIslandPopoverSelect(role, group) {
  closeIslandPopover()
  handleIslandMenuAction(role, group)
}

function handleIslandMenuAction(role, group) {
  if (!group) return
  const island = group.island
  const islandName = island?.name?.endsWith('Island') ? island.name : (island?.name || '') + ' Island'

  if (role === 'add-entry') {
    if (island?.id != null && island.id !== '') {
      router.push(
        `/transactions/create?workspace_id=${island.id}&workspace_name=${encodeURIComponent(islandName)}`
      )
    } else {
      router.push(
        `/transactions/create?default_island=1&workspace_name=${encodeURIComponent(islandName)}`
      )
    }
  } else if (role === 'add-account') {
    accountFormWorkspaceId.value = island?.id != null ? island.id : null
    currentAccount.value = null
    formOpen.value = true
  } else if (role === 'transaction-log') {
    router.push(`/transactions?workspace_id=${island?.id ?? ''}&workspace_name=${encodeURIComponent(islandName)}`)
  } else if (role === 'manage-categories') {
    router.push(`/accounting/categories?workspace_id=${island?.id ?? ''}&workspace_name=${encodeURIComponent(islandName)}`)
  } else if (role === 'rename') {
    islandFormWorkspace.value = island
    islandFormOpen.value = true
  } else if (role === 'share-access') {
    shareAccessGroup.value = group
    showShareAccess.value = true
  } else if (role === 'destructive') {
    onDeleteWorkspace(group)
  }
}

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

function formatUpdatedAgo(account) {
  const ts = account.updated_at || account.last_synced_at || account.created_at
  if (!ts) return 'Updated recently'
  const d = new Date(ts)
  const now = new Date()
  const sec = Math.floor((now - d) / 1000)
  if (sec < 60) return 'Updated just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `Updated ${min} ${min === 1 ? 'min' : 'mins'} ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `Updated ${h} ${h === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `Updated ${days} ${days === 1 ? 'day' : 'days'} ago`
  return `Updated ${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`
}

function goFlowLog(account) {
  const name = encodeURIComponent(account.name || 'Account')
  const cur = encodeURIComponent(account.currency || 'USD')
  const ws = account.workspace_id != null && account.workspace_id !== '' ? `&workspace_id=${encodeURIComponent(String(account.workspace_id))}` : ''
  router.push(`/accounts/${account.id}/flow-log?name=${name}&currency=${cur}${ws}`)
}

function isAccountPopoverOpenFor(account) {
  const cur = optionsAccount.value
  return showOptions.value && cur != null && account != null && cur.id === account.id
}

function groupHasOpenAccountPopover(group) {
  const cur = optionsAccount.value
  if (!showOptions.value || cur == null || !group?.accounts?.length) return false
  return group.accounts.some(a => a.id === cur.id)
}

function toggleAccountPopover(account, group, event) {
  showAddMenu.value = false
  closeIslandPopover()
  if (isAccountPopoverOpenFor(account)) {
    closeAccountPopover()
  } else {
    const trigger = event?.currentTarget
    optionsAccount.value = { ...account }
    showOptions.value = true
    const n = buildAccountMenuItems(account, group).length
    nextTick(() => setPopoverOpenUpFromTrigger(trigger, n))
  }
}

function closeAccountPopover() {
  showOptions.value = false
  optionsAccount.value = null
  optionsPopoverOpenUp.value = false
}

function onAccountPopoverSelect(role, account) {
  closeAccountPopover()
  handleAccountMenuAction(role, account)
}

function handleAccountMenuAction(role, account) {
  if (!account) return
  if (role === 'flow-log') goFlowLog(account)
  else if (role === 'add-transaction') {
    const q = new URLSearchParams()
    q.set('account_id', String(account.id))
    if (account.name) q.set('account_name', account.name)
    if (account.currency) q.set('currency', String(account.currency))
    if (account.workspace_id != null && account.workspace_id !== '') {
      q.set('workspace_id', String(account.workspace_id))
    } else {
      q.set('default_island', '1')
    }
    router.push(`/transactions/create?${q.toString()}`)
  }
  else if (role === 'reconcile') openReconcile(account)
  else if (role === 'edit') openEditAccount(account)
  else if (role === 'destructive') onDelete(account)
}

function applyAccountSort(role) {
  if (role === 'name' || role === 'balance') sortField.value = role
  showSortMenu.value = false
}

function openAddAccount(preselectedWsId = null) {
  showAddMenu.value = false
  accountFormWorkspaceId.value = preselectedWsId ?? null
  currentAccount.value = null
  formOpen.value = true
}

function onAddIsland() {
  showAddMenu.value = false
  islandFormWorkspace.value = null
  islandFormOpen.value = true
}

function onAddAccount() {
  openAddAccount()
}

function openAddAccountForGroup(group) {
  const island = group?.island
  openAddAccount(island?.id != null ? island.id : null)
}

async function onIslandFormSuccess() {
  islandFormOpen.value = false
  islandFormWorkspace.value = null
  await invalidateAccountingCache({ accounts: true })
  await load()
}

async function onShareAccessSuccess() {
  showShareAccess.value = false
  shareAccessGroup.value = null
  await load()
}

async function onDeleteWorkspace(group) {
  const island = group?.island
  if (!island?.id) return
  const name = island.name?.endsWith('Island') ? island.name : (island.name || '') + ' Island'
  try {
    await showConfirmDialog({
      title: 'Delete Island',
      message: `Are you sure you want to delete "${name}"? You will no longer have access to this island and all its accounts. This action cannot be undone.`
    })
    const res = await deleteWorkspace(island.id)
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'island deleted')
    await load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
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
  accountFormWorkspaceId.value = null
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
    await invalidateAccountingCache({ accounts: true, categories: false })
    let ownWorkspaces = []
    let sharedWorkspaces = []
    let ownAccounts = []

    const [ownResult, sharedResult] = await Promise.all([
      getWorkspaces().then((r) => ({ ok: true, r })).catch(() => ({ ok: false })),
      getSharedWorkspaces().then((r) => ({ ok: true, r })).catch(() => ({ ok: false }))
    ])
    if (ownResult.ok) {
      ownWorkspaces = ownResult.r?.data ?? []
      workspaceMode.value = ownResult.r?.workspace_mode || 'shared'
    } else {
      workspaceMode.value = 'shared'
    }
    if (sharedResult.ok) {
      sharedWorkspaces = sharedResult.r?.data?.active ?? []
      pendingWorkspaceInvitations.value = sharedResult.r?.data?.pending ?? []
    } else {
      pendingWorkspaceInvitations.value = []
    }

    const res = await getAccounts()
    ownAccounts = Array.isArray(res?.data ?? res) ? (res?.data ?? res) : []
    if (Array.isArray(res?.data)) {
      try {
        await setCached(CACHE_KEYS.ACCOUNTS_ACTIVE, {
          ...res,
          data: res.data.filter((a) => a.is_active !== false)
        })
      } catch {
        /* non-fatal */
      }
    }

    const groups = []

    const byWorkspace = (id) => (a) => (a.workspace_id ?? null) === (id ?? null)

    for (const ws of ownWorkspaces) {
      const accounts = ownAccounts.filter(byWorkspace(ws.id))
      groups.push({
        island: {
          id: ws.id,
          name: ws.name || 'My Island',
          is_shared: false,
          tenant_name: null,
          can_share_workspace: ws.can_share_workspace === true,
          permission_scope: ws.permission_scope ?? null
        },
        accounts
      })
    }

    const defaultAccounts = ownAccounts.filter(byWorkspace(null))
    if (defaultAccounts.length > 0) {
      groups.push({
        island: {
          id: null,
          name: 'Default Island',
          is_shared: false,
          tenant_name: null,
          can_share_workspace: true,
          permission_scope: null
        },
        accounts: defaultAccounts
      })
    }

    for (const ws of sharedWorkspaces) {
      try {
        const sharedRes = await getAccountsByWorkspace(ws.id)
        const sharedAccounts = Array.isArray(sharedRes?.data ?? sharedRes) ? (sharedRes?.data ?? sharedRes) : []
        if (sharedAccounts.length > 0) {
          groups.push({
            island: {
              id: ws.id,
              name: ws.name || 'Shared Island',
              is_shared: true,
              tenant_name: ws.tenant_name,
              permission_scope: ws.permission_scope || {
                view: false,
                add_transaction: false,
                edit_transaction: false,
                reconcile: false,
                full_access: false,
                implicit_full: false
              }
            },
            accounts: sharedAccounts
          })
        }
      } catch {
        // Skip failed shared workspace
      }
    }

    islandGroups.value = groups
  } catch (e) {
    showToast('Failed to load accounts')
    islandGroups.value = []
    pendingWorkspaceInvitations.value = []
  } finally {
    loading.value = false
  }
}

onIonViewDidEnter(async () => {
  closeIslandPopover()
  closeAccountPopover()
  if (syncStore.invalidatedAccountIds?.size > 0) syncStore.clearAllInvalidated()
  await load()
  const add = route.query.add_account
  if (add === '1' || add === 'true') {
    const wid = route.query.workspace_id
    const pre = wid != null && wid !== '' ? Number(wid) : null
    openAddAccount(pre != null && !Number.isNaN(pre) ? pre : null)
    router.replace({ path: '/accounts' }).catch(() => {})
  }
  // load() already invalidated cache and fetched GET /accounts; avoid duplicating those two bootstrap account requests.
  refreshBootstrapCache({ skipAccounts: true }).catch(() => {})
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

.add-btn-wrapper {
  position: relative;
}

.add-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: transparent;
}

/* Popovers live inside scroll content; without this, backdrop (z-50) stacks above the whole
   accounts subtree so clicks hit dismiss instead of menu actions. */
.above-menu-backdrop {
  position: relative;
  z-index: 51;
}

.add-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  max-height: min(50dvh, 280px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  padding: 6px 0;
  z-index: 51;
}

.popover-option {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 15px;
  font-weight: 500;
  color: #1A1A2E;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.popover-option:active {
  background: rgba(0, 0, 0, 0.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.15s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
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
  padding: 0 4px 16px;
}

.section-block {
  margin-bottom: 10px;
}

.section-block:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 16px;
  font-weight: 400;
  color: #A8A8A8;
  margin: 0 0 10px 0;
  padding: 0;
}

.island-cards {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.island-card {
  background: #fff;
  border-radius: 13px;
  padding: 10px;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.16);
}

.island-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  margin-bottom: 4px;
}

.island-more-wrapper {
  position: relative;
  flex-shrink: 0;
}

.island-options-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 200px;
  max-width: min(92vw, 280px);
  max-height: min(65dvh, 360px);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.14);
  padding: 6px 0;
  z-index: 52;
}

.island-options-popover--up {
  top: auto;
  bottom: calc(100% + 6px);
}

.island-popover-option {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 15px;
  font-weight: 500;
  color: #1A1A2E;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.island-popover-option:active {
  background: rgba(0, 0, 0, 0.05);
}

.island-popover-option.destructive {
  color: rgba(195, 0, 16, 0.74);
}

.island-name {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 141, 40, 0.75);
}

.island-name.shared {
  color: rgba(255, 141, 40, 0.75);
}

.account-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.account-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 5px 5px 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  min-height: 34px;
}

.account-row:active {
  opacity: 0.8;
}

.account-left {
  display: flex;
  flex-direction: column;
  gap: -8px;
  min-width: 0;
  flex: 1;
}

.account-name {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.72);
  line-height: 24px;
}

.account-updated {
  font-size: 12px;
  color: #A8A8A8;
  line-height: 18px;
  opacity: 0.8;
}

.account-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.account-more-wrapper {
  position: relative;
  flex-shrink: 0;
}

.account-balance {
  font-size: 16px;
  font-weight: 400;
  color: #A8A8A8;
}

.group-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 24px;
  color: rgba(255, 141, 40, 0.75);
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

.workspace-empty-prompt {
  text-align: center;
  padding: 20px 12px 16px;
}

.workspace-empty-prompt p {
  font-size: 14px;
  color: #A7A7A7;
  line-height: 1.45;
  margin: 0 0 14px;
}

.workspace-search-empty {
  font-size: 13px;
  color: #A7A7A7;
  text-align: center;
  padding: 16px 12px;
  margin: 0;
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

.sort-sheet-content {
  --background: #ffffff;
}

.adaptive-sheet-body {
  min-height: 0;
}

.workspace-mode-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 141, 40, 0.12);
  color: #FF8D28;
  vertical-align: middle;
}

.invitation-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invitation-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.invitation-text {
  margin-bottom: 14px;
}

.invitation-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.4;
  word-break: break-word;
}

.invitation-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.invitation-btn {
  flex: 1;
  max-width: 140px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  -webkit-tap-highlight-color: transparent;
}

.invitation-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.invitation-btn--decline {
  background: #fff;
  color: #1a1a2e;
  border: 1px solid #d1d1d6;
}

.invitation-btn--accept {
  background: #ff8d28;
  color: #fff;
}
</style>
