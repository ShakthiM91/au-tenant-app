<template>
  <Teleport to="ion-app">
    <Transition name="sheet-up">
      <div v-if="visible" class="calc-backdrop" @click="onCancel">
        <div class="calc-sheet" @click.stop>
          <div class="drag-handle" />
          <div class="calc-title">Add Amount</div>

          <!-- Budget context (only if data is available) -->
          <div v-if="hasBudget" class="budget-row">
            <div class="budget-cell">
              <span class="budget-label">Monthly Budget</span>
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

          <!-- Amount display -->
          <div class="amount-display">
            <span class="amount-expr">{{ displayExpr || '0' }}</span>
            <span class="amount-currency">{{ currency }}</span>
          </div>

          <!-- Keypad -->
          <div class="keypad">
            <button class="key" @click="input('1')">1</button>
            <button class="key" @click="input('2')">2</button>
            <button class="key" @click="input('3')">3</button>
            <button class="key key-fn" @click="clear">C</button>

            <button class="key" @click="input('4')">4</button>
            <button class="key" @click="input('5')">5</button>
            <button class="key" @click="input('6')">6</button>
            <button class="key key-fn" @click="backspace">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
              </svg>
            </button>

            <button class="key" @click="input('7')">7</button>
            <button class="key" @click="input('8')">8</button>
            <button class="key" @click="input('9')">9</button>
            <button class="key key-op" @click="input('+')">+</button>

            <button class="key" @click="input('.')">.</button>
            <button class="key" @click="input('0')">0</button>
            <button class="key" @click="input('00')">00</button>
            <button class="key key-op" @click="input('-')">−</button>

            <button class="key key-op" @click="input('*')">×</button>
            <button class="key key-op" @click="input('%')">%</button>
            <button class="key key-op" @click="input('/')">÷</button>
            <button class="key key-eq" @click="onConfirm">=</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  modelValue: { type: [Number, String], default: 0 },
  currency: { type: String, default: 'USD' },
  budget: { type: Object, default: null }
  // budget shape: { monthly_limit, last_month_spent, this_month_spent, currency_code }
})

const emit = defineEmits(['update:modelValue', 'close', 'select'])

const expr = ref('')

watch(() => props.visible, (v) => {
  if (v) {
    const val = Number(props.modelValue)
    expr.value = val > 0 ? String(val) : ''
  }
})

const hasBudget = computed(() =>
  props.budget &&
  (props.budget.monthly_limit != null || props.budget.last_month_spent != null)
)

const displayExpr = computed(() => expr.value)

function fmtBudget(val) {
  if (val == null) return '—'
  return `${props.budget?.currency_code || props.currency} ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function isOperator(ch) { return ['+', '-', '*', '/'].includes(ch) }

function lastChar() { return expr.value.slice(-1) }

function input(ch) {
  const ops = ['+', '-', '*', '/', '%']

  if (ops.includes(ch)) {
    // Don't allow two consecutive operators
    if (isOperator(lastChar())) {
      expr.value = expr.value.slice(0, -1) + ch
    } else if (expr.value) {
      expr.value += ch
    }
    return
  }

  if (ch === '.') {
    // Prevent multiple decimals in the current number segment
    const parts = expr.value.split(/[+\-*/]/)
    const last = parts[parts.length - 1]
    if (last.includes('.')) return
    expr.value += expr.value === '' ? '0.' : '.'
    return
  }

  if (ch === '00') {
    if (!expr.value || expr.value === '0') return
    expr.value += '00'
    return
  }

  // Leading zero prevention
  const parts = expr.value.split(/[+\-*/]/)
  const last = parts[parts.length - 1]
  if (last === '0' && ch !== '.') {
    // replace trailing zero with new digit
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
    // Only allow safe characters for math expression evaluation
    const safe = expr.value.replace(/[^0-9+\-*/.%()]/g, '')
    // Handle % as divide-by-100 of the preceding number
    const withPct = safe.replace(/(\d+(\.\d+)?)%/g, '($1/100)')
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${withPct})`)()
    return Number.isFinite(result) ? Math.round(result * 100) / 100 : 0
  } catch {
    return 0
  }
}

function onConfirm() {
  const val = evaluate()
  expr.value = val > 0 ? String(val) : ''
  emit('update:modelValue', val)
  emit('select', val)
  emit('close')
}

function onCancel() {
  emit('close')
}
</script>

<style scoped>
.calc-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 10000;
  display: flex;
  align-items: flex-end;
}

.calc-sheet {
  width: 100%;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 12px 16px 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}

.drag-handle {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: #d0d0d0;
  margin: 0 auto 12px;
}

.calc-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 12px;
}

/* Budget row */
.budget-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.budget-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.budget-label {
  font-size: 11px;
  color: #a8a8a8;
}

.budget-val {
  font-size: 13px;
  font-weight: 600;
}

.budget-val.neutral { color: #1a1a2e; }
.budget-val.negative { color: #e05050; }
.budget-val.positive { color: #52bf90; }

/* Amount display */
.amount-display {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  border: 1.5px solid #ff8d28;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  min-height: 50px;
}

.amount-expr {
  flex: 1;
  text-align: right;
  font-size: 24px;
  font-weight: 500;
  color: #1a1a2e;
  word-break: break-all;
}

.amount-currency {
  font-size: 14px;
  color: #a8a8a8;
  flex-shrink: 0;
}

/* Keypad */
.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.key {
  aspect-ratio: 1.4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  font-size: 22px;
  font-weight: 400;
  color: #1a1a2e;
  cursor: pointer;
  border-radius: 8px;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}

.key:active {
  background: rgba(0, 0, 0, 0.06);
}

.key-fn {
  color: #ff8d28;
  font-size: 20px;
  font-weight: 600;
}

.key-op {
  color: #ff8d28;
  font-size: 22px;
}

.key-eq {
  color: #ff8d28;
  font-size: 28px;
  font-weight: 300;
}

/* Slide up animation */
.sheet-up-enter-active,
.sheet-up-leave-active {
  transition: transform 0.28s ease, opacity 0.2s ease;
}

.sheet-up-enter-from,
.sheet-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
