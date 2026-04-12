<template>
  <ion-page class="categories-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <div class="page-header">
          <button class="back-btn" @click="$router.back()" aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div class="page-title-block">
            <span class="page-title">Categories</span>
            <span v-if="workspaceName" class="page-title-ws">{{ workspaceName }}</span>
          </div>
          <div class="header-actions">
            <button type="button" class="icon-btn icon-btn--accent" aria-label="Add category" @click="openForm()">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              type="button"
              class="icon-btn icon-btn--accent"
              :class="{ 'is-active': sortAlphabetically }"
              aria-label="Sort categories A–Z"
              @click="sortAlphabetically = !sortAlphabetically"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="3" y1="7" x2="13" y2="7" />
                <line x1="3" y1="12" x2="9" y2="12" />
                <line x1="3" y1="17" x2="7" y2="17" />
                <line x1="18" y1="5" x2="18" y2="14" />
                <polyline points="15 11 18 14 21 11" />
              </svg>
            </button>
            <button type="button" class="icon-btn icon-btn--accent" aria-label="More options" @click.stop="openHeaderMore($event)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="18" r="1.5" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Income / Expense Toggle -->
        <div class="type-toggle">
          <button
            class="toggle-btn"
            :class="{ active: activeTab === 'income' }"
            @click="activeTab = 'income'"
          >
            <span class="toggle-dot income-dot" />
            Income
          </button>
          <button
            class="toggle-btn"
            :class="{ active: activeTab === 'expense' }"
            @click="activeTab = 'expense'"
          >
            <span class="toggle-dot expense-dot" />
            Expense
          </button>
        </div>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent" />
        </div>

        <div v-else-if="displayCategories.length" class="categories-island">
          <CategoryItem
            v-for="cat in displayCategories"
            :key="cat.id"
            :category="cat"
            @edit="c => openForm(c)"
            @delete="c => onDelete(c)"
            @toggle-active="(c, isActive) => onToggleActive(c, isActive)"
            @add-child="parentId => openForm(null, parentId)"
          />
        </div>

        <div v-else class="empty-state">
          <p v-if="workspaceId">{{ workspaceName ? `No categories in ${workspaceName}` : 'No categories in this island' }}</p>
          <p v-else>No {{ activeTab }} categories</p>
          <p v-if="workspaceId" class="empty-hint">Create your first category in this island.</p>
          <button class="add-first-btn" @click="openForm()">{{ workspaceId ? 'Create your first category' : 'Add category' }}</button>
        </div>
      </div>
      <div class="tab-spacer" />
    </ion-content>

    <CategoryForm
      :is-open="formOpen"
      :category="currentCategory"
      :type="activeTab"
      :workspace-id="workspaceId"
      @close="formOpen = false"
      @success="onFormSuccess"
    />

    <ion-popover
      :is-open="showHeaderMore"
      :event="headerMoreEvent"
      :dismiss-on-select="true"
      :arrow="false"
      class="categories-header-more-popover"
      @didDismiss="onHeaderMorePopoverDismiss"
    >
      <ion-content class="categories-header-more-content" :scroll-y="false">
        <ion-list lines="none" class="header-more-list">
          <ion-item
            button
            lines="none"
            :detail="false"
            class="header-more-item"
            @click="onHeaderMoreOption('select')"
          >
            <ion-label class="header-more-label header-more-label--lead">Select</ion-label>
          </ion-item>
          <ion-item
            button
            lines="none"
            :detail="false"
            class="header-more-item"
            @click="onHeaderMoreOption('setup-budget')"
          >
            <ion-label class="header-more-label">Set up a Budget</ion-label>
          </ion-item>
          <ion-item
            button
            lines="none"
            :detail="false"
            class="header-more-item"
            @click="onHeaderMoreOption('browse-template')"
          >
            <ion-label class="header-more-label">Browse Template</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-popover>

  </ion-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonPopover,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/vue'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getCategoryTree, deleteCategory, toggleCategoryActive } from '@/api/accounting'
import CategoryItem from './components/CategoryItem.vue'
import CategoryForm from './components/CategoryForm.vue'
const route = useRoute()
const workspaceId = computed(() => {
  const id = route.query.workspace_id
  return id != null && id !== '' ? Number(id) : null
})
const workspaceName = computed(() => {
  const name = route.query.workspace_name
  return name ? decodeURIComponent(name) : null
})
const activeTab = ref('income')
const loading = ref(false)
const incomeCategories = ref([])
const expenseCategories = ref([])
const formOpen = ref(false)
const currentCategory = ref(null)
const sortAlphabetically = ref(false)
const showHeaderMore = ref(false)
const headerMoreEvent = ref(undefined)

function sortCategoryTree(nodes) {
  if (!nodes?.length) return nodes
  return [...nodes]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    .map((n) => ({
      ...n,
      children: n.children?.length ? sortCategoryTree(n.children) : n.children
    }))
}

const displayCategories = computed(() => {
  const list = activeTab.value === 'income' ? incomeCategories.value : expenseCategories.value
  return sortAlphabetically.value ? sortCategoryTree(list) : list
})

