<template>
  <Teleport to="ion-app">
    <Transition name="cat-sheet-fade">
      <div v-if="isOpen" class="cat-sheet-backdrop" @click="$emit('close')" />
    </Transition>
    <Transition name="cat-sheet-slide">
      <div v-if="isOpen" class="cat-sheet">
        <div class="cat-sheet-handle" />
        <ion-header class="cat-sheet-ion-header">
          <ion-toolbar class="cat-sheet-toolbar">
            <ion-buttons slot="start">
              <ion-button class="cat-sheet-btn-cancel" fill="clear" @click="$emit('close')">Cancel</ion-button>
            </ion-buttons>
            <ion-title class="cat-sheet-title">{{ formTitle }}</ion-title>
            <ion-buttons slot="end">
              <ion-button
                class="cat-sheet-btn-primary"
                fill="clear"
                :disabled="saving"
                @click="submit"
              >
                {{ primaryActionLabel }}
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <div class="cat-sheet-header-rule" />
        <div class="cat-sheet-body">
          <form @submit.prevent="submit" class="cat-sheet-form">
            <div
              v-if="showTypeSegment"
              class="type-segment"
              :class="{ 'type-segment--locked': isEdit }"
            >
              <button
                type="button"
                class="type-seg"
                :class="{ active: form.type === 'income' }"
                :disabled="isEdit"
                @click="onTypeSelect('income')"
              >
                Income
              </button>
              <button
                type="button"
                class="type-seg"
                :class="{ active: form.type === 'expense' }"
                :disabled="isEdit"
                @click="onTypeSelect('expense')"
              >
                Expense
              </button>
            </div>

            <div class="form-group">
              <label class="form-label" for="cat-name">Category Name</label>
              <input
                id="cat-name"
                v-model="form.name"
                type="text"
                class="form-input"
                placeholder="Enter category name"
                autocapitalize="words"
              />
            </div>

            <div v-if="!isEdit && !suggestionsHidden" class="form-group">
              <span class="form-label-suggested">Suggested Categories</span>
              <div class="suggested-pills">
                <button
                  v-for="s in suggestedForType"
                  :key="s"
                  type="button"
                  class="suggested-pill"
                  @click="selectSuggestion(s)"
                >
                  {{ s }}
                </button>
              </div>
            </div>

            <div v-if="!isEdit" class="form-group">
              <span class="form-label">Parent Category</span>
              <button type="button" class="form-select-row" @click="showParentPicker = true">
                <span class="form-select-value">{{ parentText || 'None' }}</span>
                <svg
                  class="form-select-chevron"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            <div class="form-group">
              <label class="form-label" for="cat-desc">Description</label>
              <textarea
                id="cat-desc"
                v-model="form.description"
                class="form-textarea"
                placeholder="Optional"
                rows="2"
              />
            </div>

            <div v-if="isEdit" class="form-group">
              <span class="form-label">Status</span>
              <button type="button" class="form-select-row" @click="showActivePicker = true">
                <span class="form-select-value">{{ form.is_active ? 'Active' : 'Inactive' }}</span>
                <svg
                  class="form-select-chevron"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <ion-modal :is-open="showParentPicker" @didDismiss="showParentPicker = false">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="showParentPicker = false">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Parent Category</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="form.parent_id = null; showParentPicker = false">None</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item
            v-for="p in rootParentOptions"
            :key="p.id"
            button
            @click="form.parent_id = p.id; showParentPicker = false"
          >
            <ion-label>{{ p.name }}</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="showActivePicker" @didDismiss="showActivePicker = false">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="showActivePicker = false">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Status</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item button @click="form.is_active = true; showActivePicker = false"><ion-label>Active</ion-label></ion-item>
          <ion-item button @click="form.is_active = false; showActivePicker = false"><ion-label>Inactive</ion-label></ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonTitle,
  IonContent, IonList, IonItem, IonLabel, IonModal
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createCategory, updateCategory, getCategoryTree } from '@/api/accounting'

const SUGGESTED_INCOME = [
  'Salary', 'Freelance', 'Interest', 'Dividends', 'Gifts', 'Rental', 'Refunds', 'Other Income'
]
const SUGGESTED_EXPENSE = [
  'Water', 'Home Maintenance', 'Taxes', 'Takeaway', 'Electricity & Gas', 'Vehicle Expenses', 'Travel',
  'Food & Groceries', 'Entertainment', 'Health'
]

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  category: { type: Object, default: null },
  type: { type: String, default: 'income' },
  workspaceId: { type: [Number, String], default: null }
})

const emit = defineEmits(['close', 'success'])

const saving = ref(false)
const showParentPicker = ref(false)
const showActivePicker = ref(false)
const parentCategories = ref([])
/** Hide chip list after the user picks a suggestion (reset when sheet opens or type changes). */
const suggestionsHidden = ref(false)

const form = reactive({
  type: 'income',
  parent_id: null,
  name: '',
  description: '',
  sort_order: 0,
  is_active: true
})

const isEdit = computed(() => Boolean(props.category?.id))

/** Subcategories inherit the parent's type — hide Income / Expense for create and edit. */
const hasParentCategory = computed(() => {
  const p = props.category?.parent_id
  return p != null && p !== ''
})

const showTypeSegment = computed(() => !hasParentCategory.value)

const formTitle = computed(() =>
  isEdit.value ? 'Edit Category' : 'Add New Category'
)

const primaryActionLabel = computed(() => {
  if (saving.value) return 'Saving…'
  return isEdit.value ? 'Save' : 'Add'
})

const suggestedForType = computed(() =>
  form.type === 'income' ? SUGGESTED_INCOME : SUGGESTED_EXPENSE
)

