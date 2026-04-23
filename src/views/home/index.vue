<template>
  <ion-page class="home-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="home-wrap">
        <header class="greeting-header">
          <span class="greeting-text">Hi, {{ greetingName }} 👋</span>
        </header>

        <section class="banner-section">
          <div class="banner-scroll" @scroll="onBannerScroll">
            <div
              class="banner-slide banner-slide--photo"
              :style="{ backgroundImage: `url(${bannerPhotoUrl})` }"
              role="img"
              aria-label="Lifestyle banner"
            />
            <div
              v-for="(bg, idx) in bannerGradients"
              :key="idx"
              class="banner-slide"
              :style="{ background: bg }"
            />
          </div>
          <div class="banner-dots" aria-hidden="true">
            <span
              v-for="i in 3"
              :key="'d' + i"
              class="dot"
              :class="{ active: bannerIndex === i - 1 }"
            />
          </div>
        </section>

        <section class="quick-actions">
          <div class="qa-grid">
            <button
              v-for="item in quickActionsRow1"
              :key="item.label"
              type="button"
              class="qa-item"
            >
              <div class="qa-icon-wrap">
                <ion-icon :icon="item.icon" class="qa-icon" aria-hidden="true" />
              </div>
              <span class="qa-label">{{ item.label }}</span>
            </button>
          </div>
          <div class="qa-grid">
            <button
              v-for="item in quickActionsRow2"
              :key="item.label"
              type="button"
              class="qa-item"
            >
              <div class="qa-icon-wrap">
                <ion-icon :icon="item.icon" class="qa-icon" aria-hidden="true" />
              </div>
              <span class="qa-label">{{ item.label }}</span>
            </button>
          </div>
        </section>

        <section class="card list-card">
          <h2 class="card-heading">Recent Activity</h2>
          <div v-if="recentActivityLoading" class="recent-loading">
            <ion-spinner name="crescent" />
          </div>
          <div v-else-if="!recentActivityRows.length" class="recent-empty">
            No recent transactions
          </div>
          <div v-else class="list-body">
            <button
              v-for="row in recentActivityRows"
              :key="row.id"
              type="button"
              class="activity-row activity-row--clickable"
              @click="openTransaction(row)"
            >
              <div class="activity-left">
                <p class="activity-title">{{ row.title }}</p>
                <div class="activity-meta">
                  <ion-icon :icon="personOutline" class="meta-user-icon" />
                  <span class="meta-text">{{ row.meta }}</span>
                </div>
              </div>
              <div class="activity-right">
                <span class="amount" :class="row.amountClass">{{ row.amount }}</span>
                <span class="sub">{{ row.sub }}</span>
              </div>
            </button>
          </div>
        </section>

        <section class="card list-card recurring-card">
          <h2 class="card-heading">Recurring Transactions</h2>
          <div v-if="recurringLoading" class="recent-loading">
            <ion-spinner name="crescent" />
          </div>
          <div v-else-if="!recurringRows.length" class="recent-empty">No upcoming repayments</div>
          <div v-else class="list-body">
            <button
              v-for="row in recurringRows"
              :key="row.id"
              type="button"
              class="activity-row activity-row--clickable"
              @click="openRecurring(row)"
            >
              <div class="activity-left">
                <p class="activity-title">{{ row.title }}</p>
                <p class="recurring-sub">{{ row.via }}</p>
              </div>
              <div class="activity-right align-end">
                <span class="amount recurring-amt" :class="row.amountClass">{{ row.amount }}</span>
                <span class="sub" :class="row.dueClass">{{ row.due }}</span>
              </div>
            </button>
          </div>
          <p v-if="recurringFooterText" class="recurring-footer">{{ recurringFooterText }}</p>
        </section>

        <!-- Hidden for now — re-enable with kryptonites / goals script data below
        <section class="card insight-card">
          <h2 class="insight-title">My Kryptonites 💉</h2>
          <div class="insight-body">
            <div v-for="k in kryptonites" :key="k.name" class="insight-block">
              <div class="insight-top">
                <div class="insight-name-block">
                  <span class="insight-name">{{ k.name }}</span>
                  <span class="insight-entries">{{ k.entries }}</span>
                </div>
                <div class="insight-mid-stats">
                  <div class="mini-stat">
                    <span class="mini-label">Average</span>
                    <span class="mini-val">{{ k.avg }}</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-label">Projected</span>
                    <span class="mini-val">{{ k.proj }}</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-label">This Year</span>
                    <span class="mini-val">{{ k.year }}</span>
                  </div>
                </div>
                <div class="insight-pct-wrap">
                  <div class="ring" :style="{ '--p': k.pct }">
                    <span>{{ k.pct }}%</span>
                  </div>
                  <div class="month-mini">
                    <span class="mini-label">This month</span>
                    <span class="month-ratio">{{ k.monthRatio }}</span>
                  </div>
                </div>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: k.barPct + '%', background: k.barColor }" />
              </div>
            </div>
          </div>
        </section>

        <section class="card insight-card">
          <h2 class="insight-title">My Goals 🎯</h2>
          <div class="insight-body">
            <div v-for="g in goals" :key="g.title" class="insight-block goal-block">
              <div class="insight-top">
                <div class="insight-name-block">
                  <span class="insight-name">{{ g.title }}</span>
                  <span class="insight-entries">{{ g.subtitle }}</span>
                </div>
                <div class="insight-mid-stats goal-mid">
                  <div class="mini-stat">
                    <span class="mini-label">Last Month</span>
                    <span class="mini-val">{{ g.lm }}</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-label">Average</span>
                    <span class="mini-val">{{ g.avg }}</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-label">Required</span>
                    <span class="mini-val">{{ g.req }}</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-label">Last Month</span>
                    <span class="mini-val">{{ g.lm2 }}</span>
                  </div>
                </div>
                <div class="insight-pct-wrap">
                  <div class="ring" :style="{ '--p': g.pct }">
                    <span>{{ g.pct }}%</span>
                  </div>
                  <div class="month-mini">
                    <span class="mini-label">Goal</span>
                    <span class="month-ratio">{{ g.goalRatio }}</span>
                  </div>
                </div>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: g.barPct + '%', background: g.barColor }" />
              </div>
            </div>
          </div>
        </section>
        -->
      </div>

      <div class="tab-spacer" />
    </ion-content>

    <FloatingAddButton @select="onFabSelect" />
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon, IonSpinner, onIonViewDidEnter } from '@ionic/vue'
import {
  cashOutline,
  barChartOutline,
  createOutline,
  peopleOutline,
  schoolOutline,
  businessOutline,
  headsetOutline,
  searchOutline,
  scanOutline,
  settingsOutline,
  personOutline,
} from 'ionicons/icons'
import FloatingAddButton from '@/components/FloatingAddButton.vue'
import { getRecentTransactions, getUpcomingRepayments } from '@/api/accounting'
import { getTenantDefaultCurrency } from '@/api/currency'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const bannerIndex = ref(0)

