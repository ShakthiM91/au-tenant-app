<template>
  <div class="fab-wrapper">
    <!-- Click-away backdrop (transparent) -->
    <transition name="fade">
      <div v-if="expanded" class="fab-overlay" @click="expanded = false" />
    </transition>


    <!-- Arc menu options -->
    <div class="fab-arc-menu">
      <transition name="arc-item">
        <!-- origin offset to FAB centre: translate(-38px, 72px) -->
        <button v-if="expanded" class="fab-option arc-transfer"
          style="--tx:-38px;--ty:72px;--delay:0.08s"
          @click="onOption('transfer')">
          <span class="fab-option-label transfer">Transfer</span>
        </button>
      </transition>
      <transition name="arc-item">
        <!-- origin offset to FAB centre: translate(48px, 44px) -->
        <button v-if="expanded" class="fab-option arc-expense"
          style="--tx:48px;--ty:44px;--delay:0.04s"
          @click="onOption('expense')">
          <span class="fab-option-label expense">Expense</span>
        </button>
      </transition>
      <transition name="arc-item">
        <!-- origin offset to FAB centre: translate(102px, 8px) -->
        <button v-if="expanded" class="fab-option arc-income"
          style="--tx:102px;--ty:8px;--delay:0s"
          @click="onOption('income')">
          <span class="fab-option-label income">Income</span>
        </button>
      </transition>
    </div>

    <button type="button" class="fab-btn" @click="expanded = !expanded" :aria-expanded="expanded">
      <svg class="fab-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <g class="fab-plus-g" :style="fabPlusRotateStyle">
          <path
            d="M12 7v10M7 12h10"
            stroke="var(--fab-plus-color)"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </g>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const emit = defineEmits(['select'])
const expanded = ref(false)

const fabPlusRotateStyle = computed(() => ({
  transform: expanded.value ? 'rotate(45deg)' : 'none',
  transition: 'transform 0.25s ease',
}))

function onOption(type) {
  expanded.value = false
  emit('select', type)
}
</script>

<style scoped>
.fab-wrapper {
  position: fixed;
  bottom: 88px;
  right: 20px;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

/* Blurred full-screen backdrop */
.fab-overlay {
  position: fixed;
  inset: 0;
  z-index: -2;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background: rgba(0, 0, 0, 0.15);
}


/* Arc container anchored at the FAB button position */
.fab-arc-menu {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.fab-option {
  position: absolute;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 4px;
  -webkit-tap-highlight-color: transparent;
  pointer-events: all;
  white-space: nowrap;
}

/* Arc positions: Transfer nearly straight up, Expense upper-left, Income left */
.arc-transfer {
  bottom: 100px;
  right: -10px;
}

.arc-expense {
  bottom: 72px;
  right: 76px;
}

.arc-income {
  bottom: 20px;
  right: 130px;
}

.fab-option-label {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.fab-option-label.transfer { color: #ff8d28; }
.fab-option-label.expense  { color: #c30010; }
.fab-option-label.income   { color: #52bf90; }

.fab-btn {
  --fab-plus-color: #ff8d28;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.06),
    0 10px 28px rgba(0, 0, 0, 0.12);
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.fab-icon {
  display: block;
}

.fab-plus-g {
  transform-box: fill-box;
  transform-origin: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Arc item: fly out from FAB centre on enter, collapse back into it on leave */
.arc-item-enter-active {
  transition:
    opacity  0.22s ease calc(var(--delay, 0s)),
    transform 0.25s cubic-bezier(0.34, 1.45, 0.64, 1) calc(var(--delay, 0s));
}

.arc-item-leave-active {
  transition:
    opacity   0.16s ease-in,
    transform 0.2s  ease-in;
}

/* Collapsed at the FAB centre — each item has its own --tx/--ty offset */
.arc-item-enter-from,
.arc-item-leave-to {
  opacity: 0;
  transform: translate(var(--tx, 0px), var(--ty, 0px)) scale(0.4);
}
</style>
