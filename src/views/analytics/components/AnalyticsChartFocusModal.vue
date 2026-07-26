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
      <ion-toolbar v-if="optionsLabel || subtitle" class="chart-focus-modal__subtitle-bar">
        <div class="chart-focus-modal__subtitle-row">
          <button
            v-if="optionsLabel"
            type="button"
            class="chart-focus-modal__options-chip"
            :aria-label="optionsAriaLabel"
            @click="emit('options-click')"
          >
            <span>{{ optionsLabel }}</span>
            <ion-icon :icon="chevronDown" class="chart-focus-modal__options-icon" />
          </button>
          <ion-title v-else size="small">{{ subtitle }}</ion-title>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content class="chart-focus-modal__content">
      <p class="chart-focus-modal__hint">{{ hintText }}</p>
      <div class="chart-focus-modal__chart-wrap">
        <VChart
          ref="chartRef"
          class="chart-focus-modal__chart"
          :option="expandedOption"
          autoresize
          @click="onChartClick"
          @dblclick="onChartDblClick"
        />
      </div>
      <div v-if="selectedSlice" class="chart-focus-modal__detail">
        <p class="chart-focus-modal__detail-name">{{ selectedSlice.name }}</p>
        <p class="chart-focus-modal__detail-value">
          {{ selectedSlice.amount }} · {{ selectedSlice.percent }}%
        </p>
        <button
          v-if="onDrill"
          type="button"
          class="chart-focus-modal__drill-btn"
          @click="onViewTransactions"
        >
          View transactions
        </button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { computed, toRef, watch } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
} from '@ionic/vue'
import { chevronDown } from 'ionicons/icons'
import { expandChartOption } from '@/views/analytics/chartOptions'
import { useAnalyticsChartHandlers } from '@/views/analytics/useAnalyticsChartHandlers'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  option: { type: Object, default: () => ({}) },
  optionsLabel: { type: String, default: '' },
  optionsAriaLabel: { type: String, default: 'Chart options' },
  onDrill: { type: Function, default: null },
})

const emit = defineEmits(['close', 'options-click'])

function handleDrill(params) {
  if (!props.onDrill) return
  emit('close')
  props.onDrill(params)
}

const optionRef = toRef(props, 'option')
const {
  chartRef,
  selectedIndex,
  isPie,
  isTreemap,
  resetInteraction,
  onChartClick,
  onChartDblClick,
} = useAnalyticsChartHandlers(optionRef, {
  onDrill: handleDrill,
})

const hintText = computed(() => {
  if (isPie.value) return 'Tap a segment to focus · Tap again to clear'
  if (isTreemap.value) return 'Tap a category to zoom in · Double-tap to zoom out'
  return 'Pinch or scroll to zoom · Drag to pan'
})

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
    if (!open) resetInteraction()
  }
)

function onDismiss() {
  resetInteraction()
  emit('close')
}

function onViewTransactions() {
  if (selectedIndex.value == null || !props.onDrill) return
  handleDrill({
    seriesType: 'pie',
    dataIndex: selectedIndex.value,
    componentType: 'series',
    name: selectedSlice.value?.name,
  })
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

.chart-focus-modal__subtitle-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 12px;
  box-sizing: border-box;
}

.chart-focus-modal__subtitle-bar ion-title {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.55);
}

.chart-focus-modal__options-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 5px 6px 5px 10px;
  background: #fff;
  border: 1px solid rgba(168, 168, 168, 0.35);
  border-radius: 6px;
  font-size: 12px;
  line-height: 1;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  white-space: nowrap;
}

.chart-focus-modal__options-icon {
  width: 16px;
  height: 16px;
  color: #a8a8a8;
  flex-shrink: 0;
}

.chart-focus-modal__content {
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

.chart-focus-modal__drill-btn {
  margin-top: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #ff8d28;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
</style>