const greetingName = computed(() => {
  const n = (userStore.name || '').trim()
  return n || 'User'
})

const defaultCurrency = ref({ code: 'USD' })
const recentActivityLoading = ref(true)
const recentTransactions = ref([])
const recurringLoading = ref(true)
const recurringSchedules = ref([])
const recurringMonthTotals = ref([])

const recentActivityRows = computed(() =>
  recentTransactions.value.map((row) => ({
    id: row.id,
    title: (row.title || row.transaction_number || 'Transaction').toString().trim() || 'Transaction',
    meta: `${getUserLabel(row)} at ${formatTime(row.transaction_date)}`,
    amount: formatAmountHome(row),
    sub: accountSubLabel(row),
    amountClass:
      row.type === 'income' ? 'income' : row.type === 'transfer' ? 'transfer' : 'expense',
  }))
)

const recurringRows = computed(() =>
  recurringSchedules.value.map((s) => {
    const due = formatDueRelative(s.next_due_date)
    const cur = s.account_currency || defaultCurrency.value?.code || 'USD'
    const n = Math.abs(Number(s.amount_due) || 0)
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 2,
    }).format(n)
    return {
      id: s.id,
      accountId: s.account_id,
      title: (s.account_name || 'Account').toString(),
      via: scheduleSubtitle(s),
      amount: formatted,
      due: due.text,
      dueClass: due.warn ? 'due-warn' : '',
      amountClass: due.warn ? 'expense' : '',
    }
  })
)

