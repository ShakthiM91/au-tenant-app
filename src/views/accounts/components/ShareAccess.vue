<template>
  <Teleport to="ion-app">
    <Transition name="drawer-fade">
      <div v-if="isOpen" class="drawer-backdrop" @click="$emit('close')" />
    </Transition>
    <Transition name="drawer-slide">
      <div v-if="isOpen" class="drawer-sheet">
        <div class="drawer-handle" />
        <header class="sheet-header">
          <button type="button" class="btn-cancel" @click="$emit('close')">Cancel</button>
          <h1 class="sheet-title">Share Access</h1>
          <button type="button" class="btn-done" @click="$emit('close')">Done</button>
        </header>

        <p class="island-title">{{ islandName }}</p>

        <div class="drawer-body-scroll">
          <section class="people-section">
            <h2 class="section-heading">People with Access</h2>
            <div v-if="loading" class="loading-row">
              <ion-spinner name="crescent" />
            </div>
            <div v-else-if="sortedMembers.length === 0" class="empty-members">
              No members yet
            </div>
            <div v-else class="members-list">
              <div v-for="m in sortedMembers" :key="m.id" class="member-row">
                <div class="member-name-block">
                  <span class="member-name">{{ displayName(m) }}</span>
                </div>

                <template v-if="m.role === 'owner'">
                  <span class="badge-owner">Owner</span>
                </template>
                <template v-else>
                  <span
                    v-if="statusLabel(m)"
                    class="member-status-label"
                    :class="m.status"
                  >{{ statusLabel(m) }}</span>
                  <div v-if="!readonly" class="member-actions">
                    <button
                      v-if="m.status !== 'declined' && !isCurrentUser(m)"
                      type="button"
                      class="icon-btn"
                      aria-label="Edit access"
                      @click="openEditMember(m)"
                    >
                      <ion-icon :icon="createOutline" />
                    </button>
                    <button
                      type="button"
                      class="icon-btn"
                      aria-label="Remove"
                      @click="removeMember(m)"
                    >
                      <ion-icon :icon="trashOutline" />
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </section>

          <section v-if="!readonly && editingMember" class="edit-member-section">
            <div class="edit-member-header">
              <button type="button" class="btn-edit-cancel" @click="closeEditMember">Cancel</button>
              <h2 class="section-heading edit-member-heading">Edit access</h2>
            </div>
            <p class="edit-member-name">{{ displayName(editingMember) }}</p>

            <div v-if="loadingMemberGrants" class="accounts-loading">
              <ion-spinner name="crescent" />
            </div>
            <template v-else>
              <div class="invite-panel invite-panel--embedded">
                <h3 class="invite-panel-title">Permissions</h3>
                <div class="perm-list">
                  <label class="perm-row">
                    <input
                      v-model="perm.full_access"
                      type="checkbox"
                      class="perm-check"
                      @change="onFullAccessChange"
                    />
                    <span>Full access</span>
                  </label>
                  <label class="perm-row" :class="{ 'perm-row--muted': perm.full_access }">
                    <input
                      v-model="perm.view_only"
                      type="checkbox"
                      class="perm-check"
                      :disabled="perm.full_access"
                      @change="onViewOnlyChange"
                    />
                    <span>View only</span>
                  </label>
                  <label class="perm-row" :class="{ 'perm-row--muted': perm.full_access || perm.view_only }">
                    <input
                      v-model="perm.add_transaction"
                      type="checkbox"
                      class="perm-check"
                      :disabled="perm.full_access || perm.view_only"
                      @change="onGranularChange"
                    />
                    <span>Add transactions</span>
                  </label>
                  <label class="perm-row" :class="{ 'perm-row--muted': perm.full_access || perm.view_only }">
                    <input
                      v-model="perm.edit_transaction"
                      type="checkbox"
                      class="perm-check"
                      :disabled="perm.full_access || perm.view_only"
                      @change="onGranularChange"
                    />
                    <span>Edit transactions</span>
                  </label>
                  <label class="perm-row" :class="{ 'perm-row--muted': perm.full_access || perm.view_only }">
                    <input
                      v-model="perm.reconcile"
                      type="checkbox"
                      class="perm-check"
                      :disabled="perm.full_access || perm.view_only"
                      @change="onGranularChange"
                    />
                    <span>Reconcile</span>
                  </label>
                </div>

                <h3 class="invite-panel-title invite-panel-title--accounts">Accounts</h3>
                <div v-if="loadingAccounts" class="accounts-loading">
                  <ion-spinner name="crescent" />
                </div>
                <p v-else-if="!workspaceAccounts.length" class="accounts-empty">
                  No accounts in this workspace.
                </p>
                <div v-else class="account-grid">
                  <label
                    v-for="acc in workspaceAccounts"
                    :key="acc.id"
                    class="account-chip"
                  >
                    <input
                      type="checkbox"
                      :value="acc.id"
                      :checked="selectedAccountIds.includes(Number(acc.id))"
                      class="perm-check"
                      @change="toggleAccount(acc.id, $event.target.checked)"
                    />
                    <span class="account-chip-label">{{ acc.name }}</span>
                  </label>
                </div>

                <button
                  type="button"
                  class="btn-invite-primary"
                  :disabled="savingMemberGrants || !canSaveMemberGrants"
                  @click="saveMemberGrants"
                >
                  {{ savingMemberGrants ? '…' : 'Save' }}
                </button>
              </div>
            </template>
          </section>

          <section v-if="!readonly && !editingMember" class="add-section">
            <div class="add-people-heading">
              <ion-icon :icon="addOutline" class="add-people-icon" aria-hidden="true" />
              <span>Add People</span>
            </div>
            <label class="search-label" for="share-access-email">Full email address</label>
            <div class="search-row">
              <div class="search-input-wrap">
                <input
                  id="share-access-email"
                  v-model="searchEmail"
                  type="email"
                  class="input-underline"
                  :class="{ 'input-underline--invalid': searchEmailError }"
                  placeholder="name@example.com"
                  autocomplete="email"
                  inputmode="email"
                  @keyup.enter="searchUsers"
                />
                <p v-if="searchEmailError" class="search-feedback search-feedback--error" role="alert">
                  {{ searchEmailError }}
                </p>
                <p v-else-if="searchNotFound" class="search-feedback search-feedback--muted">
                  No user registered with this email was found.
                </p>
              </div>
              <button
                type="button"
                class="btn-search-outlined"
                :disabled="searching || !searchEmail?.trim()"
                @click="searchUsers"
              >
                {{ searching ? '…' : 'Search' }}
              </button>
            </div>
            <div v-if="searchResults.length > 0" class="search-results">
              <div v-for="u in searchResults" :key="u.id" class="search-result-block">
                <div class="search-item">
                  <span class="search-item-label">{{ u.name || u.email }} ({{ u.email }})</span>
                  <button
                    type="button"
                    class="btn-select"
                    :disabled="isAlreadyMember(u.id)"
                    @click="toggleSelectUser(u)"
                  >
                    {{ isAlreadyMember(u.id) ? 'Member' : selectedUser?.id === u.id ? 'Collapse' : 'Select' }}
                  </button>
                </div>

                <div v-if="selectedUser?.id === u.id && !isAlreadyMember(u.id)" class="invite-panel">
                  <h3 class="invite-panel-title">Permissions</h3>
                  <div class="perm-list">
                    <label class="perm-row">
                      <input
                        v-model="perm.full_access"
                        type="checkbox"
                        class="perm-check"
                        @change="onFullAccessChange"
                      />
                      <span>Full access</span>
                    </label>
                    <label class="perm-row" :class="{ 'perm-row--muted': perm.full_access }">
                      <input
                        v-model="perm.view_only"
                        type="checkbox"
                        class="perm-check"
                        :disabled="perm.full_access"
                        @change="onViewOnlyChange"
                      />
                      <span>View only</span>
                    </label>
                    <label class="perm-row" :class="{ 'perm-row--muted': perm.full_access || perm.view_only }">
                      <input
                        v-model="perm.add_transaction"
                        type="checkbox"
                        class="perm-check"
                        :disabled="perm.full_access || perm.view_only"
                        @change="onGranularChange"
                      />
                      <span>Add transactions</span>
                    </label>
                    <label class="perm-row" :class="{ 'perm-row--muted': perm.full_access || perm.view_only }">
                      <input
                        v-model="perm.edit_transaction"
                        type="checkbox"
                        class="perm-check"
                        :disabled="perm.full_access || perm.view_only"
                        @change="onGranularChange"
                      />
                      <span>Edit transactions</span>
                    </label>
                    <label class="perm-row" :class="{ 'perm-row--muted': perm.full_access || perm.view_only }">
                      <input
                        v-model="perm.reconcile"
                        type="checkbox"
                        class="perm-check"
                        :disabled="perm.full_access || perm.view_only"
                        @change="onGranularChange"
                      />
                      <span>Reconcile</span>
                    </label>
                  </div>

                  <h3 class="invite-panel-title invite-panel-title--accounts">Accounts</h3>
                  <div v-if="loadingAccounts" class="accounts-loading">
                    <ion-spinner name="crescent" />
                  </div>
                  <p v-else-if="!workspaceAccounts.length" class="accounts-empty">
                    No accounts in this workspace.
                  </p>
                  <div v-else class="account-grid">
                    <label
                      v-for="acc in workspaceAccounts"
                      :key="acc.id"
                      class="account-chip"
                    >
                      <input
                        type="checkbox"
                        :value="acc.id"
                        :checked="selectedAccountIds.includes(Number(acc.id))"
                        class="perm-check"
                        @change="toggleAccount(acc.id, $event.target.checked)"
                      />
                      <span class="account-chip-label">{{ acc.name }}</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    class="btn-invite-primary"
                    :disabled="inviting || !canSubmitInvite"
                    @click="sendInvite(u)"
                  >
                    {{ inviting ? '…' : 'Invite' }}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IonSpinner, IonIcon } from '@ionic/vue'
