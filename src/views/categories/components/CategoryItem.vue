<template>
  <div class="category-item-root" :class="{ 'is-nested': depth > 0 }">
    <template v-if="depth === 0">
      <div class="category-card">
        <div
          class="card-header"
          :class="{ 'is-expandable': hasChildren }"
          @click="onRowToggle"
        >
          <span class="card-title">{{ category.name }}</span>
          <div class="card-header-right">
            <span v-if="category.is_default" class="badge default-badge">Default</span>
            <span v-else-if="!category.is_active" class="badge inactive-badge">Inactive</span>
            <span v-if="childrenSumLabel" class="card-sum">{{ childrenSumLabel }}</span>
            <button
              v-if="editable"
              type="button"
              class="more-btn more-btn--accent"
              aria-label="Category actions"
              @click.stop="openActions($event)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="18" r="1.5" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
        <p v-if="category.description" class="card-desc">{{ category.description }}</p>
        <div v-if="hasChildren && expanded" class="card-children">
          <CategoryItem
            v-for="child in category.children"
            :key="child.id"
            :category="child"
            :depth="1"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
            @toggle-active="(c, a) => $emit('toggle-active', c, a)"
            @add-child="$emit('add-child', $event)"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div
        class="child-row"
        :class="{ 'is-expandable': hasChildren }"
        :style="{ paddingLeft: (depth - 1) * 12 + 'px' }"
        @click="onRowToggle"
      >
        <div class="child-row-left">
          <span class="grip-icon" aria-hidden="true">
            <svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden="true">
              <rect x="0" y="0" width="12" height="2.5" rx="1" fill="#A8A8A8" />
              <rect x="0" y="4.5" width="12" height="4" rx="1" fill="#A8A8A8" />
              <rect x="0" y="10.5" width="12" height="2.5" rx="1" fill="#A8A8A8" />
            </svg>
          </span>
          <div class="child-text">
            <span class="child-name">{{ category.name }}</span>
            <span v-if="category.description" class="child-desc">{{ category.description }}</span>
          </div>
        </div>
        <div class="child-row-right">
          <span v-if="rowAmountLabel" class="child-amount">{{ rowAmountLabel }}</span>
          <span v-if="category.is_default" class="badge default-badge badge--sm">Default</span>
          <span v-else-if="!category.is_active" class="badge inactive-badge badge--sm">Inactive</span>
          <button
            v-if="editable"
            type="button"
            class="more-btn more-btn--muted"
            aria-label="Category actions"
            @click.stop="openActions($event)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="6" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
      <div v-if="hasChildren && expanded" class="child-nested">
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
    </template>

    <ion-popover
      :is-open="showActions"
      :event="popoverEvent"
      :dismiss-on-select="true"
      :arrow="false"
      class="category-actions-popover"
      @didDismiss="onPopoverDismiss"
    >
      <ion-content class="category-actions-popover-content" :scroll-y="false">
        <ion-list lines="none" class="popover-list">
          <ion-item
            button
            :detail="false"
            lines="none"
            class="popover-item popover-item--primary"
            @click="handleAction('add-child')"
          >
            <ion-label>Add child</ion-label>
          </ion-item>
          <ion-item
            button
            :detail="false"
            lines="none"
            class="popover-item"
            @click="handleAction('edit')"
          >
            <ion-label>Edit</ion-label>
          </ion-item>
          <ion-item
            button
            :detail="false"
            lines="none"
            class="popover-item"
            @click="handleAction('toggle')"
          >
            <ion-label>{{ category.is_active ? 'Deactivate' : 'Activate' }}</ion-label>
          </ion-item>
          <ion-item
            button
            :detail="false"
            lines="none"
            class="popover-item popover-item--danger"
            @click="handleAction('destructive')"
          >
            <ion-label>Delete category</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-popover>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { IonPopover, IonContent, IonList, IonItem, IonLabel } from '@ionic/vue'
import CategoryItem from './CategoryItem.vue'

const AMOUNT_KEYS = ['budget_amount', 'total_amount', 'amount', 'allocated_amount']

const props = defineProps({
  category: { type: Object, required: true },
  depth: { type: Number, default: 0 }
})

const emit = defineEmits(['edit', 'delete', 'toggle-active', 'add-child'])

const expanded = ref(Boolean(props.category.children?.length))
const showActions = ref(false)
const popoverEvent = ref(undefined)

const hasChildren = computed(() => Boolean(props.category.children?.length))

const editable = computed(() => !props.category.is_default && props.category.tenant_id != null)

