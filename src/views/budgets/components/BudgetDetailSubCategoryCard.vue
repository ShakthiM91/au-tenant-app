<template>
  <article class="sub-detail-card">
    <div class="sub-detail-card__header">
      <div class="sub-detail-card__title-block">
        <h4 class="sub-detail-card__title">{{ item.category_name }}</h4>
        <p v-if="entryCount != null" class="sub-detail-card__subtitle">{{ periodTypeLabel }} entries {{ entryCount }}</p>
      </div>
      <div class="sub-detail-card__this-month">
        <span class="sub-detail-card__metric-label">{{ periodLabel }}/ Total Planned</span>
        <span class="sub-detail-card__metric-value">
          <span class="amount-spent" :class="barToneClass(usagePct)">{{ formatAmount(item.actual) }}</span>
          <span v-if="hasBudget" class="amount-sep"> / </span>
          <span v-if="hasBudget" class="amount-total">{{ formatAmount(item.budget) }}</span>
        </span>
      </div>
      <BudgetViewTransactionsButton
        v-if="showViewTransactions"
        class="sub-detail-card__tx"
        @click="$emit('view-transactions', { item, level: 'leaf' })"
      />
      <button v-else type="button" class="sub-detail-card__menu" aria-label="Sub-category options" @click="$emit('menu', $event)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#A8A8A8">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
    </div>

    <div v-if="hasBudget" class="progress-track progress-track--sub-detail">
      <div
        class="progress-fill"
        :class="barToneClass(usagePct)"
        :style="{ width: `${Math.min(usagePct, 100)}%` }"
      />
    </div>

    <div class="sub-detail-card__metrics">
      <div class="sub-metric">
        <span class="sub-metric__label">This Year so far</span>
        <span class="sub-metric__value">{{ formatAmount(stats.ytd) }}</span>
      </div>
      <div class="sub-metric">
        <span class="sub-metric__label">Last month</span>
        <span class="sub-metric__value">{{ formatAmount(stats.lastMonth) }}</span>
      </div>
      <div class="sub-metric">
        <span class="sub-metric__label">Monthly Average</span>
        <span class="sub-metric__value">{{ formatAmount(stats.monthlyAvg) }}</span>
      </div>
      <!-- <div class="sub-metric">
        <span class="sub-metric__label">Monthly Projection</span>
        <span class="sub-metric__value">{{ formatAmount(stats.projected) }}</span>
      </div>
      <div class="sub-metric">
        <span class="sub-metric__label">Change %</span>
        <span class="sub-metric__value" :class="changePctClass">{{ formatSignedBudgetPct(stats.changePct) }}</span>
      </div> -->
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import {
  formatBudgetAmount,
  formatBudgetPeriodType,
  currentPeriodSpendLabel,
  formatSignedBudgetPct,
  buildCategoryDetailStats,
  barToneClass
} from '@/utils/budgetManagement'
import BudgetViewTransactionsButton from '@/views/budgets/components/BudgetViewTransactionsButton.vue'

const props = defineProps({
  item: { type: Object, required: true },
  periodReport: { type: Object, default: null },
  fullReport: { type: Object, default: null },
  periodType: { type: String, default: 'month' },
  entryCount: { type: Number, default: null },
  showViewTransactions: { type: Boolean, default: false }
})

defineEmits(['menu', 'view-transactions'])

const periodLabel = computed(() => currentPeriodSpendLabel(props.periodType))
const periodTypeLabel = computed(() => formatBudgetPeriodType(props.periodType))
const stats = computed(() => buildCategoryDetailStats(props.item, props.periodReport, props.fullReport))
const hasBudget = computed(() => (Number(props.item?.budget) || 0) > 0)
const usagePct = computed(() => {
  const b = Number(props.item?.budget) || 0
  if (b <= 0) return 0
  return ((Number(props.item?.actual) || 0) / b) * 100
})

const changePctClass = computed(() => {
  const n = Number(stats.value.changePct) || 0
  if (n > 0) return 'sub-metric__value--over'
  if (n < 0) return 'sub-metric__value--under'
  return ''
})

function formatAmount(val) {
  return formatBudgetAmount(val)
}
</script>

<style scoped>
.sub-detail-card {
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sub-detail-card + .sub-detail-card {
  margin-top: 10px;
}

.sub-detail-card__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  column-gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}

.sub-detail-card__title-block {
  min-width: 0;
}

.sub-detail-card__tx {
  align-self: center;
}

.sub-detail-card__title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  color: #1a1a2e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-detail-card__subtitle {
  margin: 1px 0 0;
  font-size: 9px;
  line-height: 1.3;
  color: rgba(0, 0, 0, 0.45);
}

.sub-detail-card__this-month {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.sub-detail-card__metric-label {
  font-size: 8px;
  line-height: 1.15;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
}

.sub-detail-card__metric-value {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.sub-detail-card__menu {
  justify-self: end;
  align-self: start;
  width: 24px;
  height: 24px;
  margin: -4px -4px 0 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;
}

.amount-spent {
  font-weight: 600;
}

.amount-spent.tone-ok {
  color: #52bf90;
}

.amount-spent.tone-warn {
  color: #ffcc00;
}

.amount-spent.tone-danger {
  color: #c30010bd;
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

.progress-track--sub-detail {
  height: 8px;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
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

.sub-detail-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}

.sub-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sub-metric__label {
  font-size: 10px;
  line-height: 1.15;
  color: rgba(0, 0, 0, 0.45);
}

.sub-metric__value {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  color: #1a1a2e;
  font-variant-numeric: tabular-nums;
}

.sub-metric__value--over {
  color: #d32f2f;
}

.sub-metric__value--under {
  color: #2d9d62;
}

@media (max-width: 639px) {
  .sub-detail-card__header {
    column-gap: 4px;
  }

  .sub-detail-card__title {
    font-size: 11px;
  }

  .sub-detail-card__metrics {
    gap: 2px;
  }

  .sub-metric__label {
    font-size: 6px;
  }

  .sub-metric__value {
    font-size: 8px;
  }
}
</style>