import { createOutline, trashOutline, addOutline } from 'ionicons/icons'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { useUserStore } from '@/store/user'
import {
  getWorkspaceMembers,
  getWorkspaceMemberGrants,
  inviteWorkspaceMember,
  removeWorkspaceMember,
  searchWorkspaceUsers,
  updateWorkspaceMember
} from '@/api/workspace'
import { getAccountsByWorkspace } from '@/api/accounting'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  group: { type: Object, default: null }
})

const emit = defineEmits(['close', 'success'])

const userStore = useUserStore()

const islandName = computed(() => {
  const island = props.group?.island
  if (!island) return ''
  return island.name?.endsWith('Island') ? island.name : (island.name || '') + ' Island'
})

const workspaceId = computed(() => props.group?.island?.id ?? null)
const readonly = computed(() => !!props.group?.island?.is_shared)

const searchEmail = ref('')
const searchEmailError = ref('')
const searchNotFound = ref(false)
const searchResults = ref([])
const searching = ref(false)
const members = ref([])
const loading = ref(false)

const workspaceAccounts = ref([])
const loadingAccounts = ref(false)
const selectedUser = ref(null)
const selectedAccountIds = ref([])
const inviting = ref(false)
const editingMember = ref(null)
const loadingMemberGrants = ref(false)
const savingMemberGrants = ref(false)
const perm = ref({
  view_only: true,
  add_transaction: false,
  edit_transaction: false,
  reconcile: false,
  full_access: false
})

