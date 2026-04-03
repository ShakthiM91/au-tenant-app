<template>
  <Teleport to="ion-app">
    <Transition name="drawer-fade">
      <div v-if="isOpen" class="drawer-backdrop" @click="$emit('close')" />
    </Transition>
    <Transition name="drawer-slide">
      <div v-if="isOpen" class="drawer-sheet">
        <div class="drawer-handle" />
        <h2 class="drawer-title">{{ title }}</h2>

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
            <ion-select
              v-model="form.gender"
              interface="action-sheet"
              :interface-options="{ header: 'Gender' }"
              placeholder="Select gender"
              class="ion-select-inline"
            >
              <ion-select-option
                v-for="opt in genderOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </ion-select-option>
            </ion-select>
          </div>

          <div v-else-if="field === 'birthday'" class="form-group">
            <label class="form-label">Birthday</label>
            <BirthdayPickerField v-model="form.birthday" />
          </div>
        </div>

        <div class="drawer-footer">
          <button type="button" class="btn-cancel" @click="$emit('close')">
            Cancel
          </button>
          <button
            type="button"
            class="btn-add"
            :disabled="saving"
            @click="submit"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { IonSelect, IonSelectOption } from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { useUserStore } from '@/store/user'
import BirthdayPickerField from '@/views/profile/BirthdayPickerField.vue'

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

const userStore = useUserStore()
const saving = ref(false)
const form = reactive({
  name: '',
  username: '',
  gender: 'prefer_not_say',
  birthday: ''
})

const genderOptions = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
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
    showToast('Saved')
    emit('success')
  } catch (e) {
    showToast(e?.message || 'Failed to save')
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
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  text-align: center;
  margin: 0 0 24px;
  padding: 0 24px;
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

/* Matches AccountForm drawer selects — action-sheet UI, not native HTML select */
.ion-select-inline {
  width: 100%;
  padding: 10px 0;
  padding-inline-start: 0;
  padding-inline-end: 0;
  border: none;
  border-bottom: 1px solid #e8e8e8;
  border-radius: 0;
  background: transparent;
  font-size: 15px;
  color: #1a1a2e;
  max-width: 100%;
}

.ion-select-inline::part(container) {
  border: none;
  background: transparent;
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

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 24px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #a7a7a7;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px;
  -webkit-tap-highlight-color: transparent;
}

.btn-add {
  padding: 10px 24px;
  border: none;
  background: #ff8d28;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px;
  -webkit-tap-highlight-color: transparent;
}

.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
