import { computed, ref, unref, watch } from 'vue'
import {
  interactiveChartOption,
  isPieChartOption,
  isTreemapChartOption,
} from '@/views/analytics/chartOptions'

/** Pie / treemap click handlers shared by inline charts and the focus modal. */
export function useAnalyticsChartHandlers(optionSource, { onDrill } = {}) {
  const chartRef = ref(null)
  const selectedIndex = ref(null)
  const treemapLastTapAt = ref(0)

  const isPie = computed(() => isPieChartOption(unref(optionSource)))
  const isTreemap = computed(() => isTreemapChartOption(unref(optionSource)))
  const isInteractive = computed(() => isPie.value || isTreemap.value)

  const interactiveOption = computed(() => {
    const opt = unref(optionSource)
    if (!isInteractive.value) return opt
    return interactiveChartOption(opt, { selectedIndex: selectedIndex.value })
  })

  watch(
    optionSource,
    () => {
      selectedIndex.value = null
      treemapLastTapAt.value = 0
    },
    { deep: false }
  )

  function resetInteraction() {
    selectedIndex.value = null
    treemapLastTapAt.value = 0
  }

  function getChartInstance() {
    return chartRef.value?.chart ?? null
  }

  function treemapZoomIn(params) {
    const chart = getChartInstance()
    if (!chart || params?.seriesType !== 'treemap') return
    const target = params?.data?.name ?? params?.name
    if (!target) return
    chart.dispatchAction({
      type: 'treemapRootToNode',
      seriesIndex: params.seriesIndex ?? 0,
      targetNode: target,
    })
  }

  function treemapZoomOut() {
    const chart = getChartInstance()
    if (!chart) return
    const series = chart.getModel().getSeriesByIndex(0)
    if (!series || series.subType !== 'treemap') return
    const treeRoot = series.getData()?.tree?.root
    const viewRoot = series.getViewRoot?.()
    if (!treeRoot) return
    if (!viewRoot || viewRoot === treeRoot) {
      chart.dispatchAction({ type: 'treemapRender', seriesIndex: 0 })
      return
    }
    const parent = viewRoot.parentNode
    chart.dispatchAction({
      type: 'treemapRootToNode',
      seriesIndex: 0,
      targetNode: parent && parent !== viewRoot ? parent : treeRoot,
    })
  }

  function onChartDblClick(params) {
    if (!isTreemap.value || params?.seriesType !== 'treemap') return
    treemapLastTapAt.value = 0
    treemapZoomOut()
  }

  function onChartClick(params) {
    if (onDrill && params?.seriesType === 'sankey') {
      onDrill(params)
      return
    }
    if (onDrill && params?.seriesType === 'treemap') {
      onDrill(params)
      return
    }
    if (isTreemap.value && params?.seriesType === 'treemap') {
      const now = Date.now()
      if (treemapLastTapAt.value && now - treemapLastTapAt.value < 400) {
        treemapLastTapAt.value = 0
        treemapZoomOut()
        return
      }
      treemapLastTapAt.value = now
      treemapZoomIn(params)
      return
    }
    if (!isPie.value || params?.componentType !== 'series' || params?.seriesType !== 'pie') {
      if (onDrill) onDrill(params)
      return
    }
    if (params?.data?.name === 'No data') return
    const idx = params.dataIndex
    selectedIndex.value = selectedIndex.value === idx ? null : idx
  }

  return {
    chartRef,
    selectedIndex,
    isPie,
    isTreemap,
    isInteractive,
    interactiveOption,
    resetInteraction,
    onChartClick,
    onChartDblClick,
  }
}