const roleOrder = { owner: 0, admin: 1, member: 2 }

const sortedMembers = computed(() =>
  [...members.value].sort((a, b) => {
    const ra = roleOrder[a.role] ?? 2
    const rb = roleOrder[b.role] ?? 2
    if (ra !== rb) return ra - rb
    return Number(a.id) - Number(b.id)
  })
)

function isCurrentUser(m) {
  return userStore.id != null && Number(m.user_id) === Number(userStore.id)
}

function normalizeEmailForCompare(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
}

function isInviteeCurrentUserById(userId) {
  return userStore.id != null && Number(userId) === Number(userStore.id)
}

function displayName(m) {
  const base = m.user_name || m.user_email || `User #${m.user_id}`
  return isCurrentUser(m) ? `${base} (Me)` : base
}

function statusLabel(m) {
  if (m.status === 'pending') return 'Pending'
  if (m.status === 'declined') return 'Rejected'
  return ''
}

const isAlreadyMember = (userId) =>
  members.value.some((m) => Number(m.user_id) === Number(userId))

function defaultPermState() {
  return {
    view_only: true,
    add_transaction: false,
    edit_transaction: false,
    reconcile: false,
    full_access: false
  }
}

function resetInviteFlow() {
  selectedUser.value = null
  selectedAccountIds.value = []
  perm.value = defaultPermState()
}

