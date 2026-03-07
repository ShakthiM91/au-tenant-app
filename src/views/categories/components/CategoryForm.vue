<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="$emit('close')">Cancel</ion-button>
        </ion-buttons>
        <ion-title>{{ category?.id ? 'Edit Category' : 'Create Category' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="saving" @click="submit">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <form @submit.prevent="submit">
        <ion-list lines="inset">
          <ion-item>
            <ion-label position="stacked">Type</ion-label>
            <ion-note slot="end">{{ type === 'income' ? 'Income' : 'Expense' }}</ion-note>
          </ion-item>
          <ion-item v-if="!category?.id" button detail @click="showParentPicker = true">
            <ion-label position="stacked">Parent Category</ion-label>
            <ion-note slot="end">{{ parentText || 'None' }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Name</ion-label>
            <ion-input v-model="form.name" placeholder="Enter category name" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea v-model="form.description" placeholder="Optional" :rows="2" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Sort Order</ion-label>
            <ion-input v-model.number="form.sort_order" type="number" min="0" />
          </ion-item>
          <ion-item v-if="category?.id" button detail @click="showActivePicker = true">
            <ion-label position="stacked">Status</ion-label>
            <ion-note slot="end">{{ form.is_active ? 'Active' : 'Inactive' }}</ion-note>
          </ion-item>
        </ion-list>
      </form>

      <ion-modal :is-open="showParentPicker" @didDismiss="showParentPicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Parent Category</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="form.parent_id = null; showParentPicker = false">None</ion-button>
              <ion-button @click="showParentPicker = false">Cancel</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item
              v-for="p in flatParents"
              :key="p.id"
              button
              @click="form.parent_id = p.id; showParentPicker = false"
            >
              <ion-label :style="{ paddingLeft: (p.depth || 0) * 16 + 'px' }">{{ p.name }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <ion-modal :is-open="showActivePicker" @didDismiss="showActivePicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Status</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showActivePicker = false">Cancel</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item button @click="form.is_active = true; showActivePicker = false"><ion-label>Active</ion-label></ion-item>
            <ion-item button @click="form.is_active = false; showActivePicker = false"><ion-label>Inactive</ion-label></ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle,
  IonContent, IonList, IonItem, IonLabel, IonInput, IonTextarea, IonNote
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createCategory, updateCategory, getCategoryTree } from '@/api/accounting'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  category: { type: Object, default: null },
  type: { type: String, default: 'income' }
})

const emit = defineEmits(['close', 'success'])

const saving = ref(false)
const showParentPicker = ref(false)
const showActivePicker = ref(false)
const parentCategories = ref([])

const form = reactive({
  type: 'income',
  parent_id: null,
  name: '',
  description: '',
  sort_order: 0,
  is_active: true
})

function toBoolean(v) {
  if (v === null || v === undefined) return true
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  return Boolean(v)
}

const flatParents = computed(() => {
  const out = []
  function walk(items, depth = 0) {
    for (const item of items || []) {
      if (item.is_active !== false && item.id !== props.category?.id) {
        out.push({ ...item, depth })
        walk(item.children, depth + 1)
      }
    }
  }
  walk(parentCategories.value)
  return out
})

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
    const res = await getCategoryTree(props.type)
    const data = res?.data ?? (res?.success ? res?.data : []) ?? []
    parentCategories.value = Array.isArray(data) ? data : []
  } catch (_) {
    parentCategories.value = []
  }
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
    form.type = props.type
    form.parent_id = props.category?.parent_id != null ? Number(props.category.parent_id) : null
    form.name = ''
    form.description = ''
    form.sort_order = 0
    form.is_active = true
  }
}

watch(
  () => [props.isOpen, props.category, props.type],
  async ([open]) => {
    if (open) {
      await loadParents()
      resetForm()
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
ion-content { --background: #f7f8fa; }
</style>
