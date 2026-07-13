<template>
  <ion-page class="analytics-day-page">
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
            <p class="totals__value">{{ formatAmount(dayIncome) }}</p>
          </div>
          <div class="totals__item">
            <span class="totals__label totals__label--expense">Expense</span>
            <p class="totals__value">{{ formatAmount(dayExpense) }}</p>
          </div>
        </div>

        <div v-if="loading" class="loading-wrap">
          <ion-spinner name="crescent" color="primary" />
        </div>

        <section v-else-if="list.length" class="txn-list">
          <article v-for="row in list" :key="row.id" class="txn-card">
            <button type="button" class="txn-card__main" @click="onRowClick(row)">
              <span class="txn-card__icon" :class="'txn-card__icon--' + (row.type || 'expense')">
                <ion-icon :icon="iconForType(row.type)" />
              </span>
              <span class="txn-card__info">
                <span class="txn-card__title">{{ row.title || row.transaction_number || '—' }}</span>
                <span class="txn-card__meta">{{ getCategoryLabel(row) }}</span>
              </span>
              <span class="txn-card__amount" :class="amountClass(row)">
                {{ amountPrefix(row) }}{{ formatAmount(row.amount, row.currency) }}
              </span>
            </button>
          </article>
        </section>

        <div v-else class="empty">No transactions on this day</div>
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
import { arrowDownOutline, arrowUpOutline, swapHorizontalOutline } from 'ionicons/icons'
import { getTransactions } from '@/api/accounting'
import { toYmd, pickerLabelFromYmd, dayQueryBounds } from '@/utils/expensePeriod'
import {
  parseIslandScopeFromQuery,
  transactionParamsForIslandScope,
} from '@/utils/analyticsIslandScope'
import { showToast } from '@/utils/ionicFeedback'
import { useAppCurrency } from '@/composables/useAppCurrency'

const route = useRoute()
const router = useRouter()
const { loadCurrencyCode, formatCurrency: formatAmount } = useAppCurrency()

const dateYmd = computed(() => toYmd(route.params.date))
const islandScope = computed(() => parseIslandScopeFromQuery(route.query))
const backHref = computed(() => {
  const from = route.query.from
  return typeof from === 'string' && from.startsWith('/') ? from : '/analytics'
})
const pageTitle = computed(() =>
  dateYmd.value ? pickerLabelFromYmd(dateYmd.value, { daily: true }) : 'Day'
)

const list = ref([])
const loading = ref(false)

const dayIncome = computed(() =>
  list.value.reduce((sum, row) => sum + (row.type === 'income' ? Number(row.amount) || 0 : 0), 0)
)
const dayExpense = computed(() =>
  list.value.reduce((sum, row) => sum + (row.type === 'expense' ? Number(row.amount) || 0 : 0), 0)
)

function iconForType(type) {
  if (type === 'income') return arrowDownOutline
  if (type === 'transfer') return swapHorizontalOutline
  return arrowUpOutline
}

function getCategoryLabel(row) {
  return row.category_name || row.category || '—'
}

function amountClass(row) {
  if (row.type === 'income') return 'txn-card__amount--income'
  if (row.type === 'transfer') return 'txn-card__amount--transfer'
  return 'txn-card__amount--expense'
}

function amountPrefix(row) {
  if (row.type === 'income') return '+'
  if (row.type === 'transfer') return ''
  return '−'
}

function onRowClick(row) {
  if (row?.id == null) return
  router.push(`/transactions/${row.id}`)
}

async function load() {
  if (!dateYmd.value) {
    list.value = []
    return
  }
  loading.value = true
  try {
    await loadCurrencyCode()
    const { startStr, endStr } = dayQueryBounds(dateYmd.value)
    const params = {
      ...transactionParamsForIslandScope(islandScope.value),
      start_date: startStr,
      end_date: endStr,
      limit: 200,
      offset: 0,
    }
    const res = await getTransactions(params)
    const rows = Array.isArray(res?.data) ? res.data : []
    list.value = rows.sort((a, b) => {
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

watch(() => [route.params.date, route.query.island_scope], load, { immediate: true })
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
  font-size: 17px;
  font-weight: 700;
  margin: 0;
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

.txn-card__icon--income {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.txn-card__icon--expense {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.txn-card__icon--transfer {
  background: rgba(255, 141, 40, 0.12);
  color: #ff8d28;
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

.txn-card__amount--income {
  color: #22c55e;
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
