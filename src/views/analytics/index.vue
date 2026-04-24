<template>
  <ion-page class="analytics-page">
    <ion-header class="ion-no-border">
      <ion-toolbar class="analytics-toolbar">
        <ion-title>Analytics</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" class="header-more-btn" aria-label="More options">
            <ion-icon :icon="ellipsisVertical" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="analytics-content">
      <div class="page-inner">
        <div class="account-row">
          <button type="button" class="account-pill">
            <span class="account-pill__label">{{ sampleAccountName }}</span>
            <ion-icon :icon="chevronDown" class="account-pill__chev" />
          </button>
          <span class="account-balance">Bal: Rs {{ sampleBalanceDisplay }}</span>
        </div>

        <div class="view-toggle" role="tablist" aria-label="Report view">
          <button
            type="button"
            class="view-toggle__item"
            :class="{ 'view-toggle__item--active': viewMode === 'basic' }"
            role="tab"
            :aria-selected="viewMode === 'basic'"
            @click="viewMode = 'basic'"
          >
            <span>Basic view</span>
            <span v-if="viewMode === 'basic'" class="view-toggle__underline" />
          </button>
          <button
            type="button"
            class="view-toggle__item"
            :class="{ 'view-toggle__item--active': viewMode === 'advanced' }"
            role="tab"
            :aria-selected="viewMode === 'advanced'"
            @click="viewMode = 'advanced'"
          >
            <span>Advanced view</span>
            <span v-if="viewMode === 'advanced'" class="view-toggle__underline" />
          </button>
        </div>

        <div v-show="viewMode === 'basic'" class="chart-stack">
          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h120">
              <VChart class="echart" :option="monthlyBarOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Sub-category-wise</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>All Time</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--donut chart-card__body--donut-tall">
              <VChart class="echart echart--donut-tall" :option="subcategoryDonutOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h120">
              <VChart class="echart" :option="incomeExpenseBarOption" autoresize />
            </div>
          </section>
        </div>

        <div v-show="viewMode === 'advanced'" class="chart-stack">
          <h3 class="section-title section-title--expense">Expense Analysis</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Daily Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last Month</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h130">
              <VChart class="echart" :option="dailyAnalysisOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Monthly Progression</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>April</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h150">
              <VChart class="echart" :option="monthlyProgressionStepOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Day-of-Week Analysis</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>All Time</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h130">
              <VChart class="echart" :option="dayOfWeekExpenseOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Day-of-Month Analysis</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>All Time</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h130">
              <VChart class="echart" :option="dayOfMonthExpenseOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h120">
              <VChart class="echart" :option="monthlyBarOption" autoresize />
            </div>
          </section>

          <h3 class="section-title section-title--category">Categorical Analysis</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Category-wise</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>All Time</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--donut">
              <VChart class="echart echart--donut" :option="categoryWiseDonutOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Sub-category-wise</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 6 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--donut chart-card__body--donut-tall">
              <VChart class="echart echart--donut-tall" :option="subcategoryDonutOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Stacked Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 6 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h150">
              <VChart class="echart" :option="stackedCategoryOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Category Analysis</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Category">
                <span>Eating Out</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h120">
              <VChart class="echart" :option="categoryAnalysisEatingOutOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Category Treemap</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>All Time</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h220">
              <VChart class="echart" :option="treemapRsOption" autoresize />
            </div>
          </section>

          <h3 class="section-title section-title--category">Flow &amp; distribution</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Sankey Diagram</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>All Time</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h260">
              <VChart class="echart" :option="sankeyHouseholdOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Pareto Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>All Time</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--pareto">
              <VChart class="echart echart--pareto" :option="pareto12kOption" autoresize />
              <div class="pareto-legend" aria-hidden="true">
                <div class="pareto-legend__col">
                  <span class="pareto-legend__t pareto-legend__t--b1">Housing &amp; Utilities</span>
                  <span class="pareto-legend__t pareto-legend__t--b2">Transport &amp; Travel</span>
                </div>
                <div class="pareto-legend__col">
                  <span class="pareto-legend__t pareto-legend__t--b3">Food &amp; Dining</span>
                  <span class="pareto-legend__t pareto-legend__t--b4">Miscellaneous</span>
                </div>
                <div class="pareto-legend__col">
                  <span class="pareto-legend__t pareto-legend__t--b5">Giving &amp; Social</span>
                  <span class="pareto-legend__t pareto-legend__t--b6">Personal &amp; Wellness</span>
                </div>
              </div>
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">Radar Spider Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>All Time</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h220">
              <VChart class="echart" :option="radarPlannedActualOption" autoresize />
            </div>
          </section>

          

          <h3 class="section-title section-title--category">I/E Analysis</h3>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Monthly Progression</h2>
              <button type="button" class="period-chip period-chip--narrow" aria-label="Time range">
                <span>April</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h150">
              <VChart class="echart" :option="ieProgressionDualAreaOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h120">
              <VChart class="echart" :option="incomeExpenseHighlightOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Gap Monthly Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h130">
              <VChart class="echart" :option="ieGapMonthlyOption" autoresize />
            </div>
          </section>

          <section class="chart-card">
            <div class="chart-card__head">
              <h2 class="chart-card__title">I/E Waterfall Analysis</h2>
              <button type="button" class="period-chip" aria-label="Time range">
                <span>Last 12 Months</span>
                <ion-icon :icon="chevronDown" class="period-chip__icon" />
              </button>
            </div>
            <div class="chart-card__body chart-card__body--h150">
              <VChart class="echart" :option="ieWaterfall12Option" autoresize />
            </div>
          </section>
        </div>
      </div>
      <div class="tab-spacer" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/vue'