const recurringFooterText = computed(() => {
  const totals = (recurringMonthTotals.value || []).filter((t) => Number(t.total) > 0)
  if (!totals.length) return ''
  if (totals.length === 1) {
    const { currency, total } = totals[0]
    const cur = currency || 'USD'
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 2,
    }).format(Number(total) || 0)
    return `${formatted} due this month`
  }
  return 'Repayments due in multiple currencies this month'
})

function getUserLabel(row) {
  return row.created_by_name || row.user_name || 'Me'
}

function formatTime(s) {
  if (!s) return '—'
  const d = new Date(String(s).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return '—'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatAmountHome(row) {
  const cur = row.currency || defaultCurrency.value?.code || 'USD'
  const n = Math.abs(Number(row.amount) || 0)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 2,
  }).format(n)
  if (row.type === 'transfer') return `→ ${formatted}`
  return formatted
}

function accountSubLabel(row) {
  if (row.type === 'transfer') {
    const from = row.account_name || '—'
    const to = row.to_account_name || '—'
    return `${from} → ${to}`
  }
  return row.account_name || row.category_name || '—'
}

function parseYmd(s) {
  if (!s) return null
  const str = String(s).slice(0, 10)
  const parts = str.split('-').map(Number)
  if (parts.length < 3) return null
  const [y, m, d] = parts
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function startOfTodayLocal() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function formatDueRelative(isoDate) {
  const d = parseYmd(isoDate)
  if (!d || Number.isNaN(d.getTime())) return { text: '—', warn: false }
  const today = startOfTodayLocal()
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) {
    const n = Math.abs(diffDays)
    return {
      text: n === 1 ? 'Due yesterday' : `Due ${n} days ago`,
      warn: true,
    }
  }
  if (diffDays === 0) return { text: 'Due today', warn: true }
  if (diffDays === 1) return { text: 'Due tomorrow', warn: false }
  return { text: `Due in ${diffDays} days`, warn: false }
}

function repaymentIntervalLabel(s) {
  if (s.schedule_type === 'custom_date') return 'One-off'
  switch (s.interval_type) {
    case 'weekly':
      return 'Weekly'
    case 'bi_weekly':
      return 'Bi-weekly'
    case 'monthly':
      return 'Monthly'
    case 'quarterly':
      return 'Quarterly'
    case 'yearly':
      return 'Yearly'
    default:
      return ''
  }
}

function formatAccountTypeLabel(t) {
  if (!t) return ''
  return String(t).replace(/_/g, ' ')
}

function scheduleSubtitle(s) {
  const interval = repaymentIntervalLabel(s)
  const typeLabel = formatAccountTypeLabel(s.account_type)
  if (interval && typeLabel) return `${interval} · ${typeLabel}`
  return interval || typeLabel || 'Repayment'
}

async function loadDefaultCurrency() {
  try {
    const r = await getTenantDefaultCurrency()
    const c = r?.data?.data ?? r?.data
    if (c?.code) defaultCurrency.value = c
  } catch (_) {}
}

async function loadHomeData() {
  recentActivityLoading.value = true
  recurringLoading.value = true
  try {
    await loadDefaultCurrency()
    const [recentRes, recurRes] = await Promise.all([
      getRecentTransactions(5),
      getUpcomingRepayments(5),
    ])
    const recentRows = recentRes?.data
    recentTransactions.value = Array.isArray(recentRows) ? recentRows : []
    const payload = recurRes?.data
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      recurringSchedules.value = Array.isArray(payload.schedules) ? payload.schedules : []
      recurringMonthTotals.value = Array.isArray(payload.month_totals) ? payload.month_totals : []
    } else {
      recurringSchedules.value = []
      recurringMonthTotals.value = []
    }
  } catch (_) {
    recentTransactions.value = []
    recurringSchedules.value = []
    recurringMonthTotals.value = []
  } finally {
    recentActivityLoading.value = false
    recurringLoading.value = false
  }
}

