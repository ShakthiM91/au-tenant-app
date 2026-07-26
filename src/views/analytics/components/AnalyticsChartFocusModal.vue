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
          :class="{ 'chart-focus-modal__chart--radar': isRadar }"
          :option="expandedOption"
          autoresize
          @click="onChartClick"
          @dblclick="onChartDblClick"
        />
      </div>
      <div v-if="selectedSlice || selectedSankey || selectedRadarDetail" class="chart-focus-modal__detail">
        <p class="chart-focus-modal__detail-name">
          {{ selectedSlice?.name || selectedSankey?.name || selectedRadarDetail?.name }}
        </p>
        <p class="chart-focus-modal__detail-value">
          <template v-if="selectedSlice">
            {{ selectedSlice.amount }} · {{ selectedSlice.percent }}%
          </template>
          <template v-else-if="selectedSankey">
            {{ selectedSankey.amount }}
          </template>
          <template v-else-if="selectedRadarDetail">
            <span class="chart-focus-modal__radar-row">
              <span class="chart-focus-modal__radar-label chart-focus-modal__radar-label--planned">Planned</span>
              {{ selectedRadarDetail.planned }}
            </span>
            <span class="chart-focus-modal__radar-row">
              <span class="chart-focus-modal__radar-label chart-focus-modal__radar-label--actual">Actual</span>
              {{ selectedRadarDetail.actual }}
            </span>
          </template>
        </p>
        <button
          v-if="onDrill && (selectedSlice || selectedSankey?.drillable || selectedRadarDetail)"
          type="button"
          class="chart-focus-modal__drill-btn"
          @click="onViewTransactions"
        >
          View transactions
        </button>
      </div>
      <section v-if="isRadar && radarListRows.length" class="chart-focus-modal__radar-list">
        <h3 class="chart-focus-modal__radar-list-title">Categories</h3>
        <button
          v-for="item in radarListRows"
          :key="item.category_id"
          type="button"
          class="chart-focus-modal__radar-row"
          @click="onRadarRowClick(item)"
        >
          <span class="chart-focus-modal__radar-row-name">{{ item.category_name }}</span>
          <span class="chart-focus-modal__radar-row-meta">
            <span>Planned {{ formatDetailAmount(item.budget) }}</span>
            <span>Actual {{ formatDetailAmount(item.actual) }}</span>
            <span :class="radarVarianceClass(item)">{{ radarVarianceLabel(item) }}</span>
          </span>
        </button>
      </section>
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
import { radarListItems } from '@/utils/radarChart'

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
  // Treemap uses tap-to-zoom in fullscreen; drill is not bound to single tap here.
  if (params?.seriesType === 'treemap') return
  if (params?.seriesType === 'sankey') return
  if (params?.seriesType === 'radar') return
  emit('close')
  props.onDrill(params)
}

const optionRef = toRef(props, 'option')
const {
  chartRef,
  selectedIndex,
  selectedSankey,
  selectedRadar,
  isPie,
  isTreemap,
  isSankey,
  isRadar,
  resetInteraction,
  onChartClick,
  onChartDblClick,
} = useAnalyticsChartHandlers(optionRef, {
  onDrill: handleDrill,
  sankeyDetailOnClick: true,
  radarDetailOnClick: true,
})

const hintText = computed(() => {
  if (isPie.value) return 'Tap a segment to focus · Tap again to clear'
  if (isTreemap.value) return 'Tap a category to zoom in · Double-tap to zoom out'
  if (isSankey.value) return 'Tap a node or flow for details'
  if (isRadar.value) return 'Tap a category to see planned and actual'
  return 'Pinch or scroll to zoom · Drag to pan'
})

const expandedOption = computed(() =>
  expandChartOption(props.option, { selectedIndex: selectedIndex.value })
)

const radarListRows = computed(() => {
  if (!isRadar.value) return []
  return radarListItems(props.option?.__radarItems)
})

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

function formatDetailAmount(value) {
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(value) || 0)
  } catch {
    return String(Math.round((Number(value) || 0) * 100) / 100)
  }
}

const selectedRadarDetail = computed(() => {
  if (!selectedRadar.value) return null
  const { name, budget, actual } = selectedRadar.value
  return {
    name,
    planned: formatDetailAmount(budget),
    actual: formatDetailAmount(actual),
  }
})

function radarVarianceClass(item) {
  const variance = (Number(item?.budget) || 0) - (Number(item?.actual) || 0)
  return variance < 0 ? 'chart-focus-modal__radar-diff--over' : 'chart-focus-modal__radar-diff--ok'
}

function radarVarianceLabel(item) {
  const budget = Number(item?.budget) || 0
  const actual = Number(item?.actual) || 0
  const diff = budget - actual
  if (diff >= 0) return `${formatDetailAmount(diff)} left`
  return `${formatDetailAmount(-diff)} over`
}

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

function onRadarRowClick(item) {
  if (!props.onDrill || !item?.category_name) return
  emit('close')
  props.onDrill({
    seriesType: 'radar',
    name: item.category_name,
    componentType: 'series',
  })
}

function onViewTransactions() {
  if (!props.onDrill) return
  if (selectedRadarDetail.value) {
    emit('close')
    props.onDrill({
      seriesType: 'radar',
      name: selectedRadarDetail.value.name,
      componentType: 'series',
    })
    return
  }
  if (selectedSlice.value) {
    handleDrill({
      seriesType: 'pie',
      dataIndex: selectedIndex.value,
      componentType: 'series',
      name: selectedSlice.value?.name,
    })
    return
  }
  const drill = selectedSankey.value?.drill
  if (!drill) return
  emit('close')
  props.onDrill({
    seriesType: 'sankey',
    dataType: 'node',
    data: {
      drillable: true,
      categoryId: drill.categoryId,
      categoryName: drill.categoryName,
      txnType: drill.txnType,
      name: drill.categoryName,
    },
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

.chart-focus-modal__chart--radar {
  height: min(42vh, 380px);
  min-height: 260px;
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

.chart-focus-modal__radar-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

.chart-focus-modal__radar-row:first-child {
  margin-top: 0;
}

.chart-focus-modal__radar-label {
  min-width: 52px;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
}

.chart-focus-modal__radar-label--planned {
  color: #26a69a;
}

.chart-focus-modal__radar-label--actual {
  color: #1976d2;
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

.chart-focus-modal__radar-list {
  margin: 0 16px 24px;
}

.chart-focus-modal__radar-list-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.82);
}

.chart-focus-modal__radar-row {
  display: block;
  width: 100%;
  margin-bottom: 8px;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  text-align: left;
  cursor: pointer;
}

.chart-focus-modal__radar-row-name {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.82);
}

.chart-focus-modal__radar-row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.chart-focus-modal__radar-diff--ok {
  color: #2e7d32;
}

.chart-focus-modal__radar-diff--over {
  color: #d64550;
}
</style>