import { ellipsisVertical, chevronDown } from 'ionicons/icons'

const viewMode = ref('basic')
const sampleAccountName = 'Household Expenses'
const sampleBalanceDisplay = '1,389,905.19'

const D = {
  green: '#66C2A5',
  green2: '#66BB6A',
  yellow: '#FFD92F',
  pink: '#E78AC3',
  red: '#EF5350',
  blue: '#5C9FD4',
  purple: '#9C6BCE',
  coral: '#FF8A65',
  tabOrange: '#F39C12',
  grid: 'rgba(0,0,0,0.06)',
  axis: '#A8A8A8',
  muted: 'rgba(0,0,0,0.65)',
  highlightPurple: '#7B1FA2',
}

const FISCAL_MONTHS = [
  'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar',
]

const OCT_TO_MAR = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

const DAYS_1_30 = Array.from({ length: 30 }, (_, i) => String(i + 1))
const DAYS_1_31 = Array.from({ length: 31 }, (_, i) => String(i + 1))
const xLab136182430 = (i) => [0, 5, 11, 17, 23, 29].includes(i)

const gridStd = (extra = {}) => ({
  left: 6,
  right: 4,
  top: 8,
  bottom: 4,
  containLabel: true,
  ...extra,
})

const xSplit = { show: true, lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } }

const lg = (c1, c2) => ({
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: c1 },
    { offset: 1, color: c2 },
  ],
})

/* Apr–Mar: design tiers — yellow mid, green lower, red/pink high months */
const monthlyBarValues = [720, 400, 520, 480, 650, 720, 420, 380, 500, 640, 280, 300].map((v) => v * 1000)
const monthlyBarGrad = [
  lg('#FFE9A3', '#E5B01C'),
  lg('#9EE5C8', '#3D9B78'),
  lg('#9EE5C8', '#3D9B78'),
  lg('#9EE5C8', '#3D9B78'),
  lg('#9EE5C8', '#3D9B78'),
  lg('#F5B0CC', '#C94B7A'),
  lg('#9EE5C8', '#3D9B78'),
  lg('#F5B0CC', '#C94B7A'),
  lg('#9EE5C8', '#3D9B78'),
  lg('#F5B0CC', '#C94B7A'),
  lg('#FFE9A3', '#E5B01C'),
  lg('#FFE9A3', '#E5B01C'),
]

const monthlyBarOption = computed(() => ({
  grid: gridStd(),
  tooltip: { show: false },
  xAxis: {
    type: 'category',
    data: FISCAL_MONTHS,
    splitLine: xSplit,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 8 },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 800000,
    interval: 200000,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 8, formatter: (v) => (v === 0 ? '0' : `${v / 1000}k`) },
  },
  series: [
    {
      type: 'bar',
      data: monthlyBarValues.map((v, i) => ({
        value: v,
        itemStyle: { color: monthlyBarGrad[i], borderRadius: [5, 5, 0, 0] },
      })),
      barWidth: '32%',
      barCategoryGap: '36%',
    },
  ],
}))

/* Full sub-category set (two-sided labels in design); values sum to ~100 */
const subcategorySlices = [
  { name: 'Personal Care', value: 1.09, c: '#F8B4CE' },
  { name: 'Subscriptions', value: 3.91, c: '#6F4CB8' },
  { name: 'Water', value: 1.03, c: D.blue },
  { name: 'Home Maintenance', value: 1.45, c: '#9E9E9E' },
  { name: 'Communication', value: 1.78, c: '#2EB8B8' },
  { name: 'Electricity & Gas', value: 1.78, c: D.yellow },
  { name: 'Household Supplies', value: 4.65, c: '#8FA4B4' },
  { name: 'Rent', value: 25.85, c: '#1E4D75' },
  { name: 'Fuel', value: 5.23, c: '#E88A2E' },
  { name: 'Taxi & Hire', value: 2.3, c: '#E0C32E' },
  { name: 'Parking & Tolls', value: 0.29, c: '#B0B0B0' },
  { name: 'Groceries', value: 15.51, c: D.green },
  { name: 'Eating out', value: 6.89, c: '#E57373' },
  { name: 'Takeaway', value: 2.23, c: '#F48FB1' },
  { name: 'Fruits', value: 1.15, c: '#A5D6A7' },
  { name: 'Uncategorized', value: 0.69, c: '#B85C5C' },
  { name: 'Snacks', value: 0.33, c: '#D4A373' },
  { name: 'Family', value: 20.1, c: D.purple },
  { name: 'Gifts', value: 2.87, c: '#B39DDB' },
  { name: 'Giving & Donations', value: 0.86, c: '#90CAF9' },
]

const scTop = (hex) => (hex.length === 7 ? `${hex}E0` : hex)

const scPieData = subcategorySlices.map((s) => ({
  name: s.name,
  value: s.value,
  itemStyle: {
    color: lg(scTop(s.c), s.c),
    borderColor: '#fff',
    borderWidth: 2,
  },
}))

const subLabelRich = subcategorySlices.reduce((acc, s, i) => {
  acc[`sn${i}`] = { color: s.c, fontSize: 6, lineHeight: 10, align: 'left' }
  acc[`sp${i}`] = { color: s.c, fontSize: 7, fontWeight: 600, lineHeight: 10, align: 'left' }
  return acc
}, {})

