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
            <ion-title>{{ title }}</ion-title>
            <ion-buttons slot="end">
              <ion-button :disabled="saving" @click="submit">
                {{ saving ? 'Saving...' : 'Save' }}
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
    </ion-header>
    <ion-content class="profile-field-modal-content">
        <div class="adaptive-sheet-body">
        <div class="drawer-form">
          <div v-if="field === 'name'" class="form-group">
            <label class="form-label">Name</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              maxlength="255"
              placeholder="Your display name"
              autocomplete="name"
            />
          </div>

          <div v-else-if="field === 'username'" class="form-group">
            <label class="form-label">Username</label>
            <input
              v-model="form.username"
              type="text"
              class="form-input"
              maxlength="191"
              placeholder="Choose a username (optional)"
              autocomplete="username"
            />
            <p class="form-hint">Letters, numbers, dots, underscores, and hyphens.</p>
          </div>

          <div v-else-if="field === 'gender'" class="form-group">
            <label class="form-label">Gender</label>
            <GenderPickerField v-model="form.gender" :options="genderOptions" />
          </div>

          <div v-else-if="field === 'birthday'" class="form-group">
            <label class="form-label">Birthday</label>
            <BirthdayPickerField v-model="form.birthday" />
          </div>
        </div>
        </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { IonModal, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/vue'
import { showToast, showToastIcon } from '@/utils/ionicFeedback'
import { useUserStore } from '@/store/user'
import BirthdayPickerField from '@/views/profile/BirthdayPickerField.vue'
import GenderPickerField from '@/views/profile/GenderPickerField.vue'
import { useIonSheetHeight } from '@/composables/useIonSheetHeight'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  field: {
    type: String,
    required: true,
    validator: (v) =>
      ['name', 'username', 'gender', 'birthday'].includes(v)
  }
})

const emit = defineEmits(['close', 'success'])

function onDidDismiss() {
  emit('close')
}

const SHEET_HEIGHT_PCT = 72

const { modalRef, breakpoints, initialBreakpoint } = useIonSheetHeight(
  () => props.isOpen,
  SHEET_HEIGHT_PCT
)

const userStore = useUserStore()
const saving = ref(false)
const form = reactive({
  name: '',
  username: '',
  gender: 'prefer_not_say',
  birthday: ''
})

/* Order matches profile UI: Male, Female, Non-binary, Other, prefer not to say */
const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_say', label: "I'd rather not say" }
]

const title = computed(() => {
  const map = {
    name: 'Display name',
    username: 'Username',
    gender: 'Gender',
    birthday: 'Birthday'
  }
  return map[props.field] || 'Profile'
})

function syncFormFromStore() {
  if (props.field === 'name') {
    form.name = (userStore.name || '').trim() || ''
  } else if (props.field === 'username') {
    form.username = (userStore.username || '').trim() || ''
  } else if (props.field === 'gender') {
    form.gender = userStore.gender || 'prefer_not_say'
  } else if (props.field === 'birthday') {
    form.birthday = userStore.birthday || ''
  }
}

watch(
  () => [props.isOpen, props.field],
  ([open]) => {
    if (open) syncFormFromStore()
  },
  { immediate: true }
)

const USERNAME_RE = /^[a-zA-Z0-9._-]+$/

async function submit() {
  let payload = {}
  if (props.field === 'name') {
    const name = (form.name || '').trim()
    if (!name) {
      showToast('Enter your name')
      return
    }
    if (name.length > 255) {
      showToast('Name is too long')
      return
    }
    payload = { name }
  } else if (props.field === 'username') {
    const u = (form.username || '').trim()
    if (u && (u.length > 191 || !USERNAME_RE.test(u))) {
      showToast('Use up to 191 characters: letters, numbers, . _ -')
      return
    }
    payload = { username: u || '' }
  } else if (props.field === 'gender') {
    payload = { gender: form.gender || 'prefer_not_say' }
  } else if (props.field === 'birthday') {
    payload = { birthday: form.birthday || '' }
  }

  saving.value = true
  try {
    await userStore.updateUserProfile(payload)
    await showToastIcon()
    emit('success')
  } catch (e) {
    showToast(e?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profile-field-modal-content {
  --background: #ffffff;
}

.adaptive-sheet-body {
  min-height: 0;
}

.drawer-ion-header {
  flex-shrink: 0;
}

.drawer-form {
  padding: 0 24px 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 0;
  border: none;
  border-bottom: 1px solid #e8e8e8;
  background: transparent;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 15px;
  color: #1a1a2e;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-bottom-color: #ff8d28;
}

.form-input::placeholder {
  color: #a7a7a7;
}

.form-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6e6a7c;
  line-height: 1.4;
}

.link-clear {
  margin-top: 12px;
  padding: 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: #ff8d28;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

</style>
