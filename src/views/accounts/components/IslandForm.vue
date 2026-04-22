<template>
  <ion-modal
    ref="modalRef"
    :is-open="isOpen"
    @didDismiss="onDidDismiss"
    :initial-breakpoint="initialBreakpoint"
    :breakpoints="breakpoints"
    :handle="true"
  >
    <ion-header class="drawer-ion-header">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="$emit('close')">Cancel</ion-button>
            </ion-buttons>
            <ion-title>{{ isEdit ? 'Rename Island' : 'Add an Island' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button :disabled="saving" @click="submit">
                {{ saving ? 'Saving...' : (isEdit ? 'Save' : 'Add') }}
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
    </ion-header>
    <ion-content class="island-form-modal-content">
        <div class="adaptive-sheet-body">
        <form @submit.prevent="submit" class="drawer-form">
          <div class="form-group">
            <label class="form-label">Island Name</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="Enter island name"
              autocomplete="off"
            />
          </div>
        </form>
        </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { IonModal, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createWorkspace, updateWorkspace } from '@/api/workspace'
import { useIonSheetHeight } from '@/composables/useIonSheetHeight'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  workspace: { type: Object, default: null }
})

const emit = defineEmits(['close', 'success'])

function onDidDismiss() {
  emit('close')
}

const SHEET_HEIGHT_PCT = 42

const { modalRef, breakpoints, initialBreakpoint } = useIonSheetHeight(
  () => props.isOpen,
  SHEET_HEIGHT_PCT
)

const isEdit = computed(() => !!props.workspace?.id)
const saving = ref(false)
const form = reactive({ name: '' })

watch(
  () => [props.isOpen, props.workspace],
  ([open, ws]) => {
    if (open) {
      form.name = ws?.name?.replace(/\s*Island\s*$/i, '') || ws?.name || ''
    }
  },
  { immediate: true }
)

async function submit() {
  const name = (form.name || '').trim()
  if (!name) {
    showToast('Enter island name')
    return
  }
  if (name.length < 2 || name.length > 255) {
    showToast('Name should be 2–255 characters')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      const res = await updateWorkspace(props.workspace.id, { name })
      showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'Island renamed')
    } else {
      const res = await createWorkspace({ name })
      showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'Island created')
    }
    emit('success')
  } catch (e) {
    showToast(e?.message || 'Failed')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.island-form-modal-content {
  --background: #ffffff;
}

.drawer-ion-header {
  flex-shrink: 0;
}

.adaptive-sheet-body {
  min-height: 0;
}

.drawer-form {
  padding: 0 24px 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
  margin-bottom: 6px;
}

.form-input {
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

.form-input:focus {
  border-bottom-color: #FF8D28;
}

.form-input::placeholder {
  color: #A7A7A7;
}

</style>