const subcategoryDonutOption = computed(() => ({
  tooltip: { show: false },
  legend: { show: false },
  series: [
    {
      type: 'pie',
      padAngle: 1.2,
      minShowLabelAngle: 0.2,
      radius: ['40%', '58%'],
      center: ['50%', '50%'],
      data: scPieData,
      label: {
        show: true,
        minMargin: 1,
        edgeDistance: 3,
        formatter: (p) => (p.dataIndex == null ? '' : `{sn${p.dataIndex}|${p.name}}\n{sp${p.dataIndex}|${p.percent.toFixed(2)}%}`),
        rich: subLabelRich,
      },
      labelLine: {
        show: true,
        lineStyle: { color: '#C8C8C8', width: 0.75, type: [3, 3] },
        length: 6,
        length2: 10,
        smooth: 0.2,
      },
      emphasis: { disabled: true },
    },
  ],
}))

const incomeSeries = FISCAL_MONTHS.map((_, i) => 200000 + (i % 5) * 90000 + i * 12000)
const expenseSeries = FISCAL_MONTHS.map((_, i) => {
  let v = 150000 + (i % 4) * 110000 + i * 8000
  if (i === 9) v = 818000
  if (i === 1) v = 310000
  return v
})
const gIn = lg('#8FD99A', '#4CA658')
const gEx = lg('#F9A8A3', '#E04E4A')

const incomeExpenseBarOption = computed(() => ({
  grid: gridStd(),
  tooltip: { show: false },
  xAxis: {
    type: 'category',
    data: FISCAL_MONTHS,
    splitLine: xSplit,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 8 },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 800000,
    interval: 200000,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 8, formatter: (v) => (v === 0 ? '0' : `${v / 1000}k`) },
  },
  series: [
    {
      name: 'Income',
      type: 'bar',
      data: incomeSeries,
      itemStyle: { color: gIn, borderRadius: [5, 5, 0, 0] },
      barMaxWidth: 6,
      barGap: '25%',
      barCategoryGap: '40%',
    },
    {
      name: 'Expenses',
      type: 'bar',
      data: expenseSeries,
      itemStyle: { color: gEx, borderRadius: [5, 5, 0, 0] },
      barMaxWidth: 6,
    },
  ],
}))

const gMint = (top, bot) => lg(top, bot)
const dailyVals = DAYS_1_31.map((_, i) => {
  const d = i + 1
  if (d === 5 || d === 16) return 88000 + (d % 4) * 2000
  if (d === 9 || d === 10 || d === 22 || d === 26) return 45000 + (i % 3) * 8000
  return 12000 + (i * 1127) % 22000
})

const barStyleDaily = (v) => {
  const tG = gMint('#81C784', '#43A047')
  const tY = gMint('#FFE082', '#F9A825')
  const tR = gMint('#FF8A80', '#E53935')
  if (v >= 78000) return { color: tR, borderRadius: [3, 3, 0, 0] }
  if (v >= 40000) return { color: tY, borderRadius: [3, 3, 0, 0] }
  return { color: tG, borderRadius: [3, 3, 0, 0] }
}

const dailyAnalysisOption = computed(() => ({
  grid: gridStd(),
  tooltip: { show: false },
  xAxis: {
    type: 'category',
    data: DAYS_1_31,
    axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.12)', width: 0.5 } },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 7, formatter: (v, i) => (xLab136182430(i) ? v : '') },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100000,
    interval: 20000,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 7, formatter: (v) => `${v / 1000}k` },
  },
  series: [
    {
      type: 'bar',
      data: dailyVals.map((v) => ({ value: v, itemStyle: barStyleDaily(v) })),
      barWidth: '28%',
      barCategoryGap: '55%',
    },
  ],
}))

const progressionCum = DAYS_1_30.map((_, i) => {
  const t = 3000 * (i + 1) * (1 + 0.02 * Math.sin(i * 0.4))
  return Math.min(480000, Math.round(8000 * (i + 1) * 0.45 + t * 0.35 + (i % 3) * 4000))
})

const monthlyProgressionStepOption = computed(() => ({
  grid: gridStd(),
  tooltip: { show: false },
  xAxis: {
    type: 'category',
    data: DAYS_1_30,
    splitLine: xSplit,
    axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.12)' } },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 7, formatter: (v, i) => (xLab136182430(i) ? v : '') },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 500000,
    interval: 100000,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 7, formatter: (v) => `${v / 1000}k` },
  },
  series: [
    {
      type: 'line',
      data: progressionCum,
      smooth: false,
      showSymbol: false,
      lineStyle: { color: '#E65C5C', width: 2.2 },
      areaStyle: { color: 'rgba(230, 92, 92, 0.12)' },
    },
  ],
}))

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weekVals = [7000, 10000, 15000, 6500, 17000, 24000, 10000]
const wGrad = (i) => {
  const g = gMint('#81C784', '#43A047')
  const y = gMint('#FFE082', '#F9A825')
  const r = gMint('#FF8A80', '#E53935')
  const m = [g, g, y, g, y, r, g]
  return { value: weekVals[i], itemStyle: { color: m[i], borderRadius: [5, 5, 0, 0] } }
}