function closeEditMember() {
  editingMember.value = null
  loadingMemberGrants.value = false
}

function resetInviteForm() {
  resetInviteFlow()
  closeEditMember()
}

function buildPermissionsPayload() {
  const p = perm.value
  if (p.full_access) {
    return {
      view: true,
      add_transaction: true,
      edit_transaction: true,
      reconcile: true,
      full_access: true
    }
  }
  if (p.view_only) {
    return {
      view: true,
      add_transaction: false,
      edit_transaction: false,
      reconcile: false,
      full_access: false
    }
  }
  return {
    view: true,
    add_transaction: !!p.add_transaction,
    edit_transaction: !!p.edit_transaction,
    reconcile: !!p.reconcile,
    full_access: false
  }
}

const canSubmitInvite = computed(() => {
  if (selectedAccountIds.value.length === 0) return false
  const p = perm.value
  if (p.full_access) return true
  if (p.view_only) return true
  return !!(p.add_transaction || p.edit_transaction || p.reconcile)
})

const canSaveMemberGrants = computed(() => {
  if (!editingMember.value) return false
  if (selectedAccountIds.value.length === 0) return true
  const p = perm.value
  if (p.full_access) return true
  if (p.view_only) return true
  return !!(p.add_transaction || p.edit_transaction || p.reconcile)
})

function onFullAccessChange() {
  if (perm.value.full_access) {
    perm.value.view_only = false
  }
}

function onViewOnlyChange() {
  if (perm.value.view_only) {
    perm.value.full_access = false
    perm.value.add_transaction = false
    perm.value.edit_transaction = false
    perm.value.reconcile = false
  }
}

function onGranularChange() {
  if (perm.value.add_transaction || perm.value.edit_transaction || perm.value.reconcile) {
    perm.value.view_only = false
    perm.value.full_access = false
  }
}

function toggleAccount(accountId, checked) {
  const id = Number(accountId)
  const set = new Set(selectedAccountIds.value.map(Number))
  if (checked) set.add(id)
  else set.delete(id)
  selectedAccountIds.value = [...set]
}

function toggleSelectUser(u) {
  if (isAlreadyMember(u.id) || isInviteeCurrentUserById(u.id)) return
  closeEditMember()
  if (selectedUser.value?.id === u.id) {
    resetInviteForm()
    return
  }
  selectedUser.value = u
  perm.value = defaultPermState()
  selectedAccountIds.value = []
}

