<template>
  <ion-page class="analytics-month-page">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="backHref" text="" />
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <div class="page-inner">
        <div class="totals">
          <div class="totals__item">
            <span class="totals__label totals__label--income">Income</span>
            <p class="totals__value">{{ formatAmount(periodIncome) }}</p>
          </div>
          <div class="totals__item">
            <span class="totals__label totals__label--expense">Expense</span>
            <p class="totals__value">{{ formatAmount(periodExpense) }}</p>
          </div>
        </div>

        <div v-if="loading" class="loading-wrap">
          <ion-spinner name="crescent" color="primary" />
        </div>

        <section v-else-if="chartPoints.length" class="day-bars">
          <button
            v-for="(pt, i) in chartPoints"
            :key="pt.date"
            type="button"
            class="day-bar"
            @click="onDaySelect(i)"
          >
            <span class="day-bar__label">{{ pt.label }}</span>
            <span class="day-bar__track">
              <span
                class="day-bar__fill day-bar__fill--expense"
                :style="{ width: barWidth(pt.expense) + '%' }"
              />
            </span>
            <span class="day-bar__amount">{{ formatAmount(pt.expense) }}</span>
          </button>
        </section>

        <div v-else class="empty">No activity this month</div>
        <p v-if="chartPoints.length" class="hint">Tap a day to view transactions</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/vue'
import { getAnalyticsDaily } from '@/api/accounting'
import {
  toYmd,
  pickerLabelFromYmd,
  shortDayLabel,
  monthRangeFromYmd,
} from '@/utils/expensePeriod'
import {
  parseIslandScopeFromQuery,
  islandScopeQueryValue,
} from '@/utils/analyticsIslandScope'
import { toYmdInLocalTime } from '@/utils/profileDisplay'
import { showToast } from '@/utils/ionicFeedback'
import { useAppCurrency } from '@/composables/useAppCurrency'

const route = useRoute()
const router = useRouter()
const { loadCurrencyCode, formatCurrency: formatAmount } = useAppCurrency()

const monthKey = computed(() => {
  const raw = String(route.params.ym || '').trim()
  const match = raw.match(/^(\d{4})-(\d{2})$/)
  return match ? `${match[1]}-${match[2]}` : ''
})

const islandScope = computed(() => parseIslandScopeFromQuery(route.query))

const backHref = computed(() => {
  const from = route.query.from
  return typeof from === 'string' && from.startsWith('/') ? from : '/analytics'
})

const pageTitle = computed(() => {
  if (!monthKey.value) return 'Month'
  return pickerLabelFromYmd(`${monthKey.value}-01`, { daily: false })
})

const chartPoints = ref([])
const loading = ref(false)

const periodIncome = computed(() =>
  chartPoints.value.reduce((sum, pt) => sum + (Number(pt.income) || 0), 0)
)
const periodExpense = computed(() =>
  chartPoints.value.reduce((sum, pt) => sum + (Number(pt.expense) || 0), 0)
)

const maxExpense = computed(() =>
  Math.max(1, ...chartPoints.value.map((pt) => Number(pt.expense) || 0))
)

function barWidth(expense) {
  const v = Number(expense) || 0
  return Math.max(4, Math.round((v / maxExpense.value) * 100))
}

function normalizeDailyRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows
    .map((r) => {
      const date = toYmdInLocalTime(r.date) || toYmd(r.date)
      if (!date) return null
      return {
        date,
        label: shortDayLabel(date),
        income: Number(r.income) || 0,
        expense: Number(r.expense) || 0,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function onDaySelect(i) {
  const pt = chartPoints.value[i]
  if (!pt?.date) return
  const query = { from: route.query.from || '/analytics' }
  query.island_scope = islandScopeQueryValue(islandScope.value)
  router.push({ name: 'AnalyticsDay', params: { date: pt.date }, query })
}

async function load() {
  if (!monthKey.value) {
    chartPoints.value = []
    return
  }
  loading.value = true
  const { startStr, endStr } = monthRangeFromYmd(monthKey.value)
  try {
    await loadCurrencyCode()
    const res = await getAnalyticsDaily(islandScope.value, startStr, endStr)
    const rows = Array.isArray(res?.data) ? res.data : res?.data?.daily || []
    chartPoints.value = normalizeDailyRows(rows)
  } catch (e) {
    console.error(e)
    chartPoints.value = []
    showToast('Failed to load month')
  } finally {
    loading.value = false
  }
}

async function onRefresh(ev) {
  await load()
  ev.target.complete()
}

watch(() => [route.params.ym, route.query.island_scope], load, { immediate: true })
</script>

<style scoped>
.page-inner {
  padding: 16px;
}

.totals {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.totals__item {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.totals__label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
}

.totals__label--income {
  color: #22c55e;
}

.totals__label--expense {
  color: #ef4444;
}

.totals__value {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.day-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.day-bar {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border: none;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  text-align: left;
}

.day-bar__label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
}

.day-bar__track {
  height: 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  overflow: hidden;
}

.day-bar__fill {
  display: block;
  height: 100%;
  border-radius: 4px;
}

.day-bar__fill--expense {
  background: linear-gradient(90deg, #ffb4a8, #ef4444);
}

.day-bar__amount {
  font-size: 12px;
  font-weight: 600;
  min-width: 56px;
  text-align: right;
}

.hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  text-align: center;
}

.empty {
  text-align: center;
  padding: 32px 16px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
