<template>
  <Teleport to="ion-app">
    <Transition name="fade">
      <div v-if="visible" class="picker-backdrop" @click="onCancel">
        <div class="picker-popup" @click.stop>
          <ion-header class="picker-ion-header">
            <ion-toolbar>
              <ion-buttons slot="start">
                <ion-button @click="onCancel">Cancel</ion-button>
              </ion-buttons>
              <ion-title>Select date</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="onConfirm">OK</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <div class="picker-header">
            <span class="header-year">{{ viewYear }}</span>
            <span class="header-date">{{ headerDateLabel }}</span>
          </div>

          <div class="picker-nav">
            <button type="button" class="nav-btn" @click="navYear(-1)">«</button>
            <button type="button" class="nav-btn" @click="navMonth(-1)">‹</button>
            <span class="nav-label">{{ monthLabel }}</span>
            <button type="button" class="nav-btn" @click="navMonth(1)">›</button>
            <button type="button" class="nav-btn" @click="navYear(1)">»</button>
          </div>

          <div class="picker-calendar">
            <div class="weekdays">
              <span v-for="d in weekdays" :key="d" class="weekday">{{ d }}</span>
            </div>
            <div class="days-grid">
              <button
                v-for="cell in calendarCells"
                :key="cell.key"
                type="button"
                class="day-cell"
                :class="cell.classes"
                @click="onDayClick(cell)"
              >
                {{ cell.label }}
              </button>
            </div>
          </div>

          <div class="picker-quick">
            <button type="button" class="quick-btn" @click="setToday">Today</button>
            <button type="button" class="quick-btn" @click="setYesterday">Yesterday</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'close', 'select'])

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const tempDate = ref('')

function setViewToDate(d) {
  if (Number.isNaN(d.getTime())) return
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

watch(() => props.visible, (v) => {
  if (v) {
    const val = props.modelValue || ''
    tempDate.value = val
    const d = val ? new Date(val) : new Date()
    setViewToDate(d)
  }
})

const monthLabel = computed(() => {
  return new Date(viewYear.value, viewMonth.value)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const headerDateLabel = computed(() => {
  if (!tempDate.value) return 'Select date'
  const d = new Date(tempDate.value)
  if (Number.isNaN(d.getTime())) return 'Select date'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' })
})

const calendarCells = computed(() => {
  const year = viewYear.value
  const month = viewMonth.value
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDow = (first.getDay() + 6) % 7
  const daysInMonth = last.getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells = []
  let dayNum = 1
  let nextMonthDay = 1
  const prevYear = month === 0 ? year - 1 : year
  const prevMonth1 = month === 0 ? 12 : month

  const today = toDateStr(new Date())

  for (let i = 0; i < 42; i++) {
    let label = ''
    let dateStr = ''
    let otherMonth = false

    if (i < startDow) {
      const d = prevMonthDays - startDow + i + 1
      label = String(d)
      dateStr = `${prevYear}-${pad(prevMonth1)}-${pad(d)}`
      otherMonth = true
    } else if (dayNum <= daysInMonth) {
      label = String(dayNum)
      dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`
      dayNum++
    } else {
      label = String(nextMonthDay)
      const nextM = month + 2
      const nextY = nextM > 12 ? year + 1 : year
      dateStr = `${nextY}-${pad(nextM > 12 ? 1 : nextM)}-${pad(nextMonthDay)}`
      nextMonthDay++
      otherMonth = true
    }

    const isSelected = dateStr === tempDate.value
    const isToday = dateStr === today

    cells.push({
      key: `${year}-${month}-${i}`,
      label,
      date: dateStr,
      classes: [
        otherMonth && 'other-month',
        isSelected && 'selected',
        isToday && !isSelected && 'today',
      ].filter(Boolean).join(' ')
    })
  }
  return cells
})

function pad(n) { return String(n).padStart(2, '0') }
function toDateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

function navYear(delta) { viewYear.value += delta }
function navMonth(delta) {
  viewMonth.value += delta
  if (viewMonth.value > 11) { viewMonth.value = 0; viewYear.value++ }
  else if (viewMonth.value < 0) { viewMonth.value = 11; viewYear.value-- }
}

function onDayClick(cell) {
  tempDate.value = cell.date
}

function setToday() {
  const d = new Date()
  tempDate.value = toDateStr(d)
  setViewToDate(d)
}

function setYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  tempDate.value = toDateStr(d)
  setViewToDate(d)
}

function onConfirm() {
  emit('update:modelValue', tempDate.value)
  emit('select', tempDate.value)
  emit('close')
}

function onCancel() { emit('close') }
</script>

<style scoped>
.picker-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.picker-popup {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 0 20px 20px;
  max-width: 340px;
  width: 100%;
  max-height: min(90vh, 640px);
  overflow: hidden;
}

/* ion-header/ion-toolbar do not auto-stretch in a plain div; size the host to the card edges. */
.picker-ion-header {
  display: block;
  flex-shrink: 0;
  align-self: stretch;
  width: calc(100% + 40px);
  max-width: none;
  margin: 0 -20px;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  box-sizing: border-box;
}

.picker-ion-header :deep(ion-toolbar) {
  --min-height: 48px;
  width: 100%;
}

.picker-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 16px;
  margin-bottom: 16px;
}

.header-year {
  font-size: 13px;
  font-weight: 500;
  color: #ff8d28;
}

.header-date {
  font-size: 26px;
  font-weight: 700;
  color: #ff8d28;
}

.picker-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 12px;
}

.nav-btn {
  background: none;
  border: none;
  padding: 6px 10px;
  font-size: 16px;
  color: #6e6a7c;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.nav-label {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  min-width: 130px;
  text-align: center;
}

.picker-calendar { margin-bottom: 16px; }

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6e6a7c;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  cursor: pointer;
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.day-cell.other-month { color: #b0b0b0; }
.day-cell.today { color: #ff8d28; font-weight: 700; }

.day-cell.selected {
  background: #ff8d28;
  color: #fff !important;
}

.day-cell:not(.selected):active {
  background: rgba(255, 141, 40, 0.15);
}

.picker-quick {
  display: flex;
  gap: 8px;
  margin-bottom: 0;
}

.quick-btn {
  flex: 1;
  padding: 10px;
  border: 1.5px solid #ff8d28;
  border-radius: 20px;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  color: #ff8d28;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
