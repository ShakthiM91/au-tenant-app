import { computed, ref, unref, watch } from 'vue'
import {
  interactiveChartOption,
  isPieChartOption,
  isRadarChartOption,
  isSankeyChartOption,
  isTreemapChartOption,
  isTreemapViewZoomed,
  mergeTreemapLabelLayout,
} from '@/views/analytics/chartOptions'
import { radarCategoryFromClick } from '@/utils/radarChart'
import { sankeySelectionFromClick } from '@/utils/reportDrillDown'

/** Pie / treemap / sankey / radar click handlers shared by inline charts and the focus modal. */
export function useAnalyticsChartHandlers(optionSource, { onDrill, sankeyDetailOnClick = false, radarDetailOnClick = false } = {}) {
  const chartRef = ref(null)
  const selectedIndex = ref(null)
  const selectedSankey = ref(null)
  const selectedRadar = ref(null)
  const treemapLastTapAt = ref(0)
  let treemapLayoutAfterZoom = null

  const isPie = computed(() => isPieChartOption(unref(optionSource)))
  const isTreemap = computed(() => isTreemapChartOption(unref(optionSource)))
  const isSankey = computed(() => isSankeyChartOption(unref(optionSource)))
  const isRadar = computed(() => isRadarChartOption(unref(optionSource)))
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
      selectedSankey.value = null
      selectedRadar.value = null
      treemapLastTapAt.value = 0
      scheduleTreemapLabelLayout(false)
    },
    { deep: false }
  )

  function getChartInstance() {
    return chartRef.value?.chart ?? null
  }

  function clearTreemapLayoutHook() {
    const chart = getChartInstance()
    if (chart && treemapLayoutAfterZoom) {
      chart.off('finished', treemapLayoutAfterZoom)
    }
    treemapLayoutAfterZoom = null
  }

  function scheduleTreemapLabelLayout(zoomed) {
    const chart = getChartInstance()
    if (!chart) return
    clearTreemapLayoutHook()
    const apply = () => {
      clearTreemapLayoutHook()
      mergeTreemapLabelLayout(chart, zoomed)
    }
    treemapLayoutAfterZoom = apply
    chart.on('finished', apply)
    requestAnimationFrame(() => requestAnimationFrame(apply))
  }

  function scheduleTreemapLabelLayoutFromChart() {
    const chart = getChartInstance()
    if (!chart) return
    clearTreemapLayoutHook()
    const apply = () => {
      clearTreemapLayoutHook()
      mergeTreemapLabelLayout(chart, isTreemapViewZoomed(chart))
    }
    treemapLayoutAfterZoom = apply
    chart.on('finished', apply)
    requestAnimationFrame(() => requestAnimationFrame(apply))
  }

  function resetInteraction() {
    selectedIndex.value = null
    selectedSankey.value = null
    selectedRadar.value = null
    treemapLastTapAt.value = 0
    scheduleTreemapLabelLayout(false)
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
    scheduleTreemapLabelLayout(true)
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
    } else {
      const parent = viewRoot.parentNode
      chart.dispatchAction({
        type: 'treemapRootToNode',
        seriesIndex: 0,
        targetNode: parent && parent !== viewRoot ? parent : treeRoot,
      })
    }
    scheduleTreemapLabelLayoutFromChart()
  }

  function onChartDblClick(params) {
    if (!isTreemap.value || params?.seriesType !== 'treemap') return
    treemapLastTapAt.value = 0
    treemapZoomOut()
  }

  function onChartClick(params) {
    if (isRadar.value) {
      if (radarDetailOnClick) {
        const sel = radarCategoryFromClick(params, unref(optionSource))
        if (sel) {
          selectedRadar.value = selectedRadar.value?.name === sel.name ? null : sel
        }
        return
      }
      if (onDrill) {
        onDrill(params)
        return
      }
    }
    if (isSankey.value && params?.seriesType === 'sankey') {
      if (sankeyDetailOnClick) {
        selectedSankey.value = sankeySelectionFromClick(params)
        return
      }
      if (onDrill) {
        onDrill(params)
        return
      }
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
    selectedSankey,
    selectedRadar,
    isPie,
    isTreemap,
    isSankey,
    isRadar,
    isInteractive,
    interactiveOption,
    resetInteraction,
    onChartClick,
    onChartDblClick,
  }
}
