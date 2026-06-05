<template>
  <div class="date-picker" :class="{ 'date-picker--disabled': disabled }">
    <div class="picker-labels">
      <span>Year</span>
      <span>Month</span>
      <span>Day</span>
    </div>

    <div class="picker-body">
      <!-- Selection highlight bar -->
      <div class="picker-highlight" />
      <!-- Fade mask top -->
      <div class="picker-fade picker-fade--top" />
      <!-- Fade mask bottom -->
      <div class="picker-fade picker-fade--bottom" />

      <!-- Year column -->
      <div
        ref="yearColRef"
        class="picker-col"
        @scroll.passive="onYearScroll"
      >
        <div class="picker-spacer" />
        <div
          v-for="y in yearOptions"
          :key="y"
          class="picker-item"
        >{{ y }}</div>
        <div class="picker-spacer" />
      </div>

      <!-- Month column -->
      <div
        ref="monthColRef"
        class="picker-col"
        @scroll.passive="onMonthScroll"
      >
        <div class="picker-spacer" />
        <div
          v-for="m in monthOptions"
          :key="m.value"
          class="picker-item"
        >{{ m.label }}</div>
        <div class="picker-spacer" />
      </div>

      <!-- Day column -->
      <div
        ref="dayColRef"
        class="picker-col"
        @scroll.passive="onDayScroll"
      >
        <div class="picker-spacer" />
        <div
          v-for="d in dayOptions"
          :key="d"
          class="picker-item"
        >{{ d }}</div>
        <div class="picker-spacer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

// ── Constants ──────────────────────────────────────────────────────────────
const ITEM_H = 44       // px — height of each row
const VISIBLE = 5       // rows visible; centre row is selected

// ── Refs ───────────────────────────────────────────────────────────────────
const yearColRef  = ref(null)
const monthColRef = ref(null)
const dayColRef   = ref(null)

const yearIdx  = ref(0)
const monthIdx = ref(0)
const dayIdx   = ref(0)

// ── Options ────────────────────────────────────────────────────────────────
const currentYear = new Date().getFullYear()

const yearOptions = computed(() => {
  const out = []
  for (let y = currentYear; y >= 1900; y--) out.push(y)
  return out
})

const monthOptions = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
]

const dayOptions = computed(() => {
  const y = yearOptions.value[yearIdx.value] ?? currentYear
  const m = monthIdx.value + 1
  const count = new Date(y, m, 0).getDate()
  return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0'))
})

// ── Derived ISO value ──────────────────────────────────────────────────────
const isoValue = computed(() => {
  const y = yearOptions.value[yearIdx.value]
  const m = monthOptions[monthIdx.value]?.value
  const d = dayOptions.value[dayIdx.value]
  if (!y || !m || !d) return ''
  return `${y}-${m}-${d}`
})

// ── Scroll helpers ─────────────────────────────────────────────────────────
function scrollTo(colRef, index, smooth = false) {
  if (!colRef) return
  colRef.scrollTo({ top: index * ITEM_H, behavior: smooth ? 'smooth' : 'instant' })
}

let yearTimer  = null
let monthTimer = null
let dayTimer   = null

function afterScroll(colRef, getOptions, idxRef, timer, extraCallback) {
  clearTimeout(timer)
  return setTimeout(() => {
    if (!colRef) return
    const raw   = colRef.scrollTop / ITEM_H
    const index = Math.min(Math.round(raw), getOptions().length - 1)
    // Snap to nearest if browser didn't fully snap
    if (Math.abs(colRef.scrollTop - index * ITEM_H) > 1) {
      scrollTo(colRef, index, true)
    }
    idxRef.value = index
    extraCallback?.()
    emit('update:modelValue', isoValue.value)
  }, 80)
}

function onYearScroll()  { yearTimer  = afterScroll(yearColRef.value,  () => yearOptions.value,          yearIdx,  yearTimer,  clampDay) }
function onMonthScroll() { monthTimer = afterScroll(monthColRef.value, () => monthOptions,               monthIdx, monthTimer, clampDay) }
function onDayScroll()   { dayTimer   = afterScroll(dayColRef.value,   () => dayOptions.value,           dayIdx,   dayTimer,   null) }

