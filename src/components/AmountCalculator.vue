<template>
  <ion-modal mode="ios"
    ref="modalRef"
    :is-open="visible"
    @didDismiss="onCancel"
    :initial-breakpoint="initialBreakpoint"
    :breakpoints="breakpoints"
    :handle="true"
  >
    <ion-header class="calc-ion-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button class="calc-cancel-btn" @click="onCancel">Cancel</ion-button>
        </ion-buttons>
        <ion-title>Add Amount</ion-title>
        <ion-buttons slot="end">
          <ion-button class="calc-ok-btn" @click="onConfirm">OK</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="calc-modal-content" :scroll-y="false">
      <div class="adaptive-sheet-body">
        <div v-if="hasBudget" class="budget-row">
          <div class="budget-cell">
            <span class="budget-label">Planned Budget</span>
            <span class="budget-val neutral">{{ fmtBudget(budget.monthly_limit) }}</span>
          </div>
          <div class="budget-cell">
            <span class="budget-label">Last Month</span>
            <span class="budget-val negative">{{ fmtBudget(budget.last_month_spent) }}</span>
          </div>
          <div class="budget-cell">
            <span class="budget-label">This Month</span>
            <span class="budget-val positive">{{ fmtBudget(budget.this_month_spent) }}</span>
          </div>
        </div>

        <div class="amount-input-row">
          <div class="amount-display">
            <span class="amount-currency">{{ currencyLabel }}</span>
            <span class="amount-expr">{{ displayExpr || '0' }}</span>
          </div>
          <button type="button" class="backspace-btn" aria-label="Backspace" @click="backspace">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
              <line x1="18" y1="9" x2="12" y2="15"/>
              <line x1="12" y1="9" x2="18" y2="15"/>
            </svg>
          </button>
        </div>

        <div class="keypad">
          <button type="button" class="key" @click="input('1')">1</button>
          <button type="button" class="key" @click="input('2')">2</button>
          <button type="button" class="key" @click="input('3')">3</button>
          <button type="button" class="key key-fn" @click="clear">C</button>

          <button type="button" class="key" @click="input('4')">4</button>
          <button type="button" class="key" @click="input('5')">5</button>
          <button type="button" class="key" @click="input('6')">6</button>
          <button type="button" class="key key-op" @click="input('*')">X</button>

          <button type="button" class="key" @click="input('7')">7</button>
          <button type="button" class="key" @click="input('8')">8</button>
          <button type="button" class="key" @click="input('9')">9</button>
          <button type="button" class="key key-op" @click="input('+')">+</button>

          <button type="button" class="key" @click="input('00')">00</button>
          <button type="button" class="key" @click="input('0')">0</button>
          <button type="button" class="key" @click="input('000')">000</button>
          <button type="button" class="key key-op" @click="input('-')">−</button>

          <button type="button" class="key key-op" @click="input('%')">%</button>
          <button type="button" class="key key-op" @click="input('/')">/</button>
          <button type="button" class="key key-op" @click="input('.')">.</button>
          <button type="button" class="key key-op key-eq" @click="onEquals">=</button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { IonModal, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/vue'
import { useIonSheetHeight } from '@/composables/useIonSheetHeight'

const props = defineProps({
  visible: { type: Boolean, default: false },
  modelValue: { type: [Number, String], default: 0 },
  currency: { type: String, default: 'USD' },
  budget: { type: Object, default: null }
  // budget shape: { monthly_limit, last_month_spent, this_month_spent, currency_code }
})

const emit = defineEmits(['update:modelValue', 'close', 'select'])

const expr = ref('')

const hasBudget = computed(() =>
  props.budget &&
  (props.budget.monthly_limit != null || props.budget.last_month_spent != null)
)

const SHEET_HEIGHT_NO_BUDGET_PCT = 58
const SHEET_HEIGHT_WITH_BUDGET_PCT = 68

const sheetHeightPct = computed(() =>
  hasBudget.value ? SHEET_HEIGHT_WITH_BUDGET_PCT : SHEET_HEIGHT_NO_BUDGET_PCT
)

const { modalRef, breakpoints, initialBreakpoint } = useIonSheetHeight(
  () => props.visible,
  () => sheetHeightPct.value
)

watch(() => props.visible, (v) => {
  if (v) {
    const val = Number(props.modelValue)
    expr.value = val > 0 ? String(val) : ''
  }
})

const currencyLabel = computed(() => {
  const code = props.currency || 'USD'
  if (code === 'LKR') return 'Rs'
  if (code === 'USD') return '$'
  return code
})

const displayExpr = computed(() => expr.value.replace(/\*/g, 'X'))

function currencyPrefix(code) {
  if (!code) return ''
  if (code === 'LKR') return 'Rs.'
  if (code === 'USD') return '$'
  return code
}

function fmtBudget(val) {
  if (val == null) return '—'
  const code = props.budget?.currency_code || props.currency
  const prefix = currencyPrefix(code)
  const num = Number(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return prefix ? `${prefix} ${num}` : num
}

function isOperator(ch) { return ['+', '-', '*', '/'].includes(ch) }

function lastChar() { return expr.value.slice(-1) }

function input(ch) {
  const ops = ['+', '-', '*', '/', '%']

  if (ops.includes(ch)) {
    if (isOperator(lastChar())) {
      expr.value = expr.value.slice(0, -1) + ch
    } else if (expr.value) {
      expr.value += ch
    }
    return
  }

  if (ch === '.') {
    const parts = expr.value.split(/[+\-*/]/)
    const last = parts[parts.length - 1]
    if (last.includes('.')) return
    expr.value += expr.value === '' ? '0.' : '.'
    return
  }

  if (ch === '00' || ch === '000') {
    if (!expr.value || expr.value === '0') return
    expr.value += ch
    return
  }

  const parts = expr.value.split(/[+\-*/]/)
  const last = parts[parts.length - 1]
  if (last === '0' && ch !== '.') {
    expr.value = expr.value.slice(0, -1) + ch
    return
  }

  expr.value += ch
}

function backspace() {
  expr.value = expr.value.slice(0, -1)
}

function clear() {
  expr.value = ''
}

function evaluate() {
  if (!expr.value) return 0
  try {
    const safe = expr.value.replace(/[^0-9+\-*/.%()]/g, '')
    const withPct = safe.replace(/(\d+(\.\d+)?)%/g, '($1/100)')
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${withPct})`)()
    return Number.isFinite(result) ? Math.round(result * 100) / 100 : 0
  } catch {
    return 0
  }
}

function resolvedAmount() {
  if (/[-+*/%]/.test(expr.value)) return evaluate()
  const n = Number(expr.value)
  return Number.isFinite(n) ? n : 0
}

function onEquals() {
  const val = evaluate()
  expr.value = val > 0 ? String(val) : (val === 0 ? '0' : '')
}

function onConfirm() {
  const val = resolvedAmount()
  emit('update:modelValue', val)
  emit('select', val)
  emit('close')
}

function onCancel() {
  emit('close')
}
</script>

<style scoped>
.calc-modal-content {
  --background: #ffffff;
  --padding-top: 0;
  --padding-bottom: 0;
}

.adaptive-sheet-body {
  min-height: 0;
  padding: 4px 16px 8px;
}

.calc-ion-header {
  margin: 0;
}

.calc-ion-header ion-toolbar {
  --border-width: 0 0 1px 0;
  --border-color: rgba(168, 168, 168, 0.35);
}

.calc-cancel-btn {
  --color: #6e6a7c;
  font-weight: 500;
}

.calc-ok-btn {
  --color: #ff8d28;
  font-weight: 600;
}

.budget-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  padding: 12px 0 14px;
  border-bottom: 1px solid rgba(168, 168, 168, 0.25);
}

.budget-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.budget-label {
  font-size: 12px;
  color: #a8a8a8;
  text-align: center;
}

.budget-val {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.budget-val.neutral { color: #1a1a2e; }
.budget-val.negative { color: #e05050; }
.budget-val.positive { color: #52bf90; }

.amount-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.amount-display {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1.5px solid #ff8d28;
  border-radius: 10px;
  padding: 12px 14px;
  min-height: 52px;
}

.amount-currency {
  font-size: 16px;
  color: #a8a8a8;
  flex-shrink: 0;
}

.amount-expr {
  flex: 1;
  text-align: right;
  font-size: 26px;
  font-weight: 400;
  color: #1a1a2e;
  word-break: break-all;
  line-height: 1.2;
}

.backspace-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  background: none;
  color: #1a1a2e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.backspace-btn:active {
  opacity: 0.65;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px 0;
}

.key {
  aspect-ratio: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  font-size: 24px;
  font-weight: 300;
  color: #1a1a2e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.key:active {
  background: rgba(0, 0, 0, 0.05);
}

.key-fn,
.key-op {
  color: #ff8d28;
  font-weight: 400;
}

.key-eq {
  font-size: 28px;
  font-weight: 300;
}
</style>