const dayOfWeekExpenseOption = computed(() => ({
  grid: gridStd(),
  tooltip: { show: false },
  xAxis: {
    type: 'category',
    data: weekDays,
    axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.1)' } },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 8 },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 25000,
    interval: 5000,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 7, formatter: (v) => (v === 0 ? '0' : `${v / 1000}k`) },
  },
  series: [
    {
      type: 'bar',
      data: weekDays.map((_, i) => wGrad(i)),
      barWidth: '50%',
      barCategoryGap: '32%',
    },
  ],
}))

const domVals = DAYS_1_31.map((_, i) => {
  const d = i + 1
  if (d === 5 || d === 16) return 42000 + (d % 3) * 2000
  if (d === 9 || d === 10 || d === 22 || d === 26) return 22000 + (i % 2) * 5000
  return 8000 + (i * 97) % 10000
})

const domStyle = (v) => {
  if (v >= 40000) return { color: gMint('#FF8A80', '#E53935'), borderRadius: [6, 6, 0, 0] }
  if (v >= 18000) return { color: gMint('#FFE082', '#F9A825'), borderRadius: [6, 6, 0, 0] }
  return { color: gMint('#81C784', '#43A047'), borderRadius: [6, 6, 0, 0] }
}

const dayOfMonthExpenseOption = computed(() => ({
  grid: gridStd(),
  tooltip: { show: false },
  xAxis: {
    type: 'category',
    data: DAYS_1_31,
    axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.12)' } },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 7, formatter: (v, i) => (xLab136182430(i) ? v : '') },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 50000,
    interval: 10000,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 7, formatter: (v) => (v === 0 ? '0' : `${v / 1000}k`) },
  },
  series: [
    {
      type: 'bar',
      data: domVals.map((v) => ({ value: v, itemStyle: domStyle(v) })),
      barWidth: '32%',
      barCategoryGap: '50%',
    },
  ],
}))

const catWise = [
  { n: 'Personal & Wellness', v: 1.09, c: '#66BB6A' },
  { n: 'Transport & Travel', v: 5.23, c: '#7E57C2' },
  { n: 'Food & Dining', v: 15.51, c: '#FF9800' },
  { n: 'Givings & Socials', v: 20.1, c: '#F06292' },
  { n: 'Housing & Utilities', v: 51.0, c: '#1976D2' },
  { n: 'Miscellaneous', v: 3.91, c: '#9E9E9E' },
]
const sCatWise = catWise.map((x) => ({
  name: x.n,
  value: x.v,
  itemStyle: {
    color: lg(`${x.c}DD`, x.c),
    borderColor: '#fff',
    borderWidth: 2,
    shadowBlur: 10,
    shadowColor: 'rgba(0,0,0,0.08)',
  },
}))
const cwRich = catWise.reduce((a, s, i) => {
  a[`cn${i}`] = { color: s.c, fontSize: 6, lineHeight: 10 }
  a[`cp${i}`] = { color: s.c, fontSize: 7, fontWeight: 700, lineHeight: 10 }
  return a
}, {})

const categoryWiseDonutOption = computed(() => ({
  tooltip: { show: false },
  legend: { show: false },
  series: [
    {
      type: 'pie',
      padAngle: 0.8,
      radius: ['40%', '62%'],
      center: ['50%', '50%'],
      data: sCatWise,
      label: {
        show: true,
        minMargin: 2,
        edgeDistance: 4,
        formatter: (p) => (p.dataIndex == null ? '' : `{cn${p.dataIndex}|${p.name}}\n{cp${p.dataIndex}|${p.percent.toFixed(2)}%}`),
        rich: cwRich,
      },
      labelLine: { show: true, lineStyle: { color: '#C8C8C8', type: [3, 3], width: 0.6 }, length: 8, length2: 10, smooth: 0.2 },
      emphasis: { disabled: true },
    },
  ],
}))

const stackPct2 = (() => {
  const r = { food: [], giv: [], house: [], misc: [], pers: [], trans: [] }
  for (let m = 0; m < 6; m += 1) {
    const food = 11
    const giv = 19
    const house = [28, 30, 32, 29, 38, 44][m]
    const misc = [16, 15, 14, 16, 9, 7][m]
    const pers = 7
    const trans = [19, 18, 17, 18, 16, 12][m]
    const t = food + giv + house + misc + pers + trans
    r.food.push((food / t) * 100)
    r.giv.push((giv / t) * 100)
    r.house.push((house / t) * 100)
    r.misc.push((misc / t) * 100)
    r.pers.push((pers / t) * 100)
    r.trans.push((trans / t) * 100)
  }
  return r
})()

