<template>
    <div ref="rootRef" class="category-picker" :class="{ 'category-picker--fit': fitContent }">
    <button
      type="button"
      class="category-picker__trigger"
      :class="{ 'category-picker__trigger--active': open || modelValue != null }"
      :aria-label="ariaLabel"
      @click.stop="toggle"
    >
      <span class="category-picker__label">{{ buttonLabel }}</span>
      <slot name="chevron">
        <svg
          class="category-picker__chevron"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A8A8A8"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </slot>
    </button>

    <Transition name="fade">
      <div v-if="open" class="category-picker__backdrop" @click="close" />
    </Transition>

    <div
      v-if="open"
      class="filter-flyout filter-flyout-categories"
      :style="flyoutTopStyle"
      @click.stop
    >
      <div class="filter-flyout-categories-scroll">
        <div
          v-if="categoriesLoading && !incomeCategoryTree.length && !expenseCategoryTree.length"
          class="filter-flyout-loading filter-flyout-categories-loading-inner"
        >
          Loading…
        </div>
        <template v-else>
          <div class="filter-flyout-cat-header">
            <div
              v-if="incomeCategoryTree.length || expenseCategoryTree.length"
              class="filter-flyout-categories-search-wrap"
            >
              <input
                v-model="categoryFilterSearch"
                type="search"
                class="filter-flyout-categories-search"
                placeholder="Search categories…"
                enterkeyhint="search"
                autocapitalize="off"
                autocomplete="off"
                spellcheck="false"
                @click.stop
              />
            </div>
          </div>
          <template v-if="categoryFilterHasRenderableTree">
            <div v-if="showIncome && filteredIncomeCategoryTree.length" class="filter-flyout-cat-section">
              <div class="filter-flyout-cat-section-title">Income</div>
              <CategoryTreeRows
                :nodes="filteredIncomeCategoryTree"
                :selected-set="categorySelectionSet"
                @toggle="onCategoryTreeToggle"
              />
            </div>
            <div v-if="showExpense && filteredExpenseCategoryTree.length" class="filter-flyout-cat-section">
              <div class="filter-flyout-cat-section-title">Expense</div>
              <CategoryTreeRows
                :nodes="filteredExpenseCategoryTree"
                :selected-set="categorySelectionSet"
                @toggle="onCategoryTreeToggle"
              />
            </div>
          </template>
          <div
            v-else-if="incomeCategoryTree.length || expenseCategoryTree.length"
            class="filter-flyout-loading filter-flyout-cat-empty"
          >
            No matching categories
          </div>
          <div v-else class="filter-flyout-loading filter-flyout-cat-empty">
            No categories
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getCategoryTree } from '@/api/accounting'
import CategoryTreeRows from '@/components/CategoryTreeRows.vue'
import {
  normalizeCategoryTreeResponse,
  filterActiveCategoriesForMenu,
  flattenCategoryLabels,
  filterCategoryNodesBySearch,
  buildCategoryNodeMapFromTrees,
} from '@/utils/categoryFilterTree.js'

const props = defineProps({
  modelValue: { type: Number, default: null },
  workspaceId: { type: Number, default: null },
  placeholder: { type: String, default: 'Select category' },
  /** When set, shown on the trigger (e.g. synced chart category name). */
  displayLabel: { type: String, default: '' },
  fallbackLabel: { type: String, default: '' },
  ariaLabel: { type: String, default: 'Select category' },
  showIncome: { type: Boolean, default: false },
  showExpense: { type: Boolean, default: true },
  /** Shrink trigger to label width; caps at the default max width (46%). */
  fitContent: { type: Boolean, default: false },
  /** All-island analytics: load categories from every workspace (not just defaults). */
  includeWorkspaceScoped: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'select'])

const rootRef = ref(null)
const open = ref(false)
const categoriesLoading = ref(false)
const incomeCategoryTree = ref([])
const expenseCategoryTree = ref([])
const categoryMenuOptions = ref([])
const categoryFilterSearch = ref('')
const flyoutTopStyle = ref({})

const categoryNodeById = computed(() =>
  buildCategoryNodeMapFromTrees(incomeCategoryTree.value, expenseCategoryTree.value)
)

const categorySelectionSet = computed(() => {
  const id = Number(props.modelValue)
  return Number.isFinite(id) && id > 0 ? new Set([id]) : new Set()
})

const filteredIncomeCategoryTree = computed(() =>
  filterCategoryNodesBySearch(incomeCategoryTree.value, categoryFilterSearch.value)
)
const filteredExpenseCategoryTree = computed(() =>
  filterCategoryNodesBySearch(expenseCategoryTree.value, categoryFilterSearch.value)
)

const categoryFilterHasRenderableTree = computed(
  () =>
    (props.showIncome && filteredIncomeCategoryTree.value.length > 0) ||
    (props.showExpense && filteredExpenseCategoryTree.value.length > 0)
)

const buttonLabel = computed(() => {
  const external = String(props.displayLabel || props.fallbackLabel || '').trim()
  const id = Number(props.modelValue)
  if (!Number.isFinite(id) || id <= 0) {
    return external || props.placeholder
  }
  const node = categoryNodeById.value.get(id)
  if (node?.name) return String(node.name).trim() || external || props.placeholder
  const flat = categoryMenuOptions.value.find((o) => o.id === id)
  if (flat?.label) {
    const short = flat.label.split(' > ').pop()?.trim()
    if (short) return short
  }
  return external || props.placeholder
})

