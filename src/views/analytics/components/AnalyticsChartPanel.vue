<template>
  <div
    class="chart-card__body"
    :class="[bodyClass, { 'chart-card__body--chart-loading': loading, 'chart-card__body--interactive': !loading }]"
    :style="bodyStyle"
  >
    <div v-if="loading" class="chart-inline-loading">
      <ion-spinner name="crescent" />
    </div>
    <template v-else>
      <VChart
        ref="chartRef"
        class="echart"
        :class="chartClass"
        :option="displayOption"
        autoresize
        @click="onChartClick"
        @dblclick="onChartDblClick"
      />
      <button
        type="button"
        class="chart-expand-fab"
        :aria-label="`Expand ${title} chart`"
        @click.stop="onOpen"
      >
        <ion-icon :icon="expandOutline" />
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { IonSpinner, IonIcon } from '@ionic/vue'
import { expandOutline } from 'ionicons/icons'
import { useAnalyticsChartHandlers } from '@/views/analytics/useAnalyticsChartHandlers'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  option: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  bodyClass: { type: [String, Array, Object], default: '' },
  bodyStyle: { type: Object, default: null },
  chartClass: { type: [String, Array, Object], default: '' },
})

const emit = defineEmits(['open'])

const {
  chartRef,
  isInteractive,
  interactiveOption,
  onChartClick,
  onChartDblClick,
} = useAnalyticsChartHandlers(toRef(props, 'option'))

const displayOption = computed(() =>
  isInteractive.value ? interactiveOption.value : props.option
)

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
.chart-card__body--interactive {
  position: relative;
}

.chart-expand-fab {
  position: absolute;
  right: 6px;
  bottom: 6px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
}

.chart-expand-fab:focus-visible {
  outline: 2px solid rgba(255, 141, 40, 0.65);
  outline-offset: 2px;
}

.chart-expand-fab ion-icon {
  font-size: 14px;
  pointer-events: none;
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

.echart--sankey {
  min-height: 240px;
}
</style>