const sk = (a, t, b) => lg(a + t, b)
const stackedCategoryOption = computed(() => ({
  grid: { left: 96, right: 8, top: 8, bottom: 8, containLabel: false },
  tooltip: { show: false },
  legend: {
    show: true,
    orient: 'vertical',
    left: 0,
    top: 'center',
    itemGap: 6,
    itemWidth: 6,
    itemHeight: 6,
    selectedMode: false,
    textStyle: { fontSize: 7 },
    data: [
      { name: 'Transport & Travel', textStyle: { color: '#7E57C2' } },
      { name: 'Personal & Wellness', textStyle: { color: '#66BB6A' } },
      { name: 'Miscellaneous', textStyle: { color: '#9E9E9E' } },
      { name: 'Housing & Utilities', textStyle: { color: '#1976D2' } },
      { name: 'Givings & Socials', textStyle: { color: '#F06292' } },
      { name: 'Food & Dining', textStyle: { color: '#FF9800' } },
    ],
  },
  xAxis: {
    type: 'category',
    data: OCT_TO_MAR,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 8 },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    interval: 20,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { show: false },
  },
  series: [
    {
      name: 'Food & Dining',
      type: 'bar',
      stack: 'tot',
      data: stackPct2.food,
      itemStyle: { color: sk('#FFB74D', '88', '#E65100'), borderRadius: [0, 0, 4, 4] },
      barWidth: '55%',
    },
    { name: 'Givings & Socials', type: 'bar', stack: 'tot', data: stackPct2.giv, itemStyle: { color: sk('#F48FB1', '99', '#C2185B') } },
    { name: 'Housing & Utilities', type: 'bar', stack: 'tot', data: stackPct2.house, itemStyle: { color: sk('#64B5F6', 'AA', '#0D47A1') } },
    { name: 'Miscellaneous', type: 'bar', stack: 'tot', data: stackPct2.misc, itemStyle: { color: sk('#E0E0E0', 'CC', '#757575') } },
    { name: 'Personal & Wellness', type: 'bar', stack: 'tot', data: stackPct2.pers, itemStyle: { color: sk('#A5D6A7', 'CC', '#2E7D32') } },
    {
      name: 'Transport & Travel',
      type: 'bar',
      stack: 'tot',
      data: stackPct2.trans,
      itemStyle: { color: sk('#B39DDB', 'CC', '#4527A0'), borderRadius: [4, 4, 0, 0] },
    },
  ],
}))

const eatingOutSeries = [7500, 4000, 6500, 4000, 6000, 12000, 6500, 11500, 4500, 12200, 6500, 7500]

const categoryAnalysisEatingOutOption = computed(() => ({
  grid: gridStd(),
  tooltip: { show: false },
  xAxis: {
    type: 'category',
    data: FISCAL_MONTHS,
    splitLine: xSplit,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 8 },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 12000,
    interval: 3000,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 7, formatter: (v) => (v === 0 ? '0' : `${v / 1000}k`) },
  },
  series: [
    {
      type: 'bar',
      data: eatingOutSeries,
      itemStyle: { color: lg('#72cf9e', '#58b895'), borderRadius: [5, 5, 0, 0] },
      barWidth: '48%',
      barCategoryGap: '28%',
    },
  ],
}))

const treemapLeaves = [
  { name: 'Housing & Utilities', value: 63600 },
  { name: 'Food & Dining', value: 46700 },
  { name: 'Giving & Social', value: 41500 },
  { name: 'Transport & Travel', value: 13600 },
  { name: 'Miscellaneous', value: 6800 },
  { name: 'Personal & Wellness', value: 1900 },
]
const TREEMAP_BLUES = ['#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#64B5F6', '#BBDEFB']
const treemapLabelColor = (v) => (v >= 20000 ? 'rgba(255,255,255,0.97)' : 'rgba(0,0,0,0.7)')
const treemapRsData = [...treemapLeaves]
  .sort((a, b) => b.value - a.value)
  .map((d, i) => ({
    name: d.name,
    value: d.value,
    itemStyle: { color: TREEMAP_BLUES[Math.min(i, TREEMAP_BLUES.length - 1)] },
    label: { color: treemapLabelColor(d.value) },
  }))

const treemapRsOption = computed(() => ({
  tooltip: { show: false },
  series: [
    {
      type: 'treemap',
      roam: false,
      left: 2,
      right: 2,
      top: 2,
      bottom: 2,
      breadcrumb: { show: false },
      itemStyle: { borderColor: '#fff' },
      levels: [
        {
          itemStyle: { borderColor: '#fff', borderWidth: 8, gapWidth: 8, borderRadius: 12 },
        },
      ],
      label: {
        show: true,
        position: 'inside',
        fontSize: 7,
        align: 'center',
        verticalAlign: 'middle',
        lineHeight: 12,
        formatter: (p) => {
          const d = p.data
          if (d != null && typeof d === 'object' && d.name != null) {
            const n = d.value
            const num = Array.isArray(n) ? n[n.length - 1] : n
            return `${d.name}\n${Number(num).toLocaleString()} Rs`
          }
          const v = p.value
          const num = Array.isArray(v) ? v[v.length - 1] : v
          return p.name ? `${p.name}\n${Number(num).toLocaleString()} Rs` : ''
        },
      },
      upperLabel: { show: false },
      data: treemapRsData,
    },
  ],
}))

const snkP = (name, pct) => `${name} (${pct})`
const SNK_PRO = snkP('Professional Earnings', '88.96%')
const SNK_INV = snkP('Investment Earnings', '11.04%')
const SNK_MID = 'Inflow' /* label hidden; pale middle column in mock */
const SNK_SAV = snkP('Savings & Goals', '30.92%')
const SNK_HOU = snkP('Housing & Utilities', '36.78%')
const SNK_FOD = snkP('Food & Dining', '26.32%')
const SNK_GIV = snkP('Giving & Social', '24%')
const SNK_TRN = snkP('Transport & Travel', '7.87%')
const SNK_MSC = snkP('Miscellaneous', '3.93%')
const SNK_PER = snkP('Personal & Wellness', '1.10%')
const snkB = (c) => ({ borderColor: 'rgba(0,0,0,0.12)', borderWidth: 0.5, shadowBlur: 2, shadowColor: 'rgba(0,0,0,0.06)' })

