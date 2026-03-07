<template>
  <ion-page class="categories-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <div class="page-header">
          <span class="page-title">Manage Categories</span>
          <div class="header-actions">
            <button class="icon-btn" @click="openForm()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
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
          <p>No {{ activeTab }} categories</p>
          <button class="add-first-btn" @click="openForm()">Add category</button>
        </div>
      </div>
      <div class="tab-spacer" />
    </ion-content>

    <CategoryForm
      :is-open="formOpen"
      :category="currentCategory"
      :type="activeTab"
      @close="formOpen = false"
      @success="onFormSuccess"
    />

    <FloatingAddButton @select="onFabSelect" />

  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonSpinner } from '@ionic/vue'
import { showToast, showConfirmDialog } from '@/utils/ionicFeedback'
import { getCategoryTree, deleteCategory, toggleCategoryActive } from '@/api/accounting'
import CategoryItem from './components/CategoryItem.vue'
import CategoryForm from './components/CategoryForm.vue'
import FloatingAddButton from '@/components/dashboard/FloatingAddButton.vue'


const router = useRouter()
const activeTab = ref('income')
const loading = ref(false)
const incomeCategories = ref([])
const expenseCategories = ref([])
const formOpen = ref(false)
const currentCategory = ref(null)

const displayCategories = computed(() =>
  activeTab.value === 'income' ? incomeCategories.value : expenseCategories.value
)

async function load() {
  loading.value = true
  try {
    const [incomeRes, expenseRes] = await Promise.all([
      getCategoryTree('income'),
      getCategoryTree('expense')
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
      type: activeTab.value
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

function onFabSelect(type) {
  router.push(`/transactions/create?type=${type}`)
}


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
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A2E;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  -webkit-tap-highlight-color: transparent;
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

.tab-spacer {
  height: 80px;
}
</style>
