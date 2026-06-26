<template>
  <article class="detail-card">
    <div class="detail-card__header">
      <div class="detail-card__title-block">
        <h3 class="detail-card__title">{{ item.category_name }}</h3>
        <p v-if="entryCount != null" class="detail-card__subtitle">{{ periodTypeLabel }} entries {{ entryCount }}</p>
      </div>
      <div class="detail-card__this-month">
        <span class="detail-card__metric-label">{{ periodLabel }}</span>
        <span class="detail-card__metric-value">
          <span class="amount-spent">{{ formatAmount(item.actual) }}</span>
          <span class="amount-sep"> / </span>
          <span class="amount-total">{{ formatAmount(item.budget) }}</span>
        </span>
      </div>
      <div class="detail-card__planned">
        <span class="detail-card__metric-label">Total Planned</span>
        <span class="detail-card__planned-value">{{ formatAmount(item.budget) }}</span>
      </div>
      <button type="button" class="detail-card__menu" aria-label="Category options" @click="$emit('menu', $event)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#A8A8A8">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
    </div>

    <div v-if="hasBudget" class="progress-track progress-track--main">
      <div
        class="progress-fill"
        :class="barToneClass(usagePct)"
        :style="{ width: `${Math.min(usagePct, 100)}%` }"
      />
    </div>

    <div class="detail-card__body">
      <div class="detail-stats__col">
        <div class="stat-row">
          <span class="stat-label">This Year so far</span>
          <span class="stat-value">{{ formatAmount(stats.ytd) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Last month</span>
          <span class="stat-value">{{ formatAmount(stats.lastMonth) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Monthly Average</span>
          <span class="stat-value">{{ formatAmount(stats.monthlyAvg) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Monthly Projection</span>
          <span class="stat-value">{{ formatAmount(stats.projected) }}</span>
        </div>
      </div>
      <div class="detail-stats__col">
        <div class="stat-row">
          <span class="stat-label">Overall %</span>
          <span class="stat-value">{{ formatBudgetPct(stats.overallPct) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Remaining</span>
          <span class="stat-value">{{ formatAmount(stats.remaining) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Remaining %</span>
          <span class="stat-value">{{ formatBudgetPct(stats.remainingPct) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Change %</span>
          <span class="stat-value" :class="changePctClass">{{ formatSignedBudgetPct(stats.changePct) }}</span>
        </div>
      </div>
      <div v-if="donutOption" ref="donutRoot" class="detail-donut">
        <svg v-if="leaderPaths.length" class="detail-donut__lines" aria-hidden="true">
          <path
            v-for="line in leaderPaths"
            :key="line.key"
            :d="line.d"
            fill="none"
            stroke="#C8C8C8"
            stroke-width="0.75"
            stroke-dasharray="2 2"
          />
        </svg>
        <div class="detail-donut__side detail-donut__side--left">
          <div
            v-for="row in leftDonutLabels"
            :key="row.name"
            :ref="(el) => setLabelRef(el, row.index)"
            class="detail-donut__label detail-donut__label--left"
            :style="{ top: `${row.yPct}%` }"
          >
            <span class="detail-donut__label-name">
              <span
                v-for="(line, lineIndex) in splitDonutLabelLines(row.name)"
                :key="lineIndex"
                class="detail-donut__label-line"
              >{{ line }}</span>
            </span>
            <span class="detail-donut__label-pct" :style="{ color: row.color }">{{ row.pct }}%</span>
          </div>
        </div>
        <div class="detail-donut__pie">
          <VChart class="detail-donut__chart" :option="donutOption" autoresize @finished="updateLeaderLines" />
        </div>
        <div class="detail-donut__side detail-donut__side--right">
          <div
            v-for="row in rightDonutLabels"
            :key="row.name"
            :ref="(el) => setLabelRef(el, row.index)"
            class="detail-donut__label detail-donut__label--right"
            :style="{ top: `${row.yPct}%` }"
          >
            <span class="detail-donut__label-name">
              <span
                v-for="(line, lineIndex) in splitDonutLabelLines(row.name)"
                :key="lineIndex"
                class="detail-donut__label-line"
              >{{ line }}</span>
            </span>
            <span class="detail-donut__label-pct" :style="{ color: row.color }">{{ row.pct }}%</span>
          </div>
        </div>
      </div>
    </div>

    <button
      v-if="subItems.length"
      type="button"
      class="detail-card__expand"
      @click="$emit('toggle-expand')"
    >
      <span>{{ expanded ? 'Collapse Sub-categories' : 'Expand Sub-categories' }}</span>
      <svg
        class="detail-card__chevron"
        :class="{ 'detail-card__chevron--open': expanded }"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <div v-if="expanded && subItems.length" class="sub-list">
      <BudgetDetailSubCategoryCard
        v-for="s in subItems"
        :key="s.category_id"
        :item="s"
        :period-report="periodReport"
        :full-report="fullReport"
        :period-type="periodType"
        :entry-count="subEntryCount?.(s.category_id) ?? null"
        @menu="$emit('sub-menu', $event, s)"
      />
    </div>
  </article>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import VChart from 'vue-echarts'
import BudgetDetailSubCategoryCard from '@/views/budgets/components/BudgetDetailSubCategoryCard.vue'
import {
  formatBudgetAmount,
  formatBudgetPeriodType,
  currentPeriodSpendLabel,
  formatBudgetPct,
  formatSignedBudgetPct,
  buildDonutSlicesFromItem,
  buildCategoryDetailStats,
  buildBudgetDetailDonutOption,
  buildBudgetDetailDonutLabels,
  computeDonutSliceMidAngles,
  splitDonutLabelLines,
  barToneClass
} from '@/utils/budgetManagement'

const props = defineProps({
  item: { type: Object, required: true },
  periodReport: { type: Object, default: null },
  fullReport: { type: Object, default: null },
  periodType: { type: String, default: 'month' },
  entryCount: { type: Number, default: null },
  expanded: { type: Boolean, default: false },
  subEntryCount: { type: Function, default: null }
})

defineEmits(['toggle-expand', 'menu', 'sub-menu'])

const periodLabel = computed(() => currentPeriodSpendLabel(props.periodType))
const periodTypeLabel = computed(() => formatBudgetPeriodType(props.periodType))
const stats = computed(() => buildCategoryDetailStats(props.item, props.periodReport, props.fullReport))
const donutSlices = computed(() => buildDonutSlicesFromItem(props.item))
const subItems = computed(() => props.item?.sub_items || [])
const hasBudget = computed(() => (Number(props.item?.budget) || 0) > 0)
const usagePct = computed(() => {
  const b = Number(props.item?.budget) || 0
  if (b <= 0) return 0
  return ((Number(props.item?.actual) || 0) / b) * 100
})

const changePctClass = computed(() => {
  const n = Number(stats.value.changePct) || 0
  if (n > 0) return 'stat-value--over'
  if (n < 0) return 'stat-value--under'
  return ''
})

const donutOption = computed(() => buildBudgetDetailDonutOption(donutSlices.value))
const donutLabelRows = computed(() => buildBudgetDetailDonutLabels(donutSlices.value))

const positionedDonutLabels = computed(() => {
  const rows = donutLabelRows.value
  const angles = computeDonutSliceMidAngles(donutSlices.value)
  return rows.map((row, index) => {
    const angle = angles[index] ?? 0
    const rad = (angle * Math.PI) / 180
    const side = Math.cos(rad) >= 0 ? 'right' : 'left'
    const yPct = 50 - Math.sin(rad) * 44
    return { ...row, index, side, yPct, angle }
  })
})

const leftDonutLabels = computed(() => positionedDonutLabels.value.filter((row) => row.side === 'left'))
const rightDonutLabels = computed(() => positionedDonutLabels.value.filter((row) => row.side === 'right'))

const donutRoot = ref(null)
const labelEls = ref([])
const leaderPaths = ref([])
let resizeObserver = null

function setLabelRef(el, index) {
  if (el) labelEls.value[index] = el
}

function piePoint(cx, cy, radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy - radius * Math.sin(rad)
  }
}

function updateLeaderLines() {
  const root = donutRoot.value
  const pieEl = root?.querySelector('.detail-donut__pie')
  const rows = donutLabelRows.value
  if (!root || !pieEl || !rows.length) {
    leaderPaths.value = []
    return
  }

  const rootRect = root.getBoundingClientRect()
  const pieRect = pieEl.getBoundingClientRect()
  const cx = pieRect.left + pieRect.width / 2 - rootRect.left
  const cy = pieRect.top + pieRect.height / 2 - rootRect.top
  const outerR = pieRect.width * 0.36
  const kneeR = outerR + 5
  const midAngles = computeDonutSliceMidAngles(donutSlices.value)

  leaderPaths.value = rows
    .map((row, i) => {
      const labelEl = labelEls.value[i]
      const angle = midAngles[i]
      if (!labelEl || angle == null) return null

      const labelRect = labelEl.getBoundingClientRect()
      const isLeft = Math.cos((angle * Math.PI) / 180) < 0
      const labelX = isLeft
        ? labelRect.right - rootRect.left
        : labelRect.left - rootRect.left
      const labelY = labelRect.top + labelRect.height / 2 - rootRect.top
      const edge = piePoint(cx, cy, outerR, angle)
      const knee = piePoint(cx, cy, kneeR, angle)

      return {
        key: row.name,
        d: `M ${edge.x.toFixed(1)} ${edge.y.toFixed(1)} L ${knee.x.toFixed(1)} ${knee.y.toFixed(1)} L ${labelX.toFixed(1)} ${labelY.toFixed(1)}`
      }
    })
    .filter(Boolean)
}

onMounted(() => {
  nextTick(updateLeaderLines)
  if (typeof ResizeObserver !== 'undefined' && donutRoot.value) {
    resizeObserver = new ResizeObserver(() => updateLeaderLines())
    resizeObserver.observe(donutRoot.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(
  [positionedDonutLabels, donutSlices, () => props.item],
  () => {
    labelEls.value = []
    nextTick(updateLeaderLines)
  },
  { deep: true }
)

function formatAmount(val) {
  return formatBudgetAmount(val)
}
</script>

<style scoped>
.detail-card {
  background: #fff;
  border-radius: 13px;
  padding: 12px;
  margin-bottom: 14px;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.16);
}

.detail-card__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto 28px;
  column-gap: 8px;
  row-gap: 0;
  align-items: center;
  margin-bottom: 8px;
}

.detail-card__title-block {
  grid-column: 1;
  min-width: 0;
  padding-right: 4px;
}

.detail-card__title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  color: rgba(255, 141, 40, 0.95);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-card__subtitle {
  margin: 1px 0 0;
  font-size: 9px;
  line-height: 1.3;
  color: rgba(0, 0, 0, 0.45);
}

.detail-card__this-month {
  grid-column: 2;
}

.detail-card__planned {
  grid-column: 3;
}

.detail-card__this-month,
.detail-card__planned {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.detail-card__menu {
  grid-column: 4;
  grid-row: 1;
  justify-self: end;
  align-self: start;
  width: 32px;
  height: 32px;
  margin: -6px -8px 0 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  color: #a8a8a8;
  -webkit-tap-highlight-color: transparent;
}

.detail-card__menu:active {
  opacity: 0.75;
}

.detail-card__metric-label {
  font-size: 9px;
  font-weight: 400;
  line-height: 1.15;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
}

.detail-card__metric-value {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.detail-card__planned-value {
  font-size: 11px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
}

.amount-spent {
  color: #2d9d62;
  font-weight: 600;
}

.amount-sep,
.amount-total {
  color: rgba(0, 0, 0, 0.45);
  font-weight: 500;
}

.progress-track {
  position: relative;
  border-radius: 999px;
  background: rgba(168, 168, 168, 0.22);
  overflow: hidden;
}

.progress-track--main {
  height: 10px;
  margin-bottom: 10px;
}

.progress-track--sub {
  height: 8px;
  width: 100%;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.2s ease;
}

.progress-fill.tone-ok {
  background: #2d9d62;
}

.progress-fill.tone-warn {
  background: #e6c200;
}

.progress-fill.tone-danger {
  background: #d32f2f;
}

.detail-card__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.25fr);
  gap: 6px 8px;
  align-items: center;
  min-width: 0;
}

.detail-stats__col {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.stat-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.stat-label {
  font-size: 9px;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.45);
}

.stat-value {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  color: #1a1a2e;
  font-variant-numeric: tabular-nums;
}

.stat-value--over {
  color: #d32f2f;
}

.stat-value--under {
  color: #2d9d62;
}

.detail-donut {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  column-gap: 2px;
  min-width: 0;
  min-height: 58px;
}

.detail-donut__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  z-index: 0;
}

.detail-donut__side {
  position: relative;
  z-index: 1;
  align-self: stretch;
  min-height: 58px;
  min-width: 0;
}

.detail-donut__pie {
  position: relative;
  z-index: 1;
  grid-column: 2;
  width: 58px;
  height: 58px;
  flex-shrink: 0;
}

.detail-donut__chart {
  width: 100%;
  height: 100%;
  min-width: 58px;
  min-height: 58px;
}

.detail-donut__label {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  max-width: 100%;
  transform: translateY(-50%);
}

.detail-donut__label--left {
  right: 0;
  align-items: flex-end;
  text-align: right;
}

.detail-donut__label--right {
  left: 0;
  align-items: flex-start;
  text-align: left;
}

.detail-donut__label-name {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  max-width: 100%;
}

.detail-donut__label-line {
  font-size: 8px;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.55);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.detail-donut__label-pct {
  font-size: 9px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.detail-card__expand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 16px;
  padding: 12px 0 4px;
  border: none;
  border-top: 1px solid #f0f0f0;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.5);
  letter-spacing: 0.01em;
  cursor: pointer;
}

.detail-card__chevron {
  flex-shrink: 0;
  margin-top: 1px;
  transition: transform 0.2s ease;
}

.detail-card__chevron--open {
  transform: rotate(180deg);
}

.sub-list {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 639px) {
  .detail-card {
    padding: 12px;
  }

  .detail-card__header {
    column-gap: 8px;
    margin-bottom: 8px;
  }

  .detail-card__title {
    font-size: 12px;
  }

  .detail-card__subtitle {
    font-size: 9px;
  }

  .detail-card__metric-label {
    font-size: 9px;
  }

  .detail-card__metric-value {
    font-size: 11px;
  }

  .detail-card__planned-value {
    font-size: 11px;
  }

  .detail-card__menu {
    width: 28px;
    height: 28px;
    margin: -4px -6px 0 0;
  }

  .progress-track--main {
    height: 10px;
    margin-bottom: 10px;
  }

  .detail-card__body {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.3fr);
    gap: 4px 6px;
  }

  .detail-stats__col {
    gap: 6px;
  }

  .stat-label {
    font-size: 8px;
  }

  .stat-value {
    font-size: 10px;
  }

  .detail-donut {
    min-height: 52px;
  }

  .detail-donut__side {
    min-height: 52px;
  }

  .detail-donut__pie {
    width: 52px;
    height: 52px;
  }

  .detail-donut__chart {
    min-width: 52px;
    min-height: 52px;
  }

  .detail-donut__label-line {
    font-size: 7px;
  }

  .detail-donut__label-pct {
    font-size: 8px;
  }
}
</style>