function pickAmount(obj) {
  for (const k of AMOUNT_KEYS) {
    if (obj[k] != null && obj[k] !== '') {
      const n = Number(obj[k])
      if (!Number.isNaN(n)) return n
    }
  }
  return null
}

function formatMoney(n) {
  return Number(n).toLocaleString('en-AU', { maximumFractionDigits: 0 })
}

const childrenSumLabel = computed(() => {
  const children = props.category.children || []
  let sum = 0
  let found = false
  for (const c of children) {
    const v = pickAmount(c)
    if (v != null) {
      sum += v
      found = true
    }
  }
  if (!found) return null
  return `∑ ${formatMoney(sum)}`
})

const rowAmountLabel = computed(() => {
  const v = pickAmount(props.category)
  return v != null ? formatMoney(v) : null
})

function openActions(ev) {
  popoverEvent.value = ev
  showActions.value = true
}

function onRowToggle() {
  if (hasChildren.value) expanded.value = !expanded.value
}

function onPopoverDismiss() {
  showActions.value = false
  popoverEvent.value = undefined
}

function handleAction(role) {
  if (role === 'add-child') emit('add-child', props.category.id)
  else if (role === 'edit') emit('edit', props.category)
  else if (role === 'destructive') emit('delete', props.category)
  else if (role === 'toggle') emit('toggle-active', props.category, !props.category.is_active)
  showActions.value = false
}
</script>

<style scoped>
.category-item-root.is-nested {
  margin: 0;
}

.category-item-root:not(.is-nested) {
  margin: 0 11px 8px;
}

.category-card {
  background: #fff;
  border-radius: 13px;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.16);
  padding: 3px 11px 11px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 28px;
  -webkit-tap-highlight-color: transparent;
}

.card-header.is-expandable {
  cursor: pointer;
}

.card-header.is-expandable:active {
  opacity: 0.85;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  color: rgba(255, 141, 40, 0.75);
  min-width: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.card-sum {
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  color: rgba(255, 141, 40, 0.75);
  white-space: nowrap;
}

.card-desc {
  margin: 0 0 4px;
  font-size: 11px;
  line-height: 1.35;
  color: rgba(0, 0, 0, 0.45);
}

.card-children {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 4px;
}

.child-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 24px;
  padding: 2px 0;
  -webkit-tap-highlight-color: transparent;
}

.child-row.is-expandable {
  cursor: pointer;
}

.child-row.is-expandable:active {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
}

.child-row-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.grip-icon {
  display: flex;
  flex-shrink: 0;
  width: 18px;
  justify-content: center;
  align-items: center;
}

.child-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.child-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  color: rgba(0, 0, 0, 0.72);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.child-desc {
  font-size: 11px;
  color: #A8A8A8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.child-row-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.child-amount {
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  color: #A8A8A8;
  white-space: nowrap;
}

.child-nested {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.badge--sm {
  font-size: 9px;
  padding: 1px 6px;
}

.default-badge {
  background: rgba(195, 0, 16, 0.08);
  color: rgba(195, 0, 16, 0.74);
}

.inactive-badge {
  background: rgba(255, 141, 40, 0.1);
  color: #ff8d28;
}

.more-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.more-btn--accent {
  color: #ff8d28;
}

.more-btn--muted {
  color: #a8a8a8;
}

.popover-list {
  margin: 0;
  padding: 0;
  background: transparent;
}
</style>

<!-- Popover is portaled outside the component; keep styles unscoped with a unique prefix -->
<style>
ion-popover.category-actions-popover::part(content) {
  border-radius: 14px;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.16);
  background: #ffffff;
}

ion-popover.category-actions-popover .category-actions-popover-content {
  --background: #ffffff;
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 14px;
  --padding-bottom: 14px;
}

ion-popover.category-actions-popover ion-list.popover-list {
  margin: 0;
  padding: 0;
  background: transparent;
}

ion-popover.category-actions-popover ion-item.popover-item {
  --background: transparent;
  --background-hover: rgba(0, 0, 0, 0.04);
  --background-activated: rgba(0, 0, 0, 0.06);
  --border-width: 0;
  --inner-border-width: 0;
  --min-height: 48px;
  --padding-start: 0;
  --padding-end: 0;
  --ripple-color: rgba(0, 0, 0, 0.08);
  font-size: 16px;
  font-weight: 400;
}

ion-popover.category-actions-popover ion-item.popover-item ion-label {
  margin: 10px 0;
  color: #000000;
}

ion-popover.category-actions-popover ion-item.popover-item--primary ion-label {
  color: #ff8d28;
  font-weight: 500;
}

ion-popover.category-actions-popover ion-item.popover-item--danger ion-label {
  color: #e07070;
  font-weight: 400;
}
</style>