function applyPermissionsFromGrantsList(grants) {
  const list = Array.isArray(grants) ? grants : []
  if (list.length === 0) {
    perm.value = defaultPermState()
    selectedAccountIds.value = []
    return
  }
  selectedAccountIds.value = list.map((g) => Number(g.account_id)).filter((id) => !Number.isNaN(id))
  const p = list[0]?.permissions || {}
  if (p.full_access) {
    perm.value = {
      full_access: true,
      view_only: false,
      add_transaction: false,
      edit_transaction: false,
      reconcile: false
    }
    return
  }
  const onlyView =
    p.view !== false &&
    !p.add_transaction &&
    !p.edit_transaction &&
    !p.reconcile &&
    !p.full_access
  if (onlyView) {
    perm.value = {
      full_access: false,
      view_only: true,
      add_transaction: false,
      edit_transaction: false,
      reconcile: false
    }
    return
  }
  perm.value = {
    full_access: false,
    view_only: false,
    add_transaction: !!p.add_transaction,
    edit_transaction: !!p.edit_transaction,
    reconcile: !!p.reconcile
  }
}

async function openEditMember(m) {
  if (!workspaceId.value) return
  resetInviteFlow()
  editingMember.value = m
  loadingMemberGrants.value = true
  try {
    const res = await getWorkspaceMemberGrants(workspaceId.value, m.id)
    const grants = res?.data?.account_grants ?? []
    applyPermissionsFromGrantsList(grants)
  } catch {
    applyPermissionsFromGrantsList([])
    showToast('Failed to load access settings')
  } finally {
    loadingMemberGrants.value = false
  }
}

async function saveMemberGrants() {
  if (!canSaveMemberGrants.value || !workspaceId.value || !editingMember.value) return
  const permissions = buildPermissionsPayload()
  const account_grants = selectedAccountIds.value.map((aid) => ({
    account_id: Number(aid),
    permissions
  }))
  savingMemberGrants.value = true
  try {
    await updateWorkspaceMember(workspaceId.value, editingMember.value.id, { account_grants })
    showToast('Access updated')
    closeEditMember()
    await loadMembers()
    emit('success')
  } catch (e) {
    showToast(e?.response?.data?.error || e?.message || 'Failed to save')
  } finally {
    savingMemberGrants.value = false
  }
}

/**
 * Practical single-address check (must match full email before API search).
 */
function validateInviteEmail(email) {
  const s = String(email ?? '').trim()
  if (!s) return { ok: false, message: 'Enter an email address' }
  if (/\s/.test(s)) {
    return { ok: false, message: 'Email cannot contain spaces' }
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(s)) {
    return { ok: false, message: 'Enter a valid email address' }
  }
  const [local, domain] = s.split('@')
  if (!local?.length || !domain?.includes('.')) {
    return { ok: false, message: 'Enter a valid email address' }
  }
  const tld = domain.split('.').pop()
  if (!tld || tld.length < 2) {
    return { ok: false, message: 'Enter a valid email address' }
  }
  return { ok: true, email: s }
}

watch(searchEmail, () => {
  searchEmailError.value = ''
  searchNotFound.value = false
  resetInviteForm()
})

watch(
  () => [props.isOpen, workspaceId.value],
  async ([open, wsId]) => {
    if (open && wsId) {
      searchEmail.value = ''
      searchEmailError.value = ''
      searchNotFound.value = false
      searchResults.value = []
      resetInviteForm()
      await Promise.all([loadMembers(), loadWorkspaceAccounts()])
    } else if (!open) {
      searchEmail.value = ''
      searchEmailError.value = ''
      searchNotFound.value = false
      searchResults.value = []
      members.value = []
      workspaceAccounts.value = []
      resetInviteForm()
    }
  }
)

async function loadMembers() {
  if (!workspaceId.value) return
  loading.value = true
  try {
    const res = await getWorkspaceMembers(workspaceId.value)
    members.value = res?.data ?? []
  } catch {
    members.value = []
    showToast('Failed to load members')
  } finally {
    loading.value = false
  }
}

async function loadWorkspaceAccounts() {
  if (!workspaceId.value) return
  loadingAccounts.value = true
  try {
    const res = await getAccountsByWorkspace(workspaceId.value, { is_active: true })
    const raw = res?.data ?? res
    workspaceAccounts.value = Array.isArray(raw) ? raw : []
  } catch {
    workspaceAccounts.value = []
    showToast('Failed to load accounts')
  } finally {
    loadingAccounts.value = false
  }
}