function openTransaction(row) {
  if (row?.id == null) return
  router.push(`/transactions/${row.id}`)
}

function openRecurring(row) {
  if (row?.accountId == null) return
  router.push({ name: 'AccountFlowLog', params: { id: String(row.accountId) } })
}

onIonViewDidEnter(() => {
  loadHomeData()
})

/** First carousel slide uses `public/home-banner-1.png`; these are slides 2–3. */
const bannerPhotoUrl = `${import.meta.env.BASE_URL}home-banner-1.png`

const bannerGradients = [
  'linear-gradient(135deg, #e7ecf7 0%, #b8cff7 45%, #6a8fce 100%)',
  'linear-gradient(135deg, #d4f5e8 0%, #9ee5c8 50%, #52bf90 100%)',
]

const quickActionsRow1 = [
  { label: 'Account\nBudget', icon: cashOutline },
  { label: 'Account\nAnalytics', icon: barChartOutline },
  { label: 'Daily Check\nin', icon: createOutline },
  { label: 'Invite a\nFriend', icon: peopleOutline },
  { label: 'Rupee\nGuide', icon: schoolOutline },
]

const quickActionsRow2 = [
  { label: 'About\nus', icon: businessOutline },
  { label: 'Reach\nus', icon: headsetOutline },
  { label: 'Explore\nPlans', icon: searchOutline },
  { label: 'My\nProfile', icon: scanOutline },
  { label: 'Settings', icon: settingsOutline },
]

/*
const kryptonites = [
  {
    name: 'Snacks',
    entries: '15 Entries',
    avg: '866',
    proj: '1500',
    year: '5900',
    pct: 70,
    monthRatio: '1,126 / 700',
    barPct: 100,
    barColor: 'rgba(196, 0, 16, 0.74)',
  },
  {
    name: 'Smoking',
    entries: '1 Entries',
    avg: '9140',
    proj: '300',
    year: '36,000',
    pct: 70,
    monthRatio: '150 / 3000',
    barPct: 5,
    barColor: '#52bf90',
  },
  {
    name: 'Eating Out',
    entries: '8 Entries',
    avg: '21,450',
    proj: '15,683',
    year: '95,000',
    pct: 70,
    monthRatio: '17,150 / 20,000',
    barPct: 86,
    barColor: 'rgba(196, 0, 16, 0.74)',
  },
]

const goals = [
  {
    title: 'Pay off House',
    subtitle: '988 Days Left',
    lm: '54,188',
    avg: '36,866',
    req: '51,616',
    lm2: '5900',
    pct: 70,
    goalRatio: '100,126 / 1,800,000',
    barPct: 5,
    barColor: 'rgba(196, 0, 16, 0.74)',
  },
  {
    title: 'Maldives 🐚',
    subtitle: '154 Days Left',
    lm: '31,117',
    avg: '16,976',
    req: '73,835',
    lm2: '5900',
    pct: 70,
    goalRatio: '320,981 / 700,000',
    barPct: 46,
    barColor: 'rgba(255, 141, 40, 0.75)',
  },
  {
    title: 'Emergency Fund',
    subtitle: '8 Days Left',
    lm: '90,000',
    avg: '36,616',
    req: '38,112',
    lm2: '5900',
    pct: 70,
    goalRatio: '961,888 / 1,000,000',
    barPct: 96,
    barColor: '#52bf90',
  },
]
*/

function onBannerScroll(e) {
  const el = e.target
  const w = el.clientWidth || 1
  const i = Math.round(el.scrollLeft / w)
  bannerIndex.value = Math.min(2, Math.max(0, i))
}

function onFabSelect(type) {
  router.push(`/transactions/create?type=${type}`)
}
</script>

<style scoped>
.home-page {
  --background: #ffffff;
}

.home-page ion-content {
  --background: #ffffff;
}

.home-wrap {
  padding: 0 22px;
  padding-top: max(8px, env(safe-area-inset-top));
  padding-bottom: 8px;
}

.greeting-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0 14px;
}

.greeting-text {
  font-size: 18px;
  font-weight: 700;
  color: #000;
}

