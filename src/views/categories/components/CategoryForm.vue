<template>
  <ion-modal
    ref="mainModalRef"
    :is-open="isOpen"
    @didDismiss="onDidDismiss"
    :initial-breakpoint="mainInitialBreakpoint"
    :breakpoints="mainBreakpoints"
    :handle="true"
  >
    <div class="form-sheet-top">
      <header class="sheet-header">
        <button type="button" class="btn-cancel" @click="$emit('close')">Cancel</button>
        <h1 class="sheet-title">{{ formTitle }}</h1>
        <button type="button" class="btn-done" :disabled="saving" @click="submit">
          {{ primaryActionLabel }}
        </button>
      </header>
      <div class="sheet-header-divider" aria-hidden="true" />
      <div v-if="workspaceSubtitle" class="workspace-info">
        <p class="island-title">{{ workspaceSubtitle }}</p>
      </div>
    </div>
    <ion-content class="cat-sheet-modal-content">
          <div class="adaptive-sheet-body">
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

            <div v-if="canEditParent" class="form-group">
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
            <div v-else-if="isEdit && editedHasChildren" class="form-group">
              <span class="form-label">Parent Category</span>
              <div class="form-select-row form-select-row--disabled">
                <span class="form-select-value">None</span>
              </div>
              <p class="form-hint">This category has sub-categories, so it can't be moved under another category.</p>
            </div>

            <div class="form-group">
              <label class="form-label" for="cat-desc">Description</label>
              <input
                id="cat-desc"
                v-model="form.description"
                class="form-input"
                placeholder="Optional"
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
    </ion-content>
  </ion-modal>

  <ion-modal
    ref="parentModalRef"
    :is-open="showParentPicker"
    @didDismiss="showParentPicker = false"
    :initial-breakpoint="parentInitialBreakpoint"
    :breakpoints="parentBreakpoints"
    :handle="true"
  >
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
        <div class="adaptive-sheet-body">
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
        </div>
      </ion-content>
    </ion-modal>

  <ion-modal
    ref="activeModalRef"
    :is-open="showActivePicker"
    @didDismiss="showActivePicker = false"
    :initial-breakpoint="activeInitialBreakpoint"
    :breakpoints="activeBreakpoints"
    :handle="true"
  >
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="showActivePicker = false">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Status</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div class="adaptive-sheet-body">
        <ion-list>
          <ion-item button @click="form.is_active = true; showActivePicker = false"><ion-label>Active</ion-label></ion-item>
          <ion-item button @click="form.is_active = false; showActivePicker = false"><ion-label>Inactive</ion-label></ion-item>
        </ion-list>
        </div>
      </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonModal
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createCategory, updateCategory, getCategoryTree } from '@/api/accounting'
import { useIonSheetHeight } from '@/composables/useIonSheetHeight'

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
  workspaceId: { type: [Number, String], default: null },
  /** Shown under the header divider when set (e.g. current island). */
  workspaceName: { type: String, default: null }
})

const emit = defineEmits(['close', 'success'])

function onDidDismiss() {
  emit('close')
}

const saving = ref(false)
const showParentPicker = ref(false)
const showActivePicker = ref(false)
const parentCategories = ref([])
/** Hide chip list after the user picks a suggestion (reset when sheet opens or type changes). */
const suggestionsHidden = ref(false)

const MAIN_SHEET_PCT = 88
const PARENT_PICKER_SHEET_PCT = 52
const ACTIVE_PICKER_SHEET_PCT = 48

const { modalRef: mainModalRef, breakpoints: mainBreakpoints, initialBreakpoint: mainInitialBreakpoint } =
  useIonSheetHeight(() => props.isOpen, MAIN_SHEET_PCT)

const { modalRef: parentModalRef, breakpoints: parentBreakpoints, initialBreakpoint: parentInitialBreakpoint } =
  useIonSheetHeight(() => showParentPicker.value, PARENT_PICKER_SHEET_PCT)

const { modalRef: activeModalRef, breakpoints: activeBreakpoints, initialBreakpoint: activeInitialBreakpoint } =
  useIonSheetHeight(() => showActivePicker.value, ACTIVE_PICKER_SHEET_PCT)

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
  isEdit.value ? 'Edit Category' : 'Add New'
)

const primaryActionLabel = computed(() => {
  if (saving.value) return 'Saving…'
  return isEdit.value ? 'Save' : 'Add'
})

const workspaceSubtitle = computed(() => (props.workspaceName || '').trim())

const suggestedForType = computed(() =>
  form.type === 'income' ? SUGGESTED_INCOME : SUGGESTED_EXPENSE
)

function toBoolean(v) {
  if (v === null || v === undefined) return true
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  return Boolean(v)
}

/** Whether the category being edited has its own sub-categories (found in the tree). */
const editedHasChildren = computed(() => {
  const id = props.category?.id
  if (id == null) return false
  const node = findInTree(parentCategories.value, id)
  return Boolean(node?.children?.length)
})

/**
 * Show the parent picker on create always; on edit only when the category has no
 * sub-categories of its own (keeps the hierarchy to two levels).
 */
const canEditParent = computed(() => !isEdit.value || !editedHasChildren.value)

const rootParentOptions = computed(() =>
  (parentCategories.value || []).filter(
    (item) => item.is_active !== false && item.id !== props.category?.id
  )
)

/** Find a node by id in a category tree (root list with optional `children`). */
function findInTree(items, id) {
  for (const item of items || []) {
    if (item.id === id) return item
    const r = findInTree(item.children, id)
    if (r) return r
  }
  return null
}

const parentText = computed(() => {
  if (!form.parent_id) return 'None'
  return findInTree(parentCategories.value, form.parent_id)?.name || 'Unknown'
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
.cat-sheet-modal-content {
  --background: #ffffff;
}

.adaptive-sheet-body {
  min-height: 0;
}

.form-sheet-top {
  flex-shrink: 0;
  padding: 0 4px;
}

.sheet-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 4px 8px 10px;
  flex-shrink: 0;
}

.sheet-header-divider {
  height: 1px;
  margin: 0 0 12px;
  background: #e5e5ea;
}

.btn-cancel {
  justify-self: start;
  padding: 8px 12px;
  border: none;
  background: none;
  font-size: 17px;
  font-weight: 400;
  color: #8e8e93;
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

.btn-done:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.workspace-info {
  padding: 0 12px 16px;
  text-align: center;
}

.island-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 500;
  color: #1c1c1e;
  text-align: center;
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
  color: #ff8d28;
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
  background: transparent;
  font-size: 15px;
  text-align: left;
  color: #1a1a2e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.form-select-row--disabled {
  cursor: default;
  color: #a7a7a7;
}

.form-hint {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: #a7a7a7;
}

.form-select-value {
  flex: 1;
  min-width: 0;
}

.form-select-chevron {
  flex-shrink: 0;
  color: #a8a8a8;
}

</style>