const sankeyHouseholdOption = computed(() => ({
  tooltip: { show: false },
  series: [
    {
      type: 'sankey',
      emphasis: { focus: 'adjacency' },
      left: 0,
      right: 0,
      top: 4,
      bottom: 2,
      nodeWidth: 9,
      nodeGap: 5,
      label: { fontSize: 5.5, color: D.muted, lineHeight: 8 },
      lineStyle: { color: 'gradient', curveness: 0.48, opacity: 0.4 },
      data: [
        { name: SNK_PRO, depth: 0, itemStyle: { color: '#3CB371', ...snkB() }, label: { position: 'right' } },
        { name: SNK_INV, depth: 0, itemStyle: { color: '#26A69A', ...snkB() }, label: { position: 'right' } },
        { name: SNK_MID, depth: 1, itemStyle: { color: '#E5EFC8', borderColor: 'rgba(0,0,0,0.08)', borderWidth: 0.5 }, label: { show: false } },
        { name: SNK_SAV, depth: 2, itemStyle: { color: '#FF8A50' }, label: { position: 'left' } },
        { name: SNK_HOU, depth: 2, itemStyle: { color: '#1E6FD9' }, label: { position: 'left' } },
        { name: SNK_FOD, depth: 2, itemStyle: { color: '#FFB300' }, label: { position: 'left' } },
        { name: SNK_GIV, depth: 2, itemStyle: { color: '#F06292' }, label: { position: 'left' } },
        { name: SNK_TRN, depth: 2, itemStyle: { color: '#7E57C2' }, label: { position: 'left' } },
        { name: SNK_MSC, depth: 2, itemStyle: { color: '#9E9E9E' }, label: { position: 'left' } },
        { name: SNK_PER, depth: 2, itemStyle: { color: '#66BB6A' }, label: { position: 'left' } },
      ],
      links: [
        { source: SNK_PRO, target: SNK_MID, value: 88.96 },
        { source: SNK_INV, target: SNK_MID, value: 11.04 },
        { source: SNK_MID, target: SNK_SAV, value: 24 },
        { source: SNK_MID, target: SNK_HOU, value: 32 },
        { source: SNK_MID, target: SNK_FOD, value: 20 },
        { source: SNK_MID, target: SNK_GIV, value: 12 },
        { source: SNK_MID, target: SNK_TRN, value: 8 },
        { source: SNK_MID, target: SNK_MSC, value: 3.5 },
        { source: SNK_MID, target: SNK_PER, value: 0.5 },
      ],
    },
  ],
}))

const paretoCats = ['Housing & Utilities', 'Food & Dining', 'Giving & Social', 'Transport & Travel', 'Miscellaneous', 'Personal & Wellness']
const paretoBars = [11200, 9800, 7200, 5100, 3200, 2100]
const paretoCum = [32, 60, 78, 90, 96, 100]
const paretoBarGrad = [
  lg('#5C8FC4', '#0D47A1'),
  lg('#FFE082', '#F9A825'),
  lg('#F48FB1', '#C2185B'),
  lg('#B39DDB', '#5E35B1'),
  lg('#E0E0E0', '#757575'),
  lg('#A5D6A7', '#2E7D32'),
]

const pareto12kOption = computed(() => ({
  grid: { left: 4, right: 32, top: 8, bottom: 4, containLabel: true },
  tooltip: { show: false },
  legend: { show: false },
  xAxis: {
    type: 'category',
    data: paretoCats,
    axisLine: { show: true, lineStyle: { color: D.grid, width: 0.5 } },
    axisTick: { show: false },
    splitLine: xSplit,
    axisLabel: { show: false },
  },
  yAxis: [
    {
      type: 'value',
      min: 0,
      max: 12000,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: D.axis, fontSize: 7, formatter: (v) => `${v / 1000}k` },
    },
    {
      type: 'value',
      min: 0,
      max: 100,
      position: 'right',
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: D.axis, fontSize: 7, formatter: '{value}%' },
    },
  ],
  series: [
    {
      name: 'Amount',
      type: 'bar',
      yAxisIndex: 0,
      data: paretoBars.map((v, i) => ({ value: v, itemStyle: { color: paretoBarGrad[i], borderRadius: [5, 5, 0, 0] } })),
      barMaxWidth: 16,
    },
    {
      name: 'Cumulative %',
      type: 'line',
      yAxisIndex: 1,
      data: paretoCum,
      smooth: 0.2,
      showSymbol: true,
      symbolSize: 3,
      lineStyle: { color: '#D64550', width: 1.8 },
      itemStyle: { color: '#D64550' },
    },
  ],
}))

const radarIndColor = ['#0D1B4D', '#FF8F00', '#E91E63', '#7B1FA2', '#757575', '#2E7D32']
const radarAx = [
  { name: 'Housing & Utilities', max: 100, nameTextStyle: { color: radarIndColor[0], fontSize: 6 } },
  { name: 'Food & Dining', max: 100, nameTextStyle: { color: radarIndColor[1], fontSize: 6 } },
  { name: 'Giving & Social', max: 100, nameTextStyle: { color: radarIndColor[2], fontSize: 6 } },
  { name: 'Transport & Travel', max: 100, nameTextStyle: { color: radarIndColor[3], fontSize: 6 } },
  { name: 'Miscellaneous', max: 100, nameTextStyle: { color: radarIndColor[4], fontSize: 6 } },
  { name: 'Personal & Wellness', max: 100, nameTextStyle: { color: radarIndColor[5], fontSize: 6 } },
]
const radarP = [72, 68, 55, 62, 48, 40]
const radarA = [78, 74, 50, 58, 52, 35]