.banner-section {
  margin-bottom: 15px;
}

.banner-scroll {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  border-radius: 20px;
  scrollbar-width: none;
  gap: 0;
}

.banner-scroll::-webkit-scrollbar {
  display: none;
}

.banner-slide {
  flex: 0 0 100%;
  width: 100%;
  min-height: 160px;
  scroll-snap-align: start;
  border-radius: 20px;
}

.banner-slide--photo {
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
}

.banner-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 11px;
}

.dot {
  height: 5px;
  border-radius: 100px;
  background: #d8d8d8;
  width: 10px;
  transition: width 0.2s ease, opacity 0.2s ease;
}

.dot.active {
  width: 26px;
  background: rgba(255, 141, 40, 0.75);
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.qa-grid {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.qa-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.qa-icon-wrap {
  width: 54px;
  height: 54px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 2px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qa-icon {
  font-size: 28px;
  color: #33353f;
}

.qa-label {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  color: #061737;
  white-space: pre-line;
  max-width: 56px;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.16);
  padding: 10px 10px 12px;
  margin-bottom: 15px;
}

.card-heading {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.72);
}

.list-body {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.activity-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
  padding: 4px 5px;
}

.activity-left {
  flex: 1;
  min-width: 0;
}

.activity-title {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.72);
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 3px;
}

.meta-user-icon {
  font-size: 13px;
  color: #ff8d28;
}

.meta-text {
  font-size: 13px;
  color: #000;
}

.activity-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.activity-right.align-end {
  align-items: flex-end;
}

.amount {
  font-size: 15px;
  font-weight: 600;
}

.amount.expense {
  color: rgba(196, 0, 16, 0.74);
}

.amount.income {
  color: #52bf90;
}

.amount.transfer {
  color: rgba(0, 0, 0, 0.72);
}

.recent-loading {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.recent-empty {
  text-align: center;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  padding: 16px 8px;
}

.activity-row--clickable {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
  padding: 4px 5px;
  margin: 0;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  font: inherit;
  color: inherit;
}

.activity-row--clickable:active {
  background: rgba(0, 0, 0, 0.04);
}

.recurring-amt {
  color: rgba(0, 0, 0, 0.72);
}

.sub {
  font-size: 13px;
  color: #a8a8a8;
  margin-top: 3px;
}

.recurring-sub {
  margin: 3px 0 0;
  font-size: 13px;
  color: #a8a8a8;
}

.due-warn {
  color: rgba(196, 0, 16, 0.74) !important;
}

.recurring-footer {
  margin: 10px 0 0;
  text-align: center;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.72);
}

/*
.insight-card {
  border-radius: 13px;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.16);
  padding: 10px 12px 16px;
}

.insight-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
  color: #000;
}

.insight-body {
  display: flex;
  flex-direction: column;
  gap: 23px;
}

.insight-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.insight-top {
  display: grid;
  grid-template-columns: minmax(52px, 1fr) minmax(0, 1.4fr) auto;
  gap: 8px;
  align-items: start;
}

.insight-name-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.insight-name {
  font-size: 12px;
  font-weight: 600;
  color: #24262c;
}

.insight-entries {
  font-size: 8px;
  color: #6e6a7c;
  line-height: 1.2;
}

.insight-mid-stats {
  display: flex;
  gap: 14px;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.goal-mid {
  gap: 10px;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 30px;
}

.mini-label {
  font-size: 8px;
  color: #6e6a7c;
}

.mini-val {
  font-size: 12px;
  font-weight: 600;
  color: #24262c;
}

.insight-pct-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.ring {
  --p: 70;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: conic-gradient(
    #6a8fce calc(var(--p) * 1%),
    #e7ecf7 0
  );
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 700;
  color: #24262c;
  position: relative;
}

.ring::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: #fff;
  z-index: 0;
}

.ring span {
  position: relative;
  z-index: 1;
}

.month-mini {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.month-ratio {
  font-size: 9px;
  color: #a8a8a8;
  white-space: nowrap;
}

.bar-track {
  height: 6px;
  border-radius: 40px;
  background: #dedede;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 20px;
}
*/

.tab-spacer {
  height: 88px;
}
</style>
