<template>
  <div class="category-item" :style="{ paddingLeft: depth * 16 + 'px' }">
    <div class="category-row" @click="toggleExpand">
      <div class="cat-left">
        <button
          v-if="category.children?.length"
          class="expand-btn"
          :class="{ expanded }"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E6A7C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 6 15 12 9 18"/>
          </svg>
        </button>
        <div v-else class="expand-placeholder" />
        <div class="cat-info">
          <span class="cat-name">{{ category.name }}</span>
          <span v-if="category.description" class="cat-desc">{{ category.description }}</span>
        </div>
      </div>
      <div class="cat-right">
        <span v-if="category.is_default" class="badge default-badge">Default</span>
        <span v-else-if="!category.is_active" class="badge inactive-badge">Inactive</span>
        <button
          v-if="!category.is_default && category.tenant_id != null"
          class="more-btn"
          @click.stop="showActions = true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#A7A7A7">
            <circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="expanded && category.children?.length" class="category-children">
      <CategoryItem
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :depth="depth + 1"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @toggle-active="(c, a) => $emit('toggle-active', c, a)"
        @add-child="$emit('add-child', $event)"
      />
    </div>

    <ion-action-sheet
      :is-open="showActions"
      :header="category.name"
      :buttons="actionButtons"
      @didDismiss="onActionDismiss"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IonActionSheet } from '@ionic/vue'
import CategoryItem from './CategoryItem.vue'

const props = defineProps({
  category: { type: Object, required: true },
  depth: { type: Number, default: 0 }
})

const emit = defineEmits(['edit', 'delete', 'toggle-active', 'add-child'])

const expanded = ref(false)
const showActions = ref(false)

const actionButtons = [
  { text: 'Add Child', role: 'add-child' },
  { text: 'Edit', role: 'edit' },
  { text: props.category.is_active ? 'Deactivate' : 'Activate', role: 'toggle' },
  { text: 'Delete', role: 'destructive' },
  { text: 'Cancel', role: 'cancel' }
]

function toggleExpand() {
  if (props.category.children?.length) {
    expanded.value = !expanded.value
  }
}

function onActionDismiss(ev) {
  const role = ev.detail?.role
  showActions.value = false
  if (role === 'add-child') emit('add-child', props.category.id)
  else if (role === 'edit') emit('edit', props.category)
  else if (role === 'destructive') emit('delete', props.category)
  else if (role === 'toggle') emit('toggle-active', props.category, !props.category.is_active)
}
</script>

<style scoped>
.category-item {
  padding-right: 12px;
}

.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px;
  border-bottom: 1px solid #F5F5F7;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.category-row:active {
  background: #FAFAFA;
}

.cat-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  transition: transform 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.expand-btn.expanded {
  transform: rotate(90deg);
}

.expand-placeholder {
  width: 18px;
}

.cat-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.cat-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-desc {
  font-size: 11px;
  color: #A7A7A7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.default-badge {
  background: rgba(195, 0, 16, 0.08);
  color: rgba(195, 0, 16, 0.74);
}

.inactive-badge {
  background: rgba(255, 141, 40, 0.1);
  color: #FF8D28;
}

.more-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  -webkit-tap-highlight-color: transparent;
}

.category-children {
  margin-left: 8px;
  border-left: 2px solid #F0F0F0;
}
</style>