const radarPlannedActualOption = computed(() => ({
  tooltip: { show: false },
  legend: {
    show: true,
    bottom: 0,
    data: [
      { name: 'Planned', textStyle: { color: '#26A69A', fontSize: 7 } },
      { name: 'Actual', textStyle: { color: '#1976D2', fontSize: 7 } },
    ],
    itemWidth: 8,
    itemHeight: 8,
  },
  radar: {
    center: ['50%', '48%'],
    radius: '58%',
    shape: 'polygon',
    splitNumber: 4,
    indicator: radarAx,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    splitArea: { show: true, areaStyle: { color: ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.04)'] } },
    axisName: { fontSize: 6 },
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          name: 'Planned',
          value: radarP,
          areaStyle: { color: 'rgba(38, 166, 154, 0.18)' },
          lineStyle: { color: '#26A69A', width: 1.2 },
        },
        {
          name: 'Actual',
          value: radarA,
          areaStyle: { color: 'rgba(25, 118, 210, 0.22)' },
          lineStyle: { color: '#1976D2', width: 1.2 },
        },
      ],
    },
  ],
}))

const incStep = DAYS_1_30.map((_, i) => {
  if (i < 4) return 0
  if (i < 10) return 200000
  if (i < 17) return 380000
  return 500000
})
const expLineSmooth = DAYS_1_30.map((_, i) =>
  Math.min(499000, Math.round(14500 * (i + 1) * 0.9 + 2200 * Math.sin(i * 0.35) + 4000 * (i / 29)))
)

const ieProgressionDualAreaOption = computed(() => ({
  grid: gridStd(),
  tooltip: { show: false },
  xAxis: {
    type: 'category',
    data: DAYS_1_30,
    splitLine: xSplit,
    axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.1)', width: 0.5 } },
    axisTick: { show: false },
    axisLabel: {
      color: D.axis,
      fontSize: 7,
      formatter: (v, i) => ([0, 5, 11, 17, 23, 29].includes(i) ? v : ''),
    },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 500000,
    interval: 100000,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 7, formatter: (v) => `${v / 1000}k` },
  },
  series: [
    {
      name: 'Income',
      type: 'line',
      z: 1,
      step: 'end',
      data: incStep,
      showSymbol: false,
      lineStyle: { color: '#3CB371', width: 1.8 },
      areaStyle: { color: 'rgba(60, 179, 113, 0.14)' },
    },
    {
      name: 'Expenses',
      type: 'line',
      z: 2,
      data: expLineSmooth,
      smooth: true,
      showSymbol: false,
      lineStyle: { color: '#D64550', width: 1.8 },
      areaStyle: { color: 'rgba(214, 69, 80, 0.12)' },
    },
  ],
}))

const incomeExpenseHighlightOption = computed(() => ({
  grid: gridStd(),
  tooltip: { show: false },
  xAxis: {
    type: 'category',
    data: FISCAL_MONTHS,
    splitLine: xSplit,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 8 },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 800000,
    interval: 200000,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 8, formatter: (v) => (v === 0 ? '0' : `${v / 1000}k`) },
  },
  series: [
    {
      name: 'Income',
      type: 'bar',
      data: incomeSeries,
      itemStyle: { color: gIn, borderRadius: [9, 9, 0, 0] },
      barMaxWidth: 6,
      barGap: '20%',
      barCategoryGap: '35%',
      markArea: {
        silent: true,
        itemStyle: { borderColor: D.highlightPurple, borderWidth: 1.5, color: 'rgba(123, 31, 162, 0.04)' },
        data: [[{ xAxis: 'Oct' }, { xAxis: 'Oct' }]],
      },
    },
    {
      name: 'Expenses',
      type: 'bar',
      data: expenseSeries,
      itemStyle: { color: gEx, borderRadius: [9, 9, 0, 0] },
      barMaxWidth: 6,
    },
  ],
}))

const gapValsDesign = [100000, 380000, 300000, 320000, 210000, -120000, 280000, -60000, 380000, -70000, 310000, 90000]
const gPosGap = lg('#C8E6C9', '#1B5E20')
const gNegGap = lg('#FFCDD2', '#B71C1C')

const ieGapMonthlyOption = computed(() => ({
  grid: gridStd(),
  tooltip: { show: false },
  xAxis: {
    type: 'category',
    data: FISCAL_MONTHS,
    splitLine: xSplit,
    axisLine: { show: true, lineStyle: { color: D.grid, width: 0.5 } },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 8 },
  },
  yAxis: {
    type: 'value',
    min: -200000,
    max: 400000,
    interval: 100000,
    splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: D.axis, fontSize: 7, formatter: (v) => `${v / 1000}k` },
  },
  series: [
    {
      type: 'bar',
      data: gapValsDesign.map((v) => ({
        value: v,
        itemStyle: {
          color: v >= 0 ? gPosGap : gNegGap,
          borderRadius: v >= 0 ? [10, 10, 0, 0] : [0, 0, 10, 10],
        },
      })),
      barWidth: '42%',
      barCategoryGap: '32%',
    },
  ],
}))

const wfChg = [350000, 220000, -140000, -90000, 280000, -150000, 200000, 120000, -100000, 180000, -120000, 160000]
const gWfP = lg('#A5D6A7', '#1B5E20')
const gWfN = lg('#FFCDD2', '#B71C1C')

