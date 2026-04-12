<template>
  <Teleport to="ion-app">
    <Transition name="fade">
      <div v-if="visible" class="picker-backdrop" @click="onCancel">
        <div class="picker-popup" @click.stop>
          <div class="picker-header">
            <span class="header-year">{{ displayYear }}</span>
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
                :disabled="!cell.date"
                @click="cell.date && onDayClick(cell)"
              >
                {{ cell.label }}
              </button>
            </div>
          </div>

          <div class="picker-quick">
            <button type="button" class="quick-btn" @click="setToday">Today</button>
            <button type="button" class="quick-btn" @click="setYesterday">Yesterday</button>
          </div>

          <div class="picker-actions">
            <button type="button" class="action-btn" @click="onCancel">Cancel</button>
            <button type="button" class="action-btn clear-btn" @click="onClear">Clear</button>
            <button type="button" class="action-btn primary" @click="onConfirm">OK</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  modelValue: { type: Object, default: () => ({ from: '', to: '' }) }
})

const emit = defineEmits(['update:modelValue', 'close', 'select', 'clear'])

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const tempFrom = ref('')
const tempTo = ref('')

watch(
  () => props.visible,
  (v) => {
    if (v) {
      const from = props.modelValue?.from || ''
      const to = props.modelValue?.to || ''
      tempFrom.value = from ? dateKey(from) : ''
      tempTo.value = to ? dateKey(to) : ''
      if (from) {
        const d = new Date(from)
        if (!Number.isNaN(d.getTime())) {
          viewYear.value = d.getFullYear()
          viewMonth.value = d.getMonth()
        }
      } else {
        const now = new Date()
        viewYear.value = now.getFullYear()
        viewMonth.value = now.getMonth()
      }
    }
  }
)

