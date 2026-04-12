<template>
  <Teleport to="ion-app">
    <Transition name="drawer-fade">
      <div v-if="isOpen" class="drawer-backdrop" @click="$emit('close')" />
    </Transition>
    <Transition name="drawer-slide">
      <div v-if="isOpen" class="drawer-sheet">
        <div class="drawer-handle" />
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
        <div class="drawer-body-scroll">
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
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createWorkspace, updateWorkspace } from '@/api/workspace'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  workspace: { type: Object, default: null }
})

const emit = defineEmits(['close', 'success'])

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

.drawer-ion-header {
  flex-shrink: 0;
}

.drawer-body-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.drawer-handle {
  width: 36px;
  height: 4px;
  background: #D6D9DD;
  border-radius: 2px;
  margin: 12px auto 8px;
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