function openHeaderMore(ev) {
  headerMoreEvent.value = ev
  showHeaderMore.value = true
}

function onHeaderMorePopoverDismiss() {
  showHeaderMore.value = false
  headerMoreEvent.value = undefined
}

/** @param {'select' | 'setup-budget' | 'browse-template'} _key */
function onHeaderMoreOption(_key) {
  showHeaderMore.value = false
}

async function load() {
  loading.value = true
  try {
    const wsId = workspaceId.value
    const [incomeRes, expenseRes] = await Promise.all([
      getCategoryTree('income', wsId),
      getCategoryTree('expense', wsId)
    ])
    incomeCategories.value = normalizeData(incomeRes)
    expenseCategories.value = normalizeData(expenseRes)
  } catch (e) {
    showToast('Failed to load categories')
    incomeCategories.value = []
    expenseCategories.value = []
  } finally {
    loading.value = false
  }
}

function normalizeData(res) {
  const data = res?.data ?? (res?.success ? res?.data : []) ?? []
  return Array.isArray(data) ? data : []
}

function openForm(category = null, parentId = null) {
  if (category) {
    if (category.is_default || category.tenant_id == null) {
      showToast('Default categories cannot be edited')
      return
    }
    currentCategory.value = { ...category }
  } else {
    currentCategory.value = {
      parent_id: parentId != null ? Number(parentId) : null,
      type: activeTab.value,
      workspace_id: workspaceId.value
    }
  }
  formOpen.value = true
}

async function onDelete(cat) {
  if (cat.is_default || cat.tenant_id == null) {
    showToast('Default categories cannot be deleted')
    return
  }
  try {
    await showConfirmDialog({ title: 'Delete', message: `Delete "${cat.name}"?` })
    const res = await deleteCategory(cat.id)
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'Deleted')
    load()
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

async function onToggleActive(cat, isActive) {
  if (cat.is_default || cat.tenant_id == null) {
    showToast('Default categories cannot be toggled')
    return
  }
  try {
    await toggleCategoryActive(cat.id, isActive)
    showToast(isActive ? 'Activated' : 'Deactivated')
    load()
  } catch (e) {
    showToast(e?.message || 'Failed')
  }
}

function onFormSuccess() {
  formOpen.value = false
  currentCategory.value = null
  load()
}

watch(() => [route.query.workspace_id], () => load(), { immediate: false })
onMounted(() => load())
</script>

<style scoped>
.categories-page {
  --background: #F5F5F7;
}

.categories-page ion-content {
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
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  color: #ff8d28;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.page-title-block {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #000000;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.page-title-ws {
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  -webkit-tap-highlight-color: transparent;
}

.icon-btn--accent {
  color: #ff8d28;
}

.icon-btn--accent.is-active {
  background: rgba(255, 141, 40, 0.12);
}

.type-toggle {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.toggle-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #A7A7A7;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.toggle-btn.active {
  background: #F5F5F7;
  color: #1A1A2E;
}

.toggle-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.income-dot {
  background: #52BF90;
}

.expense-dot {
  background: rgba(195, 0, 16, 0.74);
}

.categories-island {
  background: #fff;
  border-radius: 16px;
  padding: 8px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
}

.empty-state p {
  font-size: 14px;
  color: #A7A7A7;
  margin-bottom: 8px;
}

.empty-state .empty-hint {
  font-size: 13px;
  color: #A7A7A7;
  margin-bottom: 16px;
  opacity: 0.9;
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

.tab-spacer {
  height: 80px;
}
</style>

<style>
ion-popover.categories-header-more-popover {
  --width: 248px;
  --max-width: min(248px, calc(100vw - 32px));
}

ion-popover.categories-header-more-popover::part(content) {
  border-radius: 18px;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.16);
  background: #ffffff;
}

ion-popover.categories-header-more-popover .categories-header-more-content {
  --background: #ffffff;
  --padding-start: 24px;
  --padding-end: 24px;
  --padding-top: 24px;
  --padding-bottom: 24px;
}

ion-popover.categories-header-more-popover ion-list.header-more-list {
  margin: 0;
  padding: 0;
  background: transparent;
}

ion-popover.categories-header-more-popover ion-item.header-more-item {
  --background: transparent;
  --background-hover: rgba(0, 0, 0, 0.04);
  --background-activated: rgba(0, 0, 0, 0.06);
  --border-width: 0;
  --inner-border-width: 0;
  --min-height: auto;
  --inner-padding-end: 0;
  --inner-padding-start: 0;
  --padding-start: 0;
  --padding-end: 0;
  --ripple-color: rgba(0, 0, 0, 0.08);
  margin-bottom: 28px;
  align-items: center;
}

ion-popover.categories-header-more-popover ion-item.header-more-item:last-of-type {
  margin-bottom: 0;
}

ion-popover.categories-header-more-popover ion-item.header-more-item .header-more-label {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: #000000;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.35;
  text-align: left;
  white-space: normal;
}

ion-popover.categories-header-more-popover ion-item.header-more-item .header-more-label--lead {
  font-weight: 500;
}
</style>