const displayYear = computed(() => viewYear.value)
const monthLabel = computed(() => {
  const d = new Date(viewYear.value, viewMonth.value)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const headerDateLabel = computed(() => {
  if (tempFrom.value && tempTo.value) {
    const f = new Date(tempFrom.value)
    const t = new Date(tempTo.value)
    if (tempFrom.value === tempTo.value) {
      return f.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' })
    }
    return `${f.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' })} – ${t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' })}`
  }
  if (tempFrom.value) {
    const f = new Date(tempFrom.value)
    return f.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' })
  }
  return 'Select date range'
})

const calendarCells = computed(() => {
  const year = viewYear.value
  const month = viewMonth.value
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDow = (first.getDay() + 6) % 7
  const daysInMonth = last.getDate()
  const prevMonth = new Date(year, month, 0)
  const prevDays = prevMonth.getDate()

  const cells = []
  let dayNum = 1
  let nextMonthDay = 1

  const prevYear = month === 0 ? year - 1 : year
  const prevMonth1 = month === 0 ? 12 : month

  for (let i = 0; i < 42; i++) {
    let label = ''
    let dateStr = ''
    const classes = ['day-cell']

    if (i < startDow) {
      const d = prevDays - startDow + i + 1
      label = String(d)
      dateStr = `${prevYear}-${pad(prevMonth1)}-${pad(d)}`
      classes.push('other-month')
    } else if (dayNum <= daysInMonth) {
      label = String(dayNum)
      dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`
      dayNum++
    } else {
      label = String(nextMonthDay)
      const nextM = month + 2
      const nextY = nextM > 12 ? year + 1 : year
      const nextMn = nextM > 12 ? 1 : nextM
      dateStr = `${nextY}-${pad(nextMn)}-${pad(nextMonthDay)}`
      nextMonthDay++
      classes.push('other-month')
    }

    const d = new Date(dateStr)
    const inRange = isInRange(dateStr)
    const isFrom = dateStr === dateKey(tempFrom.value)
    const isTo = dateStr === dateKey(tempTo.value)
    const selected = isFrom || isTo

    if (inRange) classes.push('in-range')
    if (selected) classes.push('selected')
    if (isFrom) classes.push('range-start')
    if (isTo) classes.push('range-end')

    cells.push({
      key: `${year}-${month}-${i}`,
      label,
      date: dateStr,
      classes: classes.join(' ')
    })
  }

  return cells
})

function pad(n) {
  return String(n).padStart(2, '0')
}

/** Calendar cells use YYYY-MM-DD; model values may be ISO strings — normalize for class matching. */
function dateKey(value) {
  if (!value) return ''
  const s = String(value).trim()
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s)
  return m ? m[1] : s
}

function isInRange(dateStr) {
  if (!tempFrom.value || !tempTo.value) return false
  const d = dateStr
  const from = dateKey(tempFrom.value)
  const to = dateKey(tempTo.value)
  return d >= from && d <= to
}

function navYear(delta) {
  viewYear.value += delta
}

function navMonth(delta) {
  viewMonth.value += delta
  if (viewMonth.value > 11) {
    viewMonth.value = 0
    viewYear.value++
  } else if (viewMonth.value < 0) {
    viewMonth.value = 11
    viewYear.value--
  }
}

function onDayClick(cell) {
  const dateStr = cell.date
  if (!tempFrom.value || (tempFrom.value && tempTo.value)) {
    tempFrom.value = dateStr
    tempTo.value = ''
  } else {
    const fromKey = dateKey(tempFrom.value)
    if (dateStr < fromKey) {
      tempTo.value = fromKey
      tempFrom.value = dateStr
    } else {
      tempTo.value = dateStr
    }
  }
}

function setToday() {
  const d = new Date()
  const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  tempFrom.value = s
  tempTo.value = s
}

function setYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  tempFrom.value = s
  tempTo.value = s
}

function onConfirm() {
  const from = dateKey(tempFrom.value)
  const toRaw = tempTo.value ? dateKey(tempTo.value) : from
  const to = from && toRaw ? (toRaw >= from ? toRaw : from) : ''
  const result = { from, to }
  emit('update:modelValue', result)
  emit('select', result)
  emit('close')
}

function onCancel() {
  emit('close')
}

function onClear() {
  tempFrom.value = ''
  tempTo.value = ''
  emit('update:modelValue', { from: '', to: '' })
  emit('select', { from: '', to: '' })
  emit('clear')
  emit('close')
}
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
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 20px;
  max-width: 340px;
  width: 100%;
}

.picker-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 16px;
}

.header-year {
  font-size: 13px;
  font-weight: 500;
  color: #FF8D28;
}

.header-date {
  font-size: 20px;
  font-weight: 700;
  color: #FF8D28;
}

.picker-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.nav-btn {
  background: none;
  border: none;
  padding: 6px 10px;
  font-size: 16px;
  color: #1A1A2E;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn:hover {
  color: #FF8D28;
}

.nav-label {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  min-width: 140px;
  text-align: center;
}

.picker-calendar {
  margin-bottom: 16px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6E6A7C;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
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
  color: #1A1A2E;
  cursor: pointer;
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
}

.day-cell:disabled {
  cursor: default;
}

.day-cell.other-month {
  color: #B0B0B0;
}

.day-cell.selected,
.day-cell.range-start,
.day-cell.range-end {
  background: #FF8D28;
  color: #fff !important;
}

.day-cell.in-range:not(.selected):not(.range-start):not(.range-end) {
  background: rgba(255, 141, 40, 0.2);
}

.day-cell:not(.other-month):not(.range-start):not(.range-end):not(.selected):hover {
  background: rgba(255, 141, 40, 0.15);
}

.picker-quick {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.quick-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid #FF8D28;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  color: #FF8D28;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.quick-btn:hover {
  background: rgba(255, 141, 40, 0.08);
}

.picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.clear-btn {
  margin-right: auto;
  color: #6e6a7c;
}

.action-btn {
  background: none;
  border: none;
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #FF8D28;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.action-btn:hover {
  opacity: 0.85;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