function syncFlyoutTop() {
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  flyoutTopStyle.value = { top: `${Math.round(rect.bottom + 8)}px` }
}

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
  categoryFilterSearch.value = ''
  flyoutTopStyle.value = {}
}

async function loadCategories() {
  categoriesLoading.value = true
  try {
    const wsId = props.workspaceId
    const treeOpts = props.includeWorkspaceScoped ? { includeWorkspaceScoped: true } : {}
    const loaders = []
    if (props.showIncome) loaders.push(getCategoryTree('income', wsId, treeOpts))
    if (props.showExpense) loaders.push(getCategoryTree('expense', wsId, treeOpts))
    const results = await Promise.all(loaders)
    let idx = 0
    if (props.showIncome) {
      incomeCategoryTree.value = filterActiveCategoriesForMenu(
        normalizeCategoryTreeResponse(results[idx++])
      )
    } else {
      incomeCategoryTree.value = []
    }
    if (props.showExpense) {
      expenseCategoryTree.value = filterActiveCategoriesForMenu(
        normalizeCategoryTreeResponse(results[idx++])
      )
    } else {
      expenseCategoryTree.value = []
    }
    const flat = [
      ...(props.showIncome ? flattenCategoryLabels(incomeCategoryTree.value) : []),
      ...(props.showExpense ? flattenCategoryLabels(expenseCategoryTree.value) : []),
    ]
    const byId = new Map()
    for (const o of flat) {
      if (!byId.has(o.id)) byId.set(o.id, o)
    }
    categoryMenuOptions.value = [...byId.values()].sort((a, b) => a.label.localeCompare(b.label))
  } catch {
    incomeCategoryTree.value = []
    expenseCategoryTree.value = []
    categoryMenuOptions.value = []
  } finally {
    categoriesLoading.value = false
  }
}

function onCategoryTreeToggle({ id, checked }) {
  if (!checked) return
  const n = Number(id)
  if (!Number.isFinite(n) || n <= 0) return
  emit('update:modelValue', n)
  emit('select', n)
  close()
}

function onViewportChange() {
  if (open.value) syncFlyoutTop()
}

watch(open, async (isOpen) => {
  if (!isOpen) return
  categoryFilterSearch.value = ''
  if (!incomeCategoryTree.value.length && !expenseCategoryTree.value.length) {
    await loadCategories()
  }
  syncFlyoutTop()
})

watch(
  () => [props.workspaceId, props.includeWorkspaceScoped],
  () => {
    incomeCategoryTree.value = []
    expenseCategoryTree.value = []
    categoryMenuOptions.value = []
  }
)

watch(categoryMenuOptions, (opts) => {
  if (!opts.length) return
  const id = Number(props.modelValue)
  if (!Number.isFinite(id) || id <= 0) return
  const valid = new Set(opts.map((o) => o.id))
  if (!valid.has(id) && !String(props.displayLabel || '').trim()) {
    emit('update:modelValue', null)
  }
})

onMounted(() => {
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})

defineExpose({
  categoryNodeById,
  categoryMenuOptions,
  loadCategories,
})
</script>

<style scoped>
.category-picker {
  position: relative;
  z-index: 55;
  flex: 0 1 46%;
  min-width: 88px;
  max-width: 46%;
}

.category-picker--fit {
  flex: 0 1 auto;
  width: max-content;
  min-width: 0;
}

.category-picker--fit .category-picker__trigger {
  width: auto;
  max-width: 100%;
}

.category-picker--fit .category-picker__label {
  flex: 0 1 auto;
}

.category-picker__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 100%;
  min-width: 0;
  height: auto;
  padding: 4px 4px 4px 6px;
  border-radius: 5px;
  border: 1px solid rgba(168, 168, 168, 0.35);
  background: #fff;
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.category-picker__trigger--active {
  background: #fff;
}

.category-picker__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  color: rgba(0, 0, 0, 0.7);
}

.category-picker__chevron {
  flex-shrink: 0;
}

.category-picker__backdrop {
  position: fixed;
  inset: 0;
  z-index: 10001;
  background: transparent;
}

.filter-flyout.filter-flyout-categories {
  box-sizing: border-box;
  position: fixed;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
  min-width: unset;
  width: min(420px, calc(100vw - 48px));
  max-width: min(420px, calc(100vw - 48px));
  max-height: none;
  overflow: hidden;
  padding: 0;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.04),
    0 14px 36px rgba(0, 0, 0, 0.14);
  z-index: 10002;
}

.filter-flyout-categories-scroll {
  max-height: min(392px, 58dvh);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: 8px;
}

.filter-flyout-categories-loading-inner,
.filter-flyout-cat-empty {
  padding: 20px 18px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.5);
}

.filter-flyout-cat-header {
  padding: 12px 14px 14px;
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f7 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.filter-flyout-categories-search {
  width: 100%;
  box-sizing: border-box;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

.filter-flyout-categories-search:focus {
  outline: none;
  border-color: #ff8d28;
  box-shadow: 0 0 0 2px rgba(255, 141, 40, 0.12);
}

.filter-flyout-cat-section + .filter-flyout-cat-section {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.filter-flyout-cat-section-title {
  padding: 10px 14px 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.42);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