function toBoolean(v) {
  if (v === null || v === undefined) return true
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  return Boolean(v)
}

const rootParentOptions = computed(() =>
  (parentCategories.value || []).filter(
    (item) => item.is_active !== false && item.id !== props.category?.id
  )
)

const parentText = computed(() => {
  if (!form.parent_id) return 'None'
  function find(items) {
    for (const item of items || []) {
      if (item.id === form.parent_id) return item.name
      const r = find(item.children)
      if (r) return r
    }
    return null
  }
  return find(parentCategories.value) || 'Unknown'
})

async function loadParents() {
  try {
    const res = await getCategoryTree(
      form.type,
      props.workspaceId != null ? Number(props.workspaceId) : null
    )
    const data = res?.data ?? (res?.success ? res?.data : []) ?? []
    parentCategories.value = Array.isArray(data) ? data : []
  } catch (_) {
    parentCategories.value = []
  }
}

function selectSuggestion(name) {
  form.name = name
  suggestionsHidden.value = true
}

async function onTypeSelect(t) {
  if (isEdit.value || form.type === t) return
  form.type = t
  form.parent_id = null
  suggestionsHidden.value = false
  await loadParents()
}

function resetForm() {
  if (props.category?.id) {
    form.type = props.category.type || props.type
    form.parent_id = props.category.parent_id != null ? Number(props.category.parent_id) : null
    form.name = props.category.name || ''
    form.description = props.category.description || ''
    form.sort_order = props.category.sort_order ?? 0
    form.is_active = toBoolean(props.category.is_active)
  } else {
    form.type = props.category?.type ?? props.type
    form.parent_id = props.category?.parent_id != null ? Number(props.category.parent_id) : null
    form.name = ''
    form.description = ''
    form.sort_order = 0
    form.is_active = true
  }
  suggestionsHidden.value = false
}

watch(
  () => [props.isOpen, props.category, props.type, props.workspaceId],
  async ([open]) => {
    if (open) {
      resetForm()
      await loadParents()
    }
  },
  { immediate: true }
)

async function submit() {
  const name = (form.name || '').trim()
  if (!name) {
    showToast('Enter category name')
    return
  }
  if (name.length < 2 || name.length > 255) {
    showToast('Name should be 2–255 characters')
    return
  }
  saving.value = true
  try {
    const data = {
      type: form.type,
      name,
      parent_id: form.parent_id || null,
      description: form.description?.trim() || null,
      sort_order: form.sort_order ?? 0,
      is_active: form.is_active
    }
    if (!props.category?.id && props.workspaceId != null) {
      data.workspace_id = Number(props.workspaceId)
    }
    const res = props.category?.id
      ? await updateCategory(props.category.id, data)
      : await createCategory(data)
    if (res?.queued) showToast('Saved locally. Will sync when online.')
    emit('success')
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.cat-sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
}

.cat-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
  overflow: hidden;
  background: #fff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  z-index: 1001;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.cat-sheet-handle {
  width: 36px;
  height: 4px;
  background: #d6d9dd;
  border-radius: 2px;
  margin: 12px auto 4px;
  flex-shrink: 0;
}

.cat-sheet-ion-header {
  flex-shrink: 0;
}

.cat-sheet-toolbar {
  --background: #ffffff;
  --border-width: 0;
  --min-height: 52px;
  padding: 0 4px;
}

.cat-sheet-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
}

.cat-sheet-header-rule {
  height: 1px;
  background: #ebebeb;
  flex-shrink: 0;
  margin: 0 0 4px;
}

.cat-sheet-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.cat-sheet-form {
  padding: 20px 24px 28px;
}

.type-segment {
  display: flex;
  background: #efeff1;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
  gap: 4px;
}

.type-segment--locked {
  opacity: 0.85;
}

.type-seg {
  flex: 1;
  border: none;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: #a7a7a7;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s, color 0.2s;
}

.type-seg:disabled {
  cursor: default;
}

.type-seg.active {
  background: #fff;
  color: #ff8d28;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #5c5c6e;
  margin-bottom: 6px;
}

.form-label-suggested {
  display: block;
  font-size: 12px;
  color: #a7a7a7;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
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

.form-input:focus,
.form-textarea:focus {
  border-bottom-color: #ff8d28;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #a7a7a7;
}

.form-textarea {
  resize: none;
  min-height: 64px;
}

.suggested-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggested-pill {
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 141, 40, 0.45);
  background: #fff;
  color: #e67a00;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.suggested-pill:hover,
.suggested-pill:active {
  background: rgba(255, 141, 40, 0.08);
}

.form-select-row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  border: none;
  border-bottom: 1px solid #e8e8e8;
  background: transparent;
  font-size: 15px;
  text-align: left;
  color: #1a1a2e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.form-select-value {
  flex: 1;
  min-width: 0;
}

.form-select-chevron {
  flex-shrink: 0;
  color: #a8a8a8;
}

/* Header buttons: grey cancel, orange primary */
.cat-sheet-btn-cancel {
  --color: #8e8e93;
  font-size: 16px;
  font-weight: 400;
}

.cat-sheet-btn-primary {
  --color: #ff8d28;
  font-size: 16px;
  font-weight: 600;
}

.cat-sheet-fade-enter-active,
.cat-sheet-fade-leave-active {
  transition: opacity 0.25s ease;
}

.cat-sheet-fade-enter-from,
.cat-sheet-fade-leave-to {
  opacity: 0;
}

.cat-sheet-slide-enter-active,
.cat-sheet-slide-leave-active {
  transition: transform 0.3s ease-out;
}

.cat-sheet-slide-enter-from,
.cat-sheet-slide-leave-to {
  transform: translateY(100%);
}
</style>