function clampDay() {
  const max = dayOptions.value.length - 1
  if (dayIdx.value > max) {
    dayIdx.value = max
    nextTick(() => scrollTo(dayColRef.value, max, true))
  }
}

// ── Sync from modelValue ───────────────────────────────────────────────────
function syncFromIso(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return

  const y = Number(match[1])
  const m = Number(match[2]) - 1   // 0-based index
  const d = Number(match[3]) - 1   // 0-based index

  const yi = yearOptions.value.findIndex((yr) => yr === y)
  yearIdx.value  = yi >= 0 ? yi : 0
  monthIdx.value = m >= 0 && m < 12 ? m : 0

  nextTick(() => {
    const di = Math.min(d, dayOptions.value.length - 1)
    dayIdx.value = di >= 0 ? di : 0
    scrollTo(yearColRef.value,  yearIdx.value,  false)
    scrollTo(monthColRef.value, monthIdx.value, false)
    scrollTo(dayColRef.value,   dayIdx.value,   false)
  })
}

// Default to 25 years ago so the wheel starts in a useful place
function initDefault() {
  const defaultYear = currentYear - 25
  yearIdx.value  = yearOptions.value.findIndex((y) => y === defaultYear) ?? 0
  monthIdx.value = 0
  dayIdx.value   = 0
  nextTick(() => {
    scrollTo(yearColRef.value,  yearIdx.value,  false)
    scrollTo(monthColRef.value, monthIdx.value, false)
    scrollTo(dayColRef.value,   dayIdx.value,   false)
  })
}

onMounted(() => {
  if (props.modelValue) {
    syncFromIso(props.modelValue)
  } else {
    initDefault()
  }
})

watch(() => props.modelValue, (val) => {
  if (val && val !== isoValue.value) syncFromIso(val)
})
</script>

<style scoped>
.date-picker {
  width: 100%;
  user-select: none;
  -webkit-user-select: none;
}

.date-picker--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* ── Column labels ── */
.picker-labels {
  display: flex;
  justify-content: space-around;
  padding: 0 4px 8px;
  font-size: 13px;
  font-weight: 600;
  color: #ff8d28;
  letter-spacing: 0.04em;
}

/* ── Main body ── */
.picker-body {
  position: relative;
  display: flex;
  height: calc(44px * 5); /* VISIBLE rows */
  border: 1.5px solid rgba(255, 141, 40, 0.7);
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 20px rgba(255, 141, 40, 0.1);
}

/* ── Centre selection highlight ── */
.picker-highlight {
  position: absolute;
  inset-inline: 8px;
  top: calc(44px * 2);
  height: 44px;
  background: rgba(255, 141, 40, 0.1);
  border-top: 1.5px solid rgba(255, 141, 40, 0.5);
  border-bottom: 1.5px solid rgba(255, 141, 40, 0.5);
  border-radius: 8px;
  pointer-events: none;
  z-index: 2;
}

/* ── Top / bottom fades ── */
.picker-fade {
  position: absolute;
  inset-inline: 0;
  height: calc(44px * 2);
  pointer-events: none;
  z-index: 3;
}
.picker-fade--top {
  top: 0;
  background: linear-gradient(to bottom, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 100%);
}
.picker-fade--bottom {
  bottom: 0;
  background: linear-gradient(to top, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 100%);
}

/* ── Individual columns ── */
.picker-col {
  flex: 1;
  height: 100%;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  overscroll-behavior: contain;
}
.picker-col::-webkit-scrollbar { display: none; }

/* Separator lines between columns */
.picker-col + .picker-col {
  border-left: 1px solid rgba(255, 141, 40, 0.15);
}

/* ── Spacer pads top/bottom so first/last items can be centred ── */
.picker-spacer {
  height: calc(44px * 2);
  scroll-snap-align: none;
  flex-shrink: 0;
}

/* ── Each row ── */
.picker-item {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  font-size: 17px;
  font-weight: 500;
  color: #3d3a45;
  flex-shrink: 0;
}
</style>
