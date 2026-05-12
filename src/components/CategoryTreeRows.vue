<template>
  <template v-for="node in nodes" :key="node.id">
    <label
      class="filter-cat-row"
      :style="{ paddingLeft: `${14 + depth * 16}px` }"
    >
      <input
        type="checkbox"
        class="filter-flyout-cb"
        :checked="selectedSet.has(Number(node.id))"
        @change="onToggle(node.id, $event)"
      />
      <span class="filter-cat-row-text">
        <span class="filter-cat-name">{{ node.name }}</span>
        <span
          v-if="node.children && node.children.length"
          class="filter-cat-hint"
        >Includes subcategories</span>
        <span v-else class="filter-cat-hint filter-cat-hint-leaf">This category only</span>
      </span>
    </label>
    <CategoryTreeRows
      v-if="node.children && node.children.length"
      :nodes="node.children"
      :depth="depth + 1"
      :selected-set="selectedSet"
      @toggle="$emit('toggle', $event)"
    />
  </template>
</template>

<script setup>
import CategoryTreeRows from './CategoryTreeRows.vue'

defineProps({
  nodes: { type: Array, default: () => [] },
  /** Precomputed Set of selected category ids for O(1) lookup */
  selectedSet: { type: Object, required: true },
  depth: { type: Number, default: 0 },
})

const emit = defineEmits(['toggle'])

function onToggle(id, ev) {
  emit('toggle', { id: Number(id), checked: ev.target.checked })
}
</script>

<style scoped>
.filter-cat-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 6px 14px 7px;
  box-sizing: border-box;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-radius: 10px;
}

.filter-cat-row:active {
  background: rgba(255, 141, 40, 0.07);
}

.filter-flyout-cb {
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin: 3px 0 0 0;
  flex-shrink: 0;
  accent-color: #ff8d28;
  cursor: pointer;
}

.filter-cat-row-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.filter-cat-name {
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.82);
  line-height: 1.25;
}

.filter-cat-hint {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: rgba(0, 0, 0, 0.4);
  line-height: 1.3;
}

.filter-cat-hint-leaf {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.36);
}
</style>
