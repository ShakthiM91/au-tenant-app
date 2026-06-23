<template>
  <div
    class="chart-card__body"
    :class="[bodyClass, { 'chart-card__body--chart-loading': loading, 'chart-card__body--expandable': !loading }]"
    role="button"
    tabindex="0"
    :aria-label="`Expand ${title} chart`"
    @click="onOpen"
    @keydown.enter.prevent="onOpen"
    @keydown.space.prevent="onOpen"
  >
    <div v-if="loading" class="chart-inline-loading">
      <ion-spinner name="crescent" />
    </div>
    <template v-else>
      <VChart class="echart" :class="chartClass" :option="option" autoresize />
      <span class="chart-expand-fab" aria-hidden="true">
        <ion-icon :icon="expandOutline" />
      </span>
    </template>
  </div>
</template>

<script setup>
import { IonSpinner, IonIcon } from '@ionic/vue'
import { expandOutline } from 'ionicons/icons'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  option: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  bodyClass: { type: [String, Array, Object], default: '' },
  chartClass: { type: [String, Array, Object], default: '' },
})

const emit = defineEmits(['open'])

function onOpen() {
  if (props.loading) return
  emit('open', {
    title: props.title,
    subtitle: props.subtitle,
    option: props.option,
  })
}
</script>

<style scoped>
.chart-card__body--expandable {
  cursor: pointer;
  position: relative;
}

.chart-card__body--expandable:focus-visible {
  outline: 2px solid rgba(255, 141, 40, 0.65);
  outline-offset: 2px;
}

.chart-expand-fab {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  color: rgba(0, 0, 0, 0.45);
  pointer-events: none;
}

.chart-expand-fab ion-icon {
  font-size: 14px;
}

.chart-inline-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.65);
  z-index: 1;
}

.echart {
  width: 100%;
  min-height: 100%;
}

.echart--donut {
  min-height: 200px;
}

.echart--donut-tall {
  min-height: 300px;
}

.echart--pareto {
  flex: 1;
  min-height: 140px;
}
</style>