async function searchUsers() {
  if (!workspaceId.value) return
  searchEmailError.value = ''
  searchNotFound.value = false
  searchResults.value = []
  resetInviteForm()

  const check = validateInviteEmail(searchEmail.value)
  if (!check.ok) {
    searchEmailError.value = check.message
    return
  }

  const selfEmail = normalizeEmailForCompare(userStore.email)
  if (selfEmail && normalizeEmailForCompare(check.email) === selfEmail) {
    searchEmailError.value = 'You cannot share access with yourself'
    return
  }

  searching.value = true
  try {
    const res = await searchWorkspaceUsers(workspaceId.value, check.email)
    const list = Array.isArray(res?.data) ? res.data : []
    const withoutSelf = list.filter((u) => !isInviteeCurrentUserById(u.id))
    if (list.length > 0 && withoutSelf.length === 0) {
      searchEmailError.value = 'You cannot share access with yourself'
    } else {
      searchResults.value = withoutSelf
      if (withoutSelf.length === 0) {
        searchNotFound.value = true
      }
    }
  } catch {
    searchResults.value = []
    showToast('Search failed. Please try again.')
  } finally {
    searching.value = false
  }
}

async function sendInvite(user) {
  if (!canSubmitInvite.value || !workspaceId.value) return
  if (isInviteeCurrentUserById(user?.id)) {
    showToast('You cannot share access with yourself')
    return
  }
  const permissions = buildPermissionsPayload()
  const account_grants = selectedAccountIds.value.map((aid) => ({
    account_id: Number(aid),
    permissions
  }))
  inviting.value = true
  try {
    await inviteWorkspaceMember(workspaceId.value, {
      user_id: user.id,
      role: 'member',
      invite_mode: 'pending',
      account_grants
    })
    showToast('Invitation sent')
    searchResults.value = searchResults.value.filter((u) => u.id !== user.id)
    resetInviteForm()
    await loadMembers()
    emit('success')
  } catch (e) {
    showToast(e?.response?.data?.error || e?.message || 'Failed to invite')
  } finally {
    inviting.value = false
  }
}

async function removeMember(row) {
  try {
    await showConfirmDialog({
      title: 'Remove Member',
      message: 'Remove this member from the workspace?'
    })
    await removeWorkspaceMember(workspaceId.value, row.id)
    showToast('Member removed')
    await loadMembers()
    emit('success')
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Failed to remove')
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

.drawer-body-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 20px 24px;
}

.drawer-handle {
  width: 36px;
  height: 4px;
  background: #d6d9dd;
  border-radius: 2px;
  margin: 10px auto 12px;
  flex-shrink: 0;
}

.sheet-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 8px 8px;
  flex-shrink: 0;
}

.btn-cancel {
  justify-self: start;
  padding: 8px 12px;
  border: none;
  background: none;
  font-size: 17px;
  font-weight: 400;
  color: #5856d6;
  cursor: pointer;
}

.sheet-title {
  grid-column: 2;
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #1c1c1e;
  text-align: center;
}

.btn-done {
  justify-self: end;
  grid-column: 3;
  padding: 8px 12px;
  border: none;
  background: none;
  font-size: 17px;
  font-weight: 600;
  color: #ff8d28;
  cursor: pointer;
}

.island-title {
  margin: 0 20px 20px;
  font-size: 17px;
  font-weight: 600;
  color: #1c1c1e;
  text-align: center;
}

.people-section {
  margin-bottom: 28px;
}

.section-heading {
  font-size: 15px;
  font-weight: 500;
  color: #8e8e93;
  margin: 0 0 12px;
}

.loading-row {
  padding: 24px;
  text-align: center;
}

.empty-members {
  font-size: 15px;
  color: #8e8e93;
  padding: 12px 0;
}

