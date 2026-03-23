<template>
  <Teleport to="ion-app">
    <Transition name="drawer-fade">
      <div v-if="isOpen" class="drawer-backdrop" @click="$emit('close')" />
    </Transition>
    <Transition name="drawer-slide">
      <div v-if="isOpen" class="drawer-sheet">
        <div class="drawer-handle" />
        <h2 class="drawer-title">Share Access</h2>
        <p class="drawer-subtitle">{{ islandName }}</p>

        <div class="drawer-body">
          <div v-if="!readonly" class="invite-section">
            <div class="search-row">
              <input
                v-model="searchEmail"
                type="text"
                class="form-input"
                placeholder="Search user by email"
                @keyup.enter="searchUsers"
              />
              <button type="button" class="btn-search" :disabled="searching || !searchEmail?.trim()" @click="searchUsers">
                {{ searching ? '...' : 'Search' }}
              </button>
            </div>
            <div v-if="searchResults.length > 0" class="search-results">
              <div v-for="u in searchResults" :key="u.id" class="search-item">
                <span class="search-item-label">{{ u.name || u.email }} ({{ u.email }})</span>
                <button
                  type="button"
                  class="btn-invite"
                  :disabled="isAlreadyMember(u.id)"
                  @click="inviteUser(u)"
                >
                  {{ isAlreadyMember(u.id) ? 'Member' : 'Invite' }}
                </button>
              </div>
            </div>
          </div>

          <div class="members-section">
            <h3 class="section-label">Members</h3>
            <div v-if="loading" class="loading-row">
              <ion-spinner name="crescent" />
            </div>
            <div v-else-if="members.length === 0" class="empty-members">
              No members yet
            </div>
            <div v-else class="members-list">
              <div v-for="m in members" :key="m.id" class="member-row">
                <div class="member-info">
                  <span class="member-name">{{ m.user_name || m.user_email || `User #${m.user_id}` }}</span>
                  <span class="member-status" :class="m.status">{{ m.status }}</span>
                </div>
                <button
                  v-if="!readonly && m.role !== 'owner'"
                  type="button"
                  class="btn-remove"
                  @click="removeMember(m)"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-footer">
          <button type="button" class="btn-cancel" @click="$emit('close')">
            Done
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IonSpinner } from '@ionic/vue'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import {
  getWorkspaceMembers,
  inviteWorkspaceMember,
  removeWorkspaceMember,
  searchWorkspaceUsers
} from '@/api/workspace'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  group: { type: Object, default: null }
})

const emit = defineEmits(['close', 'success'])

const islandName = computed(() => {
  const island = props.group?.island
  if (!island) return ''
  return island.name?.endsWith('Island') ? island.name : (island.name || '') + ' Island'
})

const workspaceId = computed(() => props.group?.island?.id ?? null)
const readonly = computed(() => !!props.group?.island?.is_shared)

const searchEmail = ref('')
const searchResults = ref([])
const searching = ref(false)
const members = ref([])
const loading = ref(false)

const isAlreadyMember = (userId) =>
  members.value.some((m) => Number(m.user_id) === Number(userId))

watch(
  () => [props.isOpen, workspaceId.value],
  async ([open, wsId]) => {
    if (open && wsId) {
      await loadMembers()
    } else if (!open) {
      searchEmail.value = ''
      searchResults.value = []
      members.value = []
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

async function searchUsers() {
  const email = searchEmail.value?.trim()
  if (!email || !workspaceId.value) return
  searching.value = true
  searchResults.value = []
  try {
    const res = await searchWorkspaceUsers(workspaceId.value, email)
    searchResults.value = res?.data ?? []
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

async function inviteUser(user) {
  try {
    await inviteWorkspaceMember(workspaceId.value, {
      user_id: user.id,
      role: 'member',
      invite_mode: 'pending'
    })
    showToast('Invitation sent')
    searchResults.value = searchResults.value.filter((u) => u.id !== user.id)
    await loadMembers()
    emit('success')
  } catch (e) {
    showToast(e?.message || 'Failed to invite')
  }
}

async function removeMember(row) {
  try {
    await showConfirmDialog({
      title: 'Remove Member',
      message: `Remove this member from the workspace?`
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
  margin: 0 0 4px;
  padding: 0 24px;
}

.drawer-subtitle {
  font-size: 14px;
  color: #a7a7a7;
  text-align: center;
  margin: 0 0 20px;
  padding: 0 24px;
}

.drawer-body {
  padding: 0 24px;
}

.invite-section {
  margin-bottom: 20px;
}

.search-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.search-row .form-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  background: #fff;
}

.btn-search {
  padding: 10px 16px;
  border: none;
  background: #ff8d28;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
}

.btn-search:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-results {
  margin-top: 8px;
}

.search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e8e8e8;
}

.search-item-label {
  font-size: 14px;
  color: #1a1a2e;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-invite {
  padding: 6px 12px;
  border: none;
  background: rgba(255, 141, 40, 0.2);
  color: #e67a00;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
}

.btn-invite:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.members-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #a7a7a7;
  margin: 0 0 10px;
}

.loading-row {
  padding: 20px;
  text-align: center;
}

.empty-members {
  font-size: 14px;
  color: #a7a7a7;
  padding: 16px 0;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a2e;
}

.member-status {
  font-size: 12px;
  color: #a7a7a7;
}

.member-status.active {
  color: #52bf90;
}

.member-status.pending {
  color: #ff8d28;
}

.btn-remove {
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: rgba(195, 0, 16, 0.74);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.drawer-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel {
  width: 100%;
  padding: 12px;
  border: none;
  background: #ff8d28;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
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
