<template>
  <ion-modal
    ref="modalRef"
    :is-open="visible"
    @didDismiss="onCancel"
    :initial-breakpoint="initialBreakpoint"
    :breakpoints="breakpoints"
    :handle="true"
  >
    <ion-header class="drawer-ion-header">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="onCancel">Cancel</ion-button>
            </ion-buttons>
            <ion-title>Select time</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="onConfirm">OK</ion-button>
            </ion-buttons>
          </ion-toolbar>
    </ion-header>

    <ion-content class="time-picker-modal-content">
          <div class="adaptive-sheet-body">
          <div class="picker-sheet-content">
            <!-- Time display -->
            <div class="time-display">
              <span
                class="time-part"
                :class="{ active: mode === 'hour' }"
                @click="mode = 'hour'"
              >{{ pad(tempHour) }}</span>
              <span class="time-sep">:</span>
              <span
                class="time-part"
                :class="{ active: mode === 'minute' }"
                @click="mode = 'minute'"
              >{{ pad(tempMinute) }}</span>
            </div>

            <!-- Analog clock face -->
            <div class="clock-wrap">
              <svg
                class="clock-svg"
                viewBox="0 0 260 260"
                @pointerdown="onClockPointerDown"
                @pointermove="onClockPointerMove"
                @pointerup="onClockPointerUp"
                @pointercancel="onClockPointerUp"
              >
              <!-- Clock face -->
              <circle cx="130" cy="130" r="120" fill="#f5f5f7" />

              <!-- Center dot -->
              <circle cx="130" cy="130" r="4" fill="#ff8d28" />

              <!-- Selection line -->
              <line
                x1="130"
                y1="130"
                :x2="selectedX"
                :y2="selectedY"
                stroke="#ff8d28"
                stroke-width="2"
                stroke-linecap="round"
              />

              <!-- Selected circle -->
              <circle :cx="selectedX" :cy="selectedY" r="18" fill="#ff8d28" />

              <!-- Hour numbers (outer ring: 1–12) -->
              <template v-if="mode === 'hour'">
                <template v-for="i in 12" :key="'outer-' + i">
                  <text
                    :x="outerX(i)"
                    :y="outerY(i)"
                    text-anchor="middle"
                    dominant-baseline="central"
                    :fill="tempHour % 12 === i % 12 && (tempHour < 13 || i === 12) ? '#fff' : '#1a1a2e'"
                    font-size="14"
                    font-weight="500"
                    style="pointer-events:none"
                  >{{ i }}</text>
                </template>
                <!-- Inner ring: 13–23 + 0 -->
                <template v-for="i in 12" :key="'inner-' + i">
                  <text
                    :x="innerX(i)"
                    :y="innerY(i)"
                    text-anchor="middle"
                    dominant-baseline="central"
                    :fill="innerHourValue(i) === tempHour && tempHour >= 13 ? '#fff' : '#a8a8a8'"
                    font-size="12"
                    font-weight="400"
                    style="pointer-events:none"
                  >{{ innerHourValue(i) === 0 ? '00' : innerHourValue(i) }}</text>
                </template>
              </template>

              <!-- Minute marks (0, 5, 10 ... 55) -->
              <template v-if="mode === 'minute'">
                <template v-for="i in 12" :key="'min-' + i">
                  <text
                    :x="outerX(i)"
                    :y="outerY(i)"
                    text-anchor="middle"
                    dominant-baseline="central"
                    :fill="minuteLabel(i) === tempMinute ? '#fff' : '#1a1a2e'"
                    font-size="14"
                    font-weight="500"
                    style="pointer-events:none"
                  >{{ pad(minuteLabel(i)) }}</text>
                </template>
              </template>
            </svg>
            </div>

            <!-- Quick shortcuts -->
            <div class="picker-quick">
              <button type="button" class="quick-btn" @click="setNow">Now</button>
              <button type="button" class="quick-btn" @click="setMinutesAgo(5)">5 mins ago</button>
              <button type="button" class="quick-btn" @click="setMinutesAgo(60)">An Hour ago</button>
            </div>
          </div>
          </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IonModal, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/vue'
import { useIonSheetHeight } from '@/composables/useIonSheetHeight'

const props = defineProps({
  visible: { type: Boolean, default: false },
  modelValue: { type: String, default: '' } // "HH:mm"
})

const emit = defineEmits(['update:modelValue', 'close', 'select'])

const SHEET_HEIGHT_PCT = 62

const { modalRef, breakpoints, initialBreakpoint } = useIonSheetHeight(
  () => props.visible,
  SHEET_HEIGHT_PCT
)

const mode = ref('hour') // 'hour' | 'minute'
const tempHour = ref(new Date().getHours())
const tempMinute = ref(new Date().getMinutes())

watch(() => props.visible, (v) => {
  if (v) {
    mode.value = 'hour'
    const val = props.modelValue || ''
    if (val && val.match(/^\d{1,2}:\d{2}$/)) {
      const [h, m] = val.split(':').map(Number)
      tempHour.value = h
      tempMinute.value = m
    } else {
      const now = new Date()
      tempHour.value = now.getHours()
      tempMinute.value = now.getMinutes()
    }
  }
})

const CX = 130
const CY = 130
const OUTER_R = 100
const INNER_R = 65

