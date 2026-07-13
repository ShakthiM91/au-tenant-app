<template>
  <ion-page class="pattern-detail-page">
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
        <p class="note">{{ periodLabel }}</p>

        <section class="summary">
          <span class="summary__label">Total expense</span>
          <p class="summary__value">{{ formatAmount(totalExpense) }}</p>
          <p class="summary__meta">{{ list.length }} transaction{{ list.length === 1 ? '' : 's' }}</p>
        </section>

        <div v-if="loading" class="loading-wrap">
          <ion-spinner name="crescent" color="primary" />
        </div>

        <section v-else-if="list.length" class="txn-list">
          <article v-for="row in list" :key="row.id" class="txn-card">
            <button type="button" class="txn-card__main" @click="onRowClick(row)">
              <span class="txn-card__icon txn-card__icon--expense">
                <ion-icon :icon="arrowUpOutline" />
              </span>
              <span class="txn-card__info">
                <span class="txn-card__title">{{ row.title || row.transaction_number || '—' }}</span>
                <span class="txn-card__meta">
                  {{ formatTxnDate(row.transaction_date) }} · {{ getCategoryLabel(row) }}
                </span>
              </span>
              <span class="txn-card__amount txn-card__amount--expense">
                −{{ formatAmount(row.amount, row.currency) }}
              </span>
            </button>
          </article>
        </section>

        <div v-else class="empty">No transactions for this pattern in this period</div>
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
  IonIcon,
} from '@ionic/vue'
import { arrowUpOutline } from 'ionicons/icons'
import { getTransactions } from '@/api/accounting'
import { pickerLabelFromYmd, periodQueryBounds, transactionInPeriod } from '@/utils/expensePeriod'
import {
  parseIslandScopeFromQuery,
  transactionParamsForIslandScope,
} from '@/utils/analyticsIslandScope'
import { isCompletedTransaction } from '@/utils/categoryScope'
import { transactionMatchesWeekday, transactionMatchesDayOfMonth } from '@/utils/reportDrillDown'
import { showToast } from '@/utils/ionicFeedback'
import { useAppCurrency } from '@/composables/useAppCurrency'

const route = useRoute()
const router = useRouter()
const { loadCurrencyCode, formatCurrency: formatAmount } = useAppCurrency()

const pattern = computed(() => {
  const p = route.query.pattern
  return p === 'dom' ? 'dom' : p === 'weekday' ? 'weekday' : null
})

const patternValue = computed(() => {
  const n = Number(route.query.value)
  return Number.isFinite(n) ? n : null
})

const islandScope = computed(() => parseIslandScopeFromQuery(route.query))

const backHref = computed(() => {
  const from = route.query.from
  return typeof from === 'string' && from.startsWith('/') ? from : '/analytics'
})

const pageTitle = computed(() => {
  const label = route.query.label
  if (typeof label === 'string' && label.trim()) return label.trim()
  if (pattern.value === 'weekday') return 'Weekday expenses'
  if (pattern.value === 'dom') return 'Day-of-month expenses'
  return 'Pattern expenses'
})

const reportDateRange = computed(() => {
  const s = route.query.start_date
  const e = route.query.end_date
  if (typeof s === 'string' && s && typeof e === 'string' && e) {
    return { startStr: s, endStr: e }
  }
  return { startStr: '', endStr: '' }
})

const periodLabel = computed(() => {
  const { startStr, endStr } = reportDateRange.value
  if (!startStr || !endStr) return 'This period'
  const a = pickerLabelFromYmd(startStr, { daily: true })
  const b = pickerLabelFromYmd(endStr, { daily: true })
  return a === b ? a : `${a} – ${b}`
})

const list = ref([])
const loading = ref(false)

const totalExpense = computed(() =>
  list.value.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
)

function formatTxnDate(s) {
  if (!s) return '—'
  const d = new Date(String(s).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return String(s).slice(0, 10)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function getCategoryLabel(row) {
  return row.category_name || row.category || '—'
}

function onRowClick(row) {
  if (row?.id == null) return
  router.push(`/transactions/${row.id}`)
}

function matchesPattern(row) {
  if (pattern.value === 'weekday') {
    return transactionMatchesWeekday(row, patternValue.value)
  }
  if (pattern.value === 'dom') {
    return transactionMatchesDayOfMonth(row, patternValue.value)
  }
  return false
}

async function load() {
  if (!pattern.value || patternValue.value == null) {
    list.value = []
    return
  }
  loading.value = true
  try {
    await loadCurrencyCode()
    const { startStr: startYmd, endStr: endYmd } = reportDateRange.value
    const { startStr, endStr } = periodQueryBounds(startYmd, endYmd)
    const params = {
      ...transactionParamsForIslandScope(islandScope.value),
      type: 'expense',
      start_date: startStr,
      end_date: endStr,
      limit: 1000,
      offset: 0,
    }
    const res = await getTransactions(params)
    const rows = Array.isArray(res?.data) ? res.data : []
    list.value = rows
      .filter((row) => row.type === 'expense')
      .filter(isCompletedTransaction)
      .filter((row) => transactionInPeriod(row, startYmd, endYmd))
      .filter(matchesPattern)
      .sort((a, b) => {
        const da = String(a.transaction_date || '').replace(' ', 'T')
        const db = String(b.transaction_date || '').replace(' ', 'T')
        return new Date(db) - new Date(da)
      })
  } catch (e) {
    console.error(e)
    list.value = []
    showToast('Failed to load transactions')
  } finally {
    loading.value = false
  }
}

async function onRefresh(ev) {
  await load()
  ev.target.complete()
}

watch(
  () => [
    route.query.pattern,
    route.query.value,
    route.query.start_date,
    route.query.end_date,
    route.query.island_scope,
  ],
  load,
  { immediate: true }
)
</script>

<style scoped>
.page-inner {
  padding: 16px;
}

.note {
  margin: 0 0 12px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.summary {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.summary__label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.55);
}

.summary__value {
  font-size: 22px;
  font-weight: 700;
  margin: 6px 0 4px;
  color: #ef4444;
}

.summary__meta {
  margin: 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.txn-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.txn-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.txn-card__main {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.txn-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
}

.txn-card__icon--expense {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.txn-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.txn-card__title {
  font-size: 15px;
  font-weight: 600;
}

.txn-card__meta {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.txn-card__amount {
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
}

.txn-card__amount--expense {
  color: #ef4444;
}

.empty {
  text-align: center;
  padding: 32px 16px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