const ieWaterfall12Option = computed(() => {
  let cum = 0
  const help = []
  const val = []
  wfChg.forEach((c) => {
    if (c >= 0) {
      help.push(cum)
      val.push(c)
      cum += c
    } else {
      const next = cum + c
      help.push(next)
      val.push(-c)
      cum = next
    }
  })
  return {
    grid: gridStd({ bottom: 6 }),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: FISCAL_MONTHS,
      splitLine: xSplit,
      axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.1)', width: 0.5 } },
      axisTick: { show: false },
      axisLabel: { color: D.axis, fontSize: 7 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 2000000,
      interval: 500000,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: D.axis, fontSize: 7, formatter: (v) => (v >= 1000000 ? `${v / 1000000}M` : `${v / 1000}k`) },
    },
    series: [
      {
        type: 'bar',
        stack: 'wf',
        itemStyle: { color: 'transparent' },
        emphasis: { disabled: true },
        data: help,
      },
      {
        type: 'bar',
        stack: 'wf',
        data: val.map((v, i) => ({
          value: v,
          itemStyle: {
            color: wfChg[i] >= 0 ? gWfP : gWfN,
            borderRadius: wfChg[i] >= 0 ? [6, 6, 0, 0] : [0, 0, 6, 6],
          },
        })),
        barWidth: '48%',
        barCategoryGap: '30%',
      },
    ],
  }
})
</script>

<style scoped>
.analytics-page {
  --background: #efeef3;
}

.analytics-toolbar {
  --min-height: 48px;
  --border-width: 0;
  --background: #efeef3;
  --padding-top: 4px;
}

.analytics-toolbar ion-title {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}

.header-more-btn {
  --color: #ff8d28;
  margin: 0;
}

.header-more-btn ion-icon {
  font-size: 24px;
}

.analytics-content {
  --background: #efeef3;
}

.page-inner {
  max-width: 400px;
  margin: 0 auto;
  padding: 0 16px 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.account-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 24px;
  margin-bottom: 10px;
}

.account-pill {
  display: inline-flex;
  align-items: center;
  max-width: 58%;
  padding: 0;
  background: none;
  border: none;
  color: rgba(0, 0, 0, 0.75);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  text-align: left;
}

.account-pill__chev {
  width: 18px;
  height: 18px;
  color: #a8a8a8;
  flex-shrink: 0;
}

.account-balance {
  flex-shrink: 0;
  font-size: 12px;
  color: #a8a8a8;
}

.view-toggle {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 12px;
}

.view-toggle__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 2px 0 0;
  background: none;
  border: none;
  font-size: 14px;
  color: #8e8e93;
  cursor: pointer;
  min-width: 88px;
  font-weight: 500;
}

.view-toggle__item--active {
  font-weight: 700;
  color: #f39c12;
}

.view-toggle__underline {
  display: block;
  width: 20px;
  height: 3px;
  border-radius: 2px;
  background: #f39c12;
  margin-top: 2px;
}

.section-title {
  --section-title-accent: #007bff;
  margin: 10px 0 8px;
  padding: 12px 14px 12px 22px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.25px;
  background: #fff;
  border: none;
  border-left: 3px solid var(--section-title-accent);
  border-radius: 6px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04) inset, 0 1px 2px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

/* subtle top band like the design under the previous block */
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, transparent 100%);
  pointer-events: none;
  border-radius: 6px 6px 0 0;
}

.section-title--expense {
  color: #7b1fa2;
}

.section-title--category {
  color: #ff8c00;
}

.chart-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 10px 10px 12px;
}

.chart-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  min-height: 18px;
}

.chart-card__title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.2;
}

.period-chip {
  display: inline-flex;
  align-items: center;
  max-width: 52%;
  padding: 4px 4px 4px 6px;
  background: #fff;
  border: 1px solid rgba(168, 168, 168, 0.35);
  border-radius: 5px;
  font-size: 8px;
  line-height: 1;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  white-space: nowrap;
}

.period-chip--narrow {
  max-width: 46%;
}

.period-chip__icon {
  width: 16px;
  height: 16px;
  color: #a8a8a8;
  flex-shrink: 0;
}

.chart-card__body {
  width: 100%;
}

.chart-card__body--h120 {
  height: 120px;
}

.chart-card__body--h130 {
  height: 130px;
}

.chart-card__body--h150 {
  height: 150px;
}

.chart-card__body--h190 {
  height: 190px;
}

.chart-card__body--h220 {
  height: 220px;
}

.chart-card__body--h260 {
  height: 260px;
}

.chart-card__body--donut {
  height: 200px;
}

.chart-card__body--donut-tall {
  height: 280px;
  min-height: 280px;
}

.echart {
  width: 100%;
  min-height: 100%;
}

.echart--donut {
  min-height: 200px;
}

.echart--donut-tall {
  min-height: 280px;
}

.chart-card__body--pareto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 188px;
}

.echart--pareto {
  flex: 0 0 132px;
  height: 132px;
  min-height: 132px;
}

.pareto-legend {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1px 4px;
  margin-top: 2px;
  padding: 0 1px;
}

.pareto-legend__col {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pareto-legend__t {
  font-size: 6.5px;
  line-height: 1.25;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.pareto-legend__t--b1 {
  color: #0d47a1;
}
.pareto-legend__t--b2 {
  color: #5e35b1;
}
.pareto-legend__t--b3 {
  color: #e65100;
}
.pareto-legend__t--b4 {
  color: #616161;
}
.pareto-legend__t--b5 {
  color: #c2185b;
}
.pareto-legend__t--b6 {
  color: #2e7d32;
}

.tab-spacer {
  height: 68px;
}
</style>