function angleFor(i, total = 12) {
  // i from 1–12, clockwise, 12 at top
  return ((i / total) * 2 * Math.PI) - Math.PI / 2
}

function outerX(i) { return CX + OUTER_R * Math.cos(angleFor(i)) }
function outerY(i) { return CY + OUTER_R * Math.sin(angleFor(i)) }
function innerX(i) { return CX + INNER_R * Math.cos(angleFor(i)) }
function innerY(i) { return CY + INNER_R * Math.sin(angleFor(i)) }
function innerHourValue(i) { return i === 12 ? 0 : i + 12 }
function minuteLabel(i) { return (i % 12) * 5 }

// Which clock position is selected
const selectedClockPos = computed(() => {
  if (mode.value === 'hour') {
    const h = tempHour.value
    // Outer ring: 1–12 (h=0 → pos 12)
    if (h === 0 || (h >= 13 && h <= 23)) {
      // inner ring
      const pos = h === 0 ? 12 : h - 12
      return { x: innerX(pos), y: innerY(pos) }
    } else {
      const pos = h === 12 ? 12 : h
      return { x: outerX(pos), y: outerY(pos) }
    }
  } else {
    const m = tempMinute.value
    const theta = (m / 60) * 2 * Math.PI - Math.PI / 2
    return {
      x: CX + OUTER_R * Math.cos(theta),
      y: CY + OUTER_R * Math.sin(theta)
    }
  }
})

const selectedX = computed(() => selectedClockPos.value.x)
const selectedY = computed(() => selectedClockPos.value.y)

function setMinuteFromSvgPoint(svgX, svgY) {
  const dx = svgX - CX
  const dy = svgY - CY
  let angle = Math.atan2(dy, dx) + Math.PI / 2
  if (angle < 0) angle += 2 * Math.PI
  let m = Math.round((angle / (2 * Math.PI)) * 60)
  if (m === 60) m = 0
  tempMinute.value = m
}

function getClockValue(svgX, svgY) {
  const dx = svgX - CX
  const dy = svgY - CY
  const dist = Math.sqrt(dx * dx + dy * dy)
  let angle = Math.atan2(dy, dx) + Math.PI / 2
  if (angle < 0) angle += 2 * Math.PI
  const unit = Math.round(angle / (Math.PI / 6)) % 12 || 12 // 1–12

  if (mode.value === 'hour') {
    const isInner = dist < (OUTER_R + INNER_R) / 2
    if (isInner) {
      tempHour.value = innerHourValue(unit)
    } else {
      tempHour.value = unit === 12 ? 12 : unit
    }
    // Auto-advance to minute selection after picking hour
    setTimeout(() => { mode.value = 'minute' }, 200)
  } else {
    setMinuteFromSvgPoint(svgX, svgY)
  }
}

function getSvgCoords(el, clientX, clientY) {
  const rect = el.getBoundingClientRect()
  const scaleX = 260 / rect.width
  const scaleY = 260 / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  }
}

function onClockPointerDown(e) {
  if (e.button != null && e.button !== 0) return
  const el = e.currentTarget
  const { x, y } = getSvgCoords(el, e.clientX, e.clientY)
  if (mode.value === 'minute') {
    el.setPointerCapture(e.pointerId)
    setMinuteFromSvgPoint(x, y)
  } else {
    getClockValue(x, y)
  }
}

function onClockPointerMove(e) {
  if (mode.value !== 'minute') return
  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
  const { x, y } = getSvgCoords(e.currentTarget, e.clientX, e.clientY)
  setMinuteFromSvgPoint(x, y)
}

function onClockPointerUp(e) {
  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
}

function setNow() {
  const now = new Date()
  tempHour.value = now.getHours()
  tempMinute.value = now.getMinutes()
}

function setMinutesAgo(mins) {
  const d = new Date(Date.now() - mins * 60 * 1000)
  tempHour.value = d.getHours()
  tempMinute.value = d.getMinutes()
}

function pad(n) { return String(n).padStart(2, '0') }

function onConfirm() {
  const val = `${pad(tempHour.value)}:${pad(tempMinute.value)}`
  emit('update:modelValue', val)
  emit('select', val)
  emit('close')
}

function onCancel() { emit('close') }
</script>

<style scoped>
.time-picker-modal-content {
  --background: #ffffff;
}

.adaptive-sheet-body {
  min-height: 0;
}

.drawer-ion-header {
  flex-shrink: 0;
}

.picker-sheet-content {
  padding: 0 20px 20px;
}

.time-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
  margin-bottom: 20px;
}

.time-part {
  font-size: 56px;
  font-weight: 300;
  color: #a8a8a8;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s;
  min-width: 70px;
  text-align: center;
  border-radius: 8px;
  padding: 4px 8px;
}

.time-part.active { color: #ff8d28; }

.time-sep {
  font-size: 48px;
  font-weight: 300;
  color: #a8a8a8;
  line-height: 1;
  margin-bottom: 4px;
}

.clock-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.clock-svg {
  width: 100%;
  max-width: 260px;
  cursor: pointer;
  touch-action: none;
  user-select: none;
}

.picker-quick {
  display: flex;
  gap: 8px;
  margin-bottom: 0;
}

.quick-btn {
  flex: 1;
  padding: 9px 6px;
  border: 1.5px solid #ff8d28;
  border-radius: 20px;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #ff8d28;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}

</style>
