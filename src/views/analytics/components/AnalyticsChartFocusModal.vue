<template>
  <ion-modal
    mode="ios"
    class="chart-focus-modal"
    :is-open="open"
    @didDismiss="onDismiss"
  >
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="onDismiss">Close</ion-button>
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
      <ion-toolbar v-if="subtitle" class="chart-focus-modal__subtitle-bar">
        <ion-title size="small">{{ subtitle }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="chart-focus-modal__content">
      <p class="chart-focus-modal__hint">{{ hintText }}</p>
      <div class="chart-focus-modal__chart-wrap">
        <VChart
          class="chart-focus-modal__chart"
          :option="expandedOption"
          autoresize
          @click="onChartClick"
        />
      </div>
      <div v-if="selectedSlice" class="chart-focus-modal__detail">
        <p class="chart-focus-modal__detail-name">{{ selectedSlice.name }}</p>
        <p class="chart-focus-modal__detail-value">
          {{ selectedSlice.amount }} · {{ selectedSlice.percent }}%
        </p>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
} from '@ionic/vue'
import { expandChartOption, isPieChartOption } from '@/views/analytics/chartOptions'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  option: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close'])

const selectedIndex = ref(null)

const isPie = computed(() => isPieChartOption(props.option))

const hintText = computed(() =>
  isPie.value
    ? 'Tap a segment to focus · Tap again to clear'
    : 'Pinch or scroll to zoom · Drag to pan'
)

const expandedOption = computed(() =>
  expandChartOption(props.option, { selectedIndex: selectedIndex.value })
)

const selectedSlice = computed(() => {
  if (selectedIndex.value == null || !isPie.value) return null
  const expanded = expandedOption.value
  const pieSeries = (Array.isArray(expanded.series) ? expanded.series : [expanded.series]).find(
    (s) => s?.type === 'pie'
  )
  const item = pieSeries?.data?.[selectedIndex.value]
  if (!item || item.name === 'No data') return null
  const total =
    Number(expanded.__donutTotal) ||
    (pieSeries?.data || []).reduce((s, d) => s + (Number(d.value) || 0), 0)
  const value = Number(item.value) || 0
  const pct = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00'
  let amount
  try {
    amount = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
  } catch {
    amount = String(Math.round(value * 100) / 100)
  }
  return { name: item.name, amount, percent: pct }
})

watch(
  () => props.open,
  (open) => {
    if (!open) selectedIndex.value = null
  }
)

function onDismiss() {
  selectedIndex.value = null
  emit('close')
}

function onChartClick(params) {
  if (!isPie.value || params?.componentType !== 'series' || params?.seriesType !== 'pie') return
  if (params?.data?.name === 'No data') return
  const idx = params.dataIndex
  selectedIndex.value = selectedIndex.value === idx ? null : idx
}
</script>

<style scoped>
.chart-focus-modal {
  --width: 100%;
  --height: 100%;
}

.chart-focus-modal__subtitle-bar {
  --min-height: 36px;
}

.chart-focus-modal__subtitle-bar ion-title {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.55);
}

.chart-focus-modal__content {
  --background: #f8f8fa;
}

.chart-focus-modal__hint {
  margin: 10px 16px 0;
  font-size: 11px;
  line-height: 1.35;
  color: rgba(0, 0, 0, 0.45);
  text-align: center;
}

.chart-focus-modal__chart-wrap {
  padding: 8px 10px 12px;
  min-height: calc(100% - 48px);
  box-sizing: border-box;
}

.chart-focus-modal__chart {
  width: 100%;
  height: min(72vh, 640px);
  min-height: 320px;
}

.chart-focus-modal__detail {
  margin: 0 16px 24px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.chart-focus-modal__detail-name {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.82);
}

.chart-focus-modal__detail-value {
  margin: 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
}
</style>