.members-list {
  display: flex;
  flex-direction: column;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f2f7;
}

.member-name-block {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 17px;
  font-weight: 400;
  color: #1c1c1e;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-owner {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: #ff8d28;
  border-radius: 100px;
}

.member-status-label {
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 400;
}

.member-status-label.pending {
  color: #8e8e93;
}

.member-status-label.declined {
  color: #ff3b30;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  color: #8e8e93;
  cursor: pointer;
  border-radius: 8px;
}

.icon-btn ion-icon {
  font-size: 22px;
}

.icon-btn:active {
  background: rgba(0, 0, 0, 0.06);
}

.edit-member-section {
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f2f2f7;
}

.edit-member-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.btn-edit-cancel {
  flex-shrink: 0;
  padding: 6px 10px;
  border: none;
  background: none;
  font-size: 16px;
  font-weight: 400;
  color: #5856d6;
  cursor: pointer;
}

.edit-member-heading {
  margin: 0;
  flex: 1;
  text-align: center;
}

.edit-member-name {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: #1c1c1e;
  text-align: center;
}

.invite-panel--embedded {
  padding-left: 0;
  padding-right: 0;
}

.add-section {
  padding-top: 4px;
}

.add-people-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 17px;
  font-weight: 600;
  color: #ff8d28;
}

.add-people-icon {
  font-size: 22px;
  color: #ff8d28;
}

.search-label {
  display: block;
  font-size: 13px;
  color: #8e8e93;
  margin-bottom: 8px;
}

.search-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.search-input-wrap {
  flex: 1;
  min-width: 0;
}

.input-underline {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 0;
  border: none;
  border-bottom: 1px solid #c7c7cc;
  border-radius: 0;
  font-size: 17px;
  color: #1c1c1e;
  background: transparent;
}

.input-underline:focus {
  outline: none;
  border-bottom-color: #ff8d28;
}

.input-underline--invalid {
  border-bottom-color: #ff3b30;
}

.input-underline--invalid:focus {
  border-bottom-color: #ff3b30;
}

.search-feedback {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.35;
}

.search-feedback--error {
  color: #ff3b30;
}

.search-feedback--muted {
  color: #8e8e93;
}

.btn-search-outlined {
  flex-shrink: 0;
  margin-top: 8px;
  padding: 10px 18px;
  border: 1px solid #d1d1d6;
  background: #fff;
  color: #3a3a3c;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
}

.btn-search-outlined:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.search-results {
  margin-top: 4px;
}

.search-result-block {
  border-bottom: 1px solid #f2f2f7;
  padding-bottom: 8px;
  margin-bottom: 4px;
}

.search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0 8px;
}

.btn-select {
  flex-shrink: 0;
  padding: 6px 14px;
  border: none;
  background: rgba(255, 141, 40, 0.18);
  color: #c45c00;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
}

.btn-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.invite-panel {
  padding: 8px 0 16px 4px;
}

.invite-panel-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.invite-panel-title--accounts {
  margin-top: 18px;
}

.perm-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.perm-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: #1c1c1e;
  cursor: pointer;
}

.perm-row--muted {
  opacity: 0.45;
}

.perm-check {
  width: 20px;
  height: 20px;
  accent-color: #ff8d28;
}

.accounts-loading {
  padding: 16px;
  text-align: center;
}

.accounts-empty {
  margin: 0;
  font-size: 15px;
  color: #8e8e93;
}

.account-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
}

@media (max-width: 360px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
}

.account-chip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 15px;
  color: #1c1c1e;
  cursor: pointer;
  min-width: 0;
}

.account-chip-label {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.btn-invite-primary {
  width: 100%;
  margin-top: 20px;
  padding: 14px 16px;
  border: none;
  border-radius: 12px;
  background: #ff8d28;
  color: #fff;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
}

.btn-invite-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.search-item-label {
  font-size: 15px;
  color: #1c1c1e;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s ease-out;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateY(100%);
}
</style>
