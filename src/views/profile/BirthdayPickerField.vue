<template>
  <div class="birthday-picker">
    <button type="button" class="birthday-trigger" @click="openModal">
      <span class="birthday-text" :class="{ isPlaceholder: !modelValue }">
        {{ displayLabel }}
      </span>
      <ion-icon :icon="calendarOutline" class="birthday-icon" aria-hidden="true" />
    </button>

    <button
      v-if="modelValue"
      type="button"
      class="link-clear"
      @click="clear"
    >
      Clear date
    </button>

    <ion-modal
      ref="modalRef"
      :is-open="modalOpen"
      @didDismiss="onModalDismiss"
      :initial-breakpoint="initialBreakpoint"
      :breakpoints="breakpoints"
      :handle="true"
    >
      <ion-header>
        <ion-toolbar class="bday-toolbar">
          <ion-buttons slot="start">
            <ion-button @click="closeWithoutApply">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Select date</ion-title>
          <ion-buttons slot="end">
            <ion-button class="bday-done" @click="confirm">Done</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="bday-modal-content">
        <div class="adaptive-sheet-body">
        <div class="bday-datetime-wrap">
          <ion-datetime
            v-model="draftIso"
            presentation="date"
            :max="maxIso"
            :min="minIso"
            size="cover"
          />
        </div>
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonDatetime,
  IonIcon
} from '@ionic/vue'
import { calendarOutline } from 'ionicons/icons'
import { useIonSheetHeight } from '@/composables/useIonSheetHeight'

const props = defineProps({
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const modalOpen = ref(false)

const SHEET_HEIGHT_PCT = 48

const { modalRef, breakpoints, initialBreakpoint } = useIonSheetHeight(
  () => modalOpen.value,
  SHEET_HEIGHT_PCT
)
const draftIso = ref('')

const minIso = '1900-01-01'

const maxIso = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

function defaultDraftIso() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 25)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function normalizeToDateInput(iso) {
  if (!iso) return ''
  const s = String(iso)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}

const displayLabel = computed(() => {
  const v = props.modelValue
  if (!v || !String(v).trim()) {
    return 'Tap to choose your birthday'
  }
  const ymd = normalizeToDateInput(v)
  if (!ymd) return v
  const d = new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(d.getTime())) return v
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d)
  } catch {
    return ymd
  }
})

function openModal() {
  const cur = normalizeToDateInput(props.modelValue)
  draftIso.value = cur || defaultDraftIso()
  modalOpen.value = true
}

function closeWithoutApply() {
  modalOpen.value = false
}

function onModalDismiss() {
  modalOpen.value = false
}

function confirm() {
  const ymd = normalizeToDateInput(draftIso.value)
  emit('update:modelValue', ymd || '')
  modalOpen.value = false
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<style scoped>
.birthday-picker {
  width: 100%;
}

.birthday-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 10px 0;
  margin: 0;
  border: none;
  border-bottom: 1px solid #e8e8e8;
  background: transparent;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
}

.birthday-trigger:active {
  opacity: 0.85;
}

.birthday-text {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 400;
  color: #1a1a2e;
  line-height: 1.35;
}

.birthday-text.isPlaceholder {
  color: #a7a7a7;
}

.birthday-icon {
  flex-shrink: 0;
  font-size: 22px;
  color: #ff8d28;
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

.bday-toolbar {
  --background: #ffffff;
  --border-width: 0;
}

.bday-toolbar ion-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
}

.bday-done {
  --color: #ff8d28;
  font-weight: 600;
}

.adaptive-sheet-body {
  min-height: 0;
}

.bday-modal-content {
  --background: #ffffff;
}

.bday-datetime-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 12px 24px;
  max-width: 100%;
}

.bday-datetime-wrap ion-datetime {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  --background: #fff;
}
</style>
