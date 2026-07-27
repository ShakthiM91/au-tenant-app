/** Shared ECharts option builders for Analytics (light theme; matches existing screen styles). */

import { donutChartColor } from '@/utils/donutChartColors'
import { niceCeilMax, formatChartAxisValue, chartAxisLabelFormatter } from '@revo/chart-ui'

export { niceCeilMax, formatChartAxisValue, chartAxisLabelFormatter }

export const D = {
  green: '#66C2A5',
  green2: '#66BB6A',
  yellow: '#FFD92F',
  pink: '#E78AC3',
  red: '#EF5350',
  blue: '#5C9FD4',
  purple: '#9C6BCE',
  coral: '#FF8A65',
  tabOrange: '#F39C12',
  grid: 'rgba(0,0,0,0.06)',
  axis: '#A8A8A8',
  muted: 'rgba(0,0,0,0.65)',
  highlightPurple: '#7B1FA2',
}

export const lg = (c1, c2) => ({
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: c1 },
    { offset: 1, color: c2 },
  ],
})

export const gridStd = (extra = {}) => ({
  left: 6,
  right: 4,
  top: 8,
  bottom: 4,
  containLabel: true,
  ...extra,
})

export const xSplit = { show: true, lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } }

function tierGradientForExpense(v, maxVal) {
  const tG = lg('#81C784', '#43A047')
  const tY = lg('#FFE082', '#F9A825')
  const tR = lg('#FF8A80', '#E53935')
  const ratio = maxVal > 0 ? v / maxVal : 0
  if (ratio >= 0.85) return { color: tR, borderRadius: [3, 3, 0, 0] }
  if (ratio >= 0.45) return { color: tY, borderRadius: [3, 3, 0, 0] }
  return { color: tG, borderRadius: [3, 3, 0, 0] }
}

export function monthlyExpenseBarOption(monthLabels, expenses) {
  const labels = monthLabels?.length ? monthLabels : ['—']
  const exp = (expenses?.length ? expenses : [0]).map((v) => Number(v) || 0)
  const maxVal = Math.max(1, ...exp)
  const yMax = niceCeilMax(exp)
  return {
    grid: gridStd(),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: labels,
      splitLine: xSplit,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: D.axis, fontSize: 8 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      splitNumber: 4,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: D.axis,
        fontSize: 8,
        formatter: chartAxisLabelFormatter(yMax),
      },
    },
    series: [
      {
        type: 'bar',
        data: exp.map((v) => ({
          value: v,
          itemStyle: {
            ...tierGradientForExpense(v, maxVal),
            borderRadius: [5, 5, 0, 0],
          },
        })),
        barWidth: '32%',
        barCategoryGap: '36%',
      },
    ],
  }
}

const IE_MONTHLY_GREEN = '#52bf90'
const gIeMonthly = () => lg('#9ad9be', IE_MONTHLY_GREEN)

export function incomeExpenseBarOption(monthLabels, income, expense) {
  const n = Math.max(monthLabels?.length || 0, income?.length || 0, expense?.length || 0, 1)
  const labels = monthLabels?.length ? monthLabels : Array.from({ length: n }, () => '—')
  const inc = (income?.length ? income : Array(n).fill(0)).map((v) => Number(v) || 0)
  const exp = (expense?.length ? expense : Array(n).fill(0)).map((v) => Number(v) || 0)
  const yMax = niceCeilMax([...inc, ...exp])
  const gIn = gIeMonthly()
  const gEx = lg('#F9A8A3', '#E04E4A')
  return {
    grid: gridStd(),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: labels,
      splitLine: xSplit,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: D.axis, fontSize: 8 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      splitNumber: 4,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: D.axis,
        fontSize: 8,
        formatter: chartAxisLabelFormatter(yMax),
      },
    },
    series: [
      {
        name: 'Income',
        type: 'bar',
        data: inc,
        itemStyle: { color: gIn, borderRadius: [5, 5, 0, 0] },
        barMaxWidth: 6,
        barGap: '25%',
        barCategoryGap: '40%',
      },
      {
        name: 'Expenses',
        type: 'bar',
        data: exp,
        itemStyle: { color: gEx, borderRadius: [5, 5, 0, 0] },
        barMaxWidth: 6,
      },
    ],
  }
}

export function incomeExpenseHighlightOption(monthLabels, income, expense, highlightLabel) {
  const base = incomeExpenseBarOption(monthLabels, income, expense)
  const labels = base.xAxis.data || monthLabels || []
  const idx = highlightLabel ? labels.indexOf(highlightLabel) : -1
  const hl =
    idx >= 0
      ? [[{ xAxis: labels[idx] }, { xAxis: labels[idx] }]]
      : labels.length
        ? [[{ xAxis: labels[0] }, { xAxis: labels[0] }]]
        : []
  base.series[0].itemStyle = { color: gIeMonthly(), borderRadius: [9, 9, 0, 0] }
  base.series[0].barMaxWidth = 6
  base.series[0].barGap = '20%'
  base.series[0].barCategoryGap = '35%'
  base.series[1].itemStyle = { color: lg('#F9A8A3', '#E04E4A'), borderRadius: [9, 9, 0, 0] }
  base.series[1].barMaxWidth = 6
  if (hl.length) {
    base.series[0].markArea = {
      silent: true,
      itemStyle: {
        borderColor: D.highlightPurple,
        borderWidth: 1.5,
        color: 'rgba(123, 31, 162, 0.04)',
      },
      data: hl,
    }
  }
  return base
}

export function ieGapMonthlyOption(monthLabels, gaps) {
  const g = gaps.map((v) => Number(v) || 0)
  const pos = gIeMonthly()
  const neg = lg('#FFCDD2', '#B71C1C')
  const ymax = niceCeilMax(g.map(Math.abs))
  return {
    grid: gridStd(),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: monthLabels,
      splitLine: xSplit,
      axisLine: { show: true, lineStyle: { color: D.grid, width: 0.5 } },
      axisTick: { show: false },
      axisLabel: { color: D.axis, fontSize: 8 },
    },
    yAxis: {
      type: 'value',
      min: -ymax,
      max: ymax,
      splitNumber: 4,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: D.axis,
        fontSize: 7,
        formatter: chartAxisLabelFormatter(ymax),
      },
    },
    series: [
      {
        type: 'bar',
        data: g.map((v) => ({
          value: v,
          itemStyle: {
            color: v >= 0 ? pos : neg,
            borderRadius: v >= 0 ? [10, 10, 0, 0] : [0, 0, 10, 10],
          },
        })),
        barWidth: '42%',
        barCategoryGap: '32%',
      },
    ],
  }
}

export function ieWaterfallOption(monthLabels, income, expense) {
  const net = income.map((inc, i) => Number(inc || 0) - Number(expense[i] || 0))
  let cum = 0
  const help = []
  const val = []
  for (const c of net) {
    if (c >= 0) {
      help.push(cum)
      val.push(c)
      cum += c
    } else {
      const next = cum + c
      help.push(next)
      val.push(-c)
      cum = next
    }
  }
  const gWfP = gIeMonthly()
  const gWfN = lg('#FFCDD2', '#B71C1C')
  const ymax = niceCeilMax([cum, ...val])
  return {
    grid: gridStd({ bottom: 6 }),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: monthLabels,
      splitLine: xSplit,
      axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.1)', width: 0.5 } },
      axisTick: { show: false },
      axisLabel: { color: D.axis, fontSize: 7 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: ymax,
      splitNumber: 4,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: D.axis,
        fontSize: 7,
        formatter: chartAxisLabelFormatter(ymax),
      },
    },
    series: [
      {
        type: 'bar',
        stack: 'wf',
        itemStyle: { color: 'transparent' },
        emphasis: { disabled: true },
        data: help,
      },
      {
        type: 'bar',
        stack: 'wf',
        data: val.map((v, i) => ({
          value: v,
          itemStyle: {
            color: net[i] >= 0 ? gWfP : gWfN,
            borderRadius: net[i] >= 0 ? [6, 6, 0, 0] : [0, 0, 6, 6],
          },
        })),
        barWidth: '48%',
        barCategoryGap: '30%',
      },
    ],
  }
}

function formatChartAmount(n) {
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(n) || 0)
  } catch {
    return String(Math.round((Number(n) || 0) * 100) / 100)
  }
}

function formatStackedPercent(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '0.00'
  return v.toFixed(2)
}

function donutRadius(tall, expanded = false) {
  if (expanded) return tall ? ['30%', '62%'] : ['32%', '66%']
  return tall ? ['32%', '60%'] : ['34%', '64%']
}

function buildDonutOption(rows, { tall = false, expanded = false } = {}) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  const sliceCap = expanded ? 24 : tall ? 14 : 10
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  const top = sorted.slice(0, sliceCap - 1)
  const rest = sorted.slice(sliceCap - 1)
  const otherVal = rest.reduce((s, r) => s + r.value, 0)
  const slices =
    otherVal > 0 ? [...top, { name: 'Other', value: otherVal }] : top

  const nameFont = expanded ? 9 : 7
  const pctFont = expanded ? 10 : 8
  const subLabelRich = {}
  slices.forEach((s, i) => {
    const c = s.color || donutChartColor(i)
    subLabelRich[`sn${i}`] = { color: c, fontSize: nameFont, lineHeight: expanded ? 13 : 10, align: 'left' }
    subLabelRich[`sp${i}`] = { color: c, fontSize: pctFont, fontWeight: 600, lineHeight: expanded ? 13 : 10, align: 'left' }
  })

  const scTop = (hex) => (hex.length === 7 ? `${hex}E0` : hex)
  const pieData = slices.map((s, i) => {
    const c = s.color || donutChartColor(i)
    return {
      name: s.name,
      value: s.value,
      itemStyle: {
        color: lg(scTop(c), c),
        borderColor: '#fff',
        borderWidth: 3,
      },
    }
  })

  return {
    tooltip: { show: false },
    legend: { show: false },
    __donutTall: tall,
    series: [
      {
        type: 'pie',
        padAngle: 3.5,
        minShowLabelAngle: 0.2,
        radius: donutRadius(tall, expanded),
        center: ['50%', '50%'],
        data: pieData,
        label: {
          show: true,
          minMargin: 1,
          edgeDistance: expanded ? 5 : 3,
          formatter: (p) => {
            const pct = total > 0 ? ((p.value / total) * 100).toFixed(2) : '0'
            return p.dataIndex == null ? '' : `{sn${p.dataIndex}|${p.name}}\n{sp${p.dataIndex}|${pct}%}`
          },
          rich: subLabelRich,
        },
        labelLine: {
          show: true,
          lineStyle: { color: '#C8C8C8', width: 0.75, type: [3, 3] },
          length: expanded ? 10 : 8,
          length2: expanded ? 16 : 14,
          smooth: 0.2,
        },
        emphasis: { disabled: true },
      },
    ],
    __donutTotal: total,
  }
}

/** @param {{ category_name: string, amount: number, category_id?: number }[]} rows */
export function categoryDonutFromRows(rows, opts) {
  const mapped = (rows || [])
    .filter((r) => Number(r.amount) > 0)
    .map((r, i) => ({
      name: r.category_name || 'Uncategorized',
      value: Number(r.amount) || 0,
      color: donutChartColor(i),
      category_id: r.category_id != null ? Number(r.category_id) : 0,
    }))
  if (!mapped.length) {
    return {
      tooltip: { show: false },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: donutRadius(!!opts?.tall, !!opts?.expanded),
          center: ['50%', '50%'],
          data: [{ name: 'No data', value: 1, itemStyle: { color: '#EEEEEE' } }],
          label: { show: false },
          emphasis: { disabled: true },
        },
      ],
    }
  }
  return buildDonutOption(mapped, opts)
}

const COMPACT_AXIS_TARGET_LABELS = 6

/** Pick a readable day/category label step for narrow inline charts (e.g. 1, 2, 5, 7). */
export function compactCategoryLabelStep(catLen, targetLabels = COMPACT_AXIS_TARGET_LABELS) {
  if (!catLen || catLen <= 1) return 1
  if (catLen <= targetLabels) return 1
  const needed = Math.ceil(catLen / targetLabels)
  const niceSteps = [1, 2, 3, 5, 7, 10]
  return niceSteps.find((s) => s >= needed) ?? needed
}

function compactDayGridBottom(catLen) {
  if (catLen > 20) return 14
  if (catLen > 10) return 10
  return 4
}

function compactDayAxisLabel(catLen, { fontSize = 7 } = {}) {
  const step = compactCategoryLabelStep(catLen)
  const base = {
    color: D.axis,
    fontSize,
    hideOverlap: false,
  }
  if (step <= 1) {
    return { ...base, interval: 0 }
  }
  return {
    ...base,
    interval: step - 1,
    showMinLabel: true,
    showMaxLabel: true,
  }
}

/** Day labels for I/E progression, e.g. "Jun 1". */
export function ieProgressionDayLabels(year, month, daysInMonth) {
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
}

function ieProgressionAxisLabelStep(catLen) {
  return compactCategoryLabelStep(catLen)
}

function ieProgressionAxisLabel(catLen) {
  const step = ieProgressionAxisLabelStep(catLen)
  const rotate = catLen > 15 ? 42 : 0
  const base = {
    color: D.axis,
    fontSize: 7,
    rotate,
    margin: rotate ? 10 : 6,
    hideOverlap: false,
  }
  if (step <= 1) {
    return { ...base, interval: 0 }
  }
  return {
    ...base,
    interval: step - 1,
    showMinLabel: true,
    showMaxLabel: true,
  }
}

function ieProgressionGridBottom(catLen) {
  return catLen > 15 ? 40 : 28
}

export function dailyExpenseAnalysisOption(daysInMonth, expenseByDayIndex) {
  const labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))
  const vals = labels.map((_, i) => Number(expenseByDayIndex[i] || 0))
  const maxVal = Math.max(1, ...vals)
  const yMax = niceCeilMax(vals)
  return {
    grid: gridStd({ bottom: compactDayGridBottom(daysInMonth) }),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.12)', width: 0.5 } },
      axisTick: { show: false },
      axisLabel: compactDayAxisLabel(daysInMonth),
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      splitNumber: 5,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: D.axis,
        fontSize: 7,
        formatter: chartAxisLabelFormatter(yMax),
      },
    },
    series: [
      {
        type: 'bar',
        data: vals.map((v) => ({ value: v, itemStyle: tierGradientForExpense(v, maxVal) })),
        barWidth: '28%',
        barCategoryGap: '55%',
      },
    ],
  }
}

export function weekdayExpenseAnalysisOption(labels, expenseByWeekdayIndex) {
  const vals = labels.map((_, i) => Number(expenseByWeekdayIndex[i] || 0))
  const maxVal = Math.max(1, ...vals)
  const yMax = niceCeilMax(vals)
  return {
    grid: gridStd(),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.12)', width: 0.5 } },
      axisTick: { show: false },
      axisLabel: { color: D.axis, fontSize: 7 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      splitNumber: 5,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: D.axis,
        fontSize: 7,
        formatter: chartAxisLabelFormatter(yMax),
      },
    },
    series: [
      {
        type: 'bar',
        data: vals.map((v) => ({ value: v, itemStyle: tierGradientForExpense(v, maxVal) })),
        barWidth: '36%',
        barCategoryGap: '40%',
      },
    ],
  }
}

export function cumulativeExpenseLineOption(dayLabels, cumulative) {
  const yMax = niceCeilMax(cumulative)
  return {
    grid: gridStd({ bottom: compactDayGridBottom(dayLabels.length) }),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: dayLabels,
      splitLine: xSplit,
      axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.12)' } },
      axisTick: { show: false },
      axisLabel: compactDayAxisLabel(dayLabels.length),
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      splitNumber: 5,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: D.axis,
        fontSize: 7,
        formatter: chartAxisLabelFormatter(yMax),
      },
    },
    series: [
      {
        type: 'line',
        data: cumulative,
        smooth: false,
        showSymbol: false,
        lineStyle: { color: '#E65C5C', width: 2.2 },
        areaStyle: { color: 'rgba(230, 92, 92, 0.12)' },
      },
    ],
  }
}

export function ieProgressionDualAreaOption(dayLabels, cumIncome, cumExpense) {
  const cats = dayLabels || []
  const yMax = niceCeilMax([...cumIncome, ...cumExpense])
  return {
    __ieProgression: true,
    grid: { left: 4, right: 32, top: 8, bottom: ieProgressionGridBottom(cats.length), containLabel: true },
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: cats,
      splitLine: xSplit,
      axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.1)', width: 0.5 } },
      axisTick: { show: false },
      axisLabel: ieProgressionAxisLabel(cats.length),
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      splitNumber: 5,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: D.axis,
        fontSize: 7,
        formatter: chartAxisLabelFormatter(yMax),
      },
    },
    series: [
      {
        name: 'Income',
        type: 'line',
        z: 1,
        step: 'end',
        data: cumIncome,
        showSymbol: false,
        lineStyle: { color: '#3CB371', width: 1.8 },
        areaStyle: { color: 'rgba(60, 179, 113, 0.14)' },
      },
      {
        name: 'Expenses',
        type: 'line',
        z: 2,
        data: cumExpense,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#D64550', width: 1.8 },
        areaStyle: { color: 'rgba(214, 69, 80, 0.12)' },
      },
    ],
  }
}

/** Curated gradient pairs — hues spaced for clear separation in stacked bars. */
const STACK_PALETTE = [
  ['#FFB74D', '#E65100'], // orange
  ['#64B5F6', '#1565C0'], // blue
  ['#81C784', '#2E7D32'], // green
  ['#F06292', '#AD1457'], // rose
  ['#4DB6AC', '#00695C'], // teal
  ['#9575CD', '#4527A0'], // purple
  ['#FFD54F', '#F57C00'], // amber
  ['#7986CB', '#283593'], // indigo
  ['#AED581', '#558B2F'], // lime
  ['#FF8A65', '#BF360C'], // deep orange
  ['#4DD0E1', '#00838F'], // cyan
  ['#A1887F', '#4E342E'], // brown
  ['#BA68C8', '#6A1B9A'], // magenta
  ['#E57373', '#C62828'], // red
  ['#90A4AE', '#37474F'], // blue grey
  ['#FFF176', '#F9A825'], // yellow
  ['#80CBC4', '#00796B'], // mint
  ['#CE93D8', '#512DA8'], // violet
]

function sk(a, t, b) {
  return lg(a + t, b)
}

function hslToHex(h, s, l) {
  const sn = s / 100
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Golden-angle hues for categories beyond the curated palette. */
function stackPalettePair(index) {
  if (index < STACK_PALETTE.length) return STACK_PALETTE[index]
  const hue = (index * 137.508) % 360
  return [hslToHex(hue, 62, 68), hslToHex(hue, 72, 32)]
}

/** Stable, collision-free color per category name. */
function buildStackCategoryColorMap(names) {
  const map = new Map()
  ;[...new Set(names)]
    .sort((a, b) => a.localeCompare(b))
    .forEach((name, i) => map.set(name, stackPalettePair(i)))
  return map
}

/** stackedMonthSlices: { label, parents: { name, amount }[] }[] */
export function stackedCategoryPercentOption(stackedMonthSlices) {
  const slices = stackedMonthSlices || []
  if (!slices.length) {
    return {
      grid: gridStd(),
      xAxis: { type: 'category', data: ['—'] },
      yAxis: { type: 'value', max: 100 },
      series: [],
    }
  }
  const monthLabels = slices.map((s) => s.label)
  const totals = new Map()
  slices.forEach((s) => {
    for (const p of s.parents || []) {
      totals.set(p.name, (totals.get(p.name) || 0) + Number(p.amount || 0))
    }
  })
  // Largest at stack bottom (first series); matches per-month amount DESC from the API.
  const names = [...totals.keys()].sort((a, b) => (totals.get(b) || 0) - (totals.get(a) || 0))

  if (!names.length) {
    return {
      grid: gridStd(),
      xAxis: { type: 'category', data: monthLabels.length ? monthLabels : ['—'] },
      yAxis: { type: 'value', max: 100 },
      series: [],
    }
  }

  const colorMap = buildStackCategoryColorMap(names)

  const series = names.map((name) => {
    const data = slices.map((month) => {
      const parents = month.parents || []
      const row = parents.find((p) => p.name === name)
      const amt = row ? Number(row.amount) : 0
      const tot = parents.reduce((s, p) => s + Number(p.amount), 0)
      return tot > 0 ? (amt / tot) * 100 : 0
    })
    const [c1, c2] = colorMap.get(name) || STACK_PALETTE[0]
    return {
      name,
      type: 'bar',
      stack: 'tot',
      data,
      itemStyle: {
        color: sk(c1, 'AA', c2),
        borderRadius: [2, 2, 0, 0],
      },
      barWidth: '55%',
    }
  })

  return {
    __stacked: true,
    grid: { left: 96, right: 8, top: 8, bottom: 8, containLabel: false },
    tooltip: { show: false },
    legend: {
      show: names.length > 0,
      orient: 'vertical',
      left: 0,
      top: 'center',
      itemGap: 6,
      itemWidth: 6,
      itemHeight: 6,
      selectedMode: false,
      textStyle: { fontSize: 9 },
      // ECharts stacks series[0] at the bottom; reverse legend so top-to-bottom matches the bar.
      data: [...names].reverse().map((n) => ({ name: n })),
    },
    xAxis: {
      type: 'category',
      data: monthLabels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: D.axis, fontSize: 8 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      interval: 20,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    series,
  }
}

export function categoryMonthlyBarsOption(labels, values) {
  const v = values.map((x) => Number(x) || 0)
  const yMax = niceCeilMax(v)
  return {
    grid: gridStd(),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: labels,
      splitLine: xSplit,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: D.axis, fontSize: 8 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      splitNumber: 4,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: D.axis,
        fontSize: 7,
        formatter: chartAxisLabelFormatter(yMax),
      },
    },
    series: [
      {
        type: 'bar',
        data: v,
        itemStyle: { color: lg('#72cf9e', '#58b895'), borderRadius: [5, 5, 0, 0] },
        barWidth: '48%',
        barCategoryGap: '28%',
      },
    ],
  }
}

const TREEMAP_BLUES = ['#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#64B5F6', '#BBDEFB']

/** Treemap label sizing — overview stays compact; zoomed tiles scale up via mergeTreemapLabelLayout. */
export function createTreemapLabelLayout(zoomed = false) {
  return (params) => {
    const rect = params?.rect
    if (!rect) return {}
    const { width: w, height: h } = rect
    if (w < 5 || h < 5 || w < 36 || h < 24) return { fontSize: 0 }

    const minSide = Math.min(w, h)
    const maxSide = Math.max(w, h)
    const root = Math.sqrt(w * h)

    if (zoomed) {
      const fontSize = Math.round(
        Math.min(36, Math.max(18, root / 6.5, minSide / 9, maxSide / 14))
      )
      return { fontSize, lineHeight: Math.round(fontSize * 1.35) }
    }

    let fontSize = Math.round(Math.max(9, Math.min(12, root / 24, minSide / 16)))
    if (root >= 165) {
      fontSize = Math.round(Math.max(fontSize, Math.min(14, root / 17)))
    }
    return { fontSize, lineHeight: Math.round(fontSize * 1.45) }
  }
}

/** Patch label layout after treemap zoom without replacing series data (preserves view root). */
export function mergeTreemapLabelLayout(chart, zoomed = false) {
  if (!chart) return
  chart.setOption({ series: [{ labelLayout: createTreemapLabelLayout(zoomed) }] })
}

export function isTreemapViewZoomed(chart) {
  const series = chart?.getModel?.()?.getSeriesByIndex(0)
  if (!series || series.subType !== 'treemap') return false
  const treeRoot = series.getData()?.tree?.root
  const viewRoot = series.getViewRoot?.()
  return !!(viewRoot && treeRoot && viewRoot !== treeRoot)
}

export function treemapFromCategories(rows) {
  if (!rows?.length) {
    return {
      title: {
        text: 'No expense data',
        left: 'center',
        top: 'middle',
        textStyle: { color: D.muted, fontSize: 11 },
      },
      series: [],
    }
  }
  const sorted = [...rows].sort((a, b) => Number(b.amount) - Number(a.amount))
  const treemapRsData = sorted.map((d, i) => ({
    name: d.category_name || 'Uncategorized',
    value: Number(d.amount) || 0,
    category_id: d.category_id != null ? Number(d.category_id) : 0,
    itemStyle: { color: TREEMAP_BLUES[Math.min(i, TREEMAP_BLUES.length - 1)] },
    label: {
      color: Number(d.amount) >= 20000 ? 'rgba(255,255,255,0.97)' : 'rgba(0,0,0,0.7)',
    },
  }))
  return {
    tooltip: { show: false },
    series: [
      {
        type: 'treemap',
        roam: false,
        left: 2,
        right: 2,
        top: 2,
        bottom: 2,
        breadcrumb: { show: false },
        itemStyle: { borderColor: '#fff' },
        levels: [
          {
            itemStyle: { borderColor: '#fff', borderWidth: 8, gapWidth: 8, borderRadius: 12 },
          },
        ],
        label: {
          show: true,
          position: 'inside',
          fontSize: 9,
          align: 'center',
          verticalAlign: 'middle',
          lineHeight: 14,
          formatter: (p) => {
            const d = p.data
            if (d != null && typeof d === 'object' && d.name != null) {
              const n = d.value
              const num = Array.isArray(n) ? n[n.length - 1] : n
              return `${d.name}\n${Number(num).toLocaleString()}`
            }
            const v = p.value
            const num = Array.isArray(v) ? v[v.length - 1] : v
            return p.name ? `${p.name}\n${Number(num).toLocaleString()}` : ''
          },
        },
        labelLayout: createTreemapLabelLayout(false),
        upperLabel: { show: false },
        data: treemapRsData,
      },
    ],
  }
}

const SANKEY_HUB = 'Funds'
const SANKEY_SAVINGS = 'Savings'
const SANKEY_SPENDING = 'Spending'
const SANKEY_BLEND = '#FBF5D4'
const SANKEY_HUB_COLOR = '#F2E4A8'
const SANKEY_SAVINGS_COLOR = '#F28C28'
const SANKEY_SPENDING_COLOR = '#52B65A'
const SANKEY_INCOME_COLORS = ['#52B65A', '#1F9E8F', '#6AB04C', '#26A69A', '#7CB342']
const SANKEY_EXPENSE_COLORS = [
  '#1A3D6B', // navy
  '#FF8C2A', // orange
  '#D94F3D', // red
  '#5B3E96', // purple
  '#5C6670', // grey
  '#2F7A52', // green
  '#F5B041', // gold
  '#3D85C6', // blue
]

function sankeyHexToRgb(hex) {
  const h = String(hex || '').replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  if (n.length !== 6) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  }
}

function sankeyRgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function sankeyMixHex(c1, c2, t) {
  const a = sankeyHexToRgb(c1)
  const b = sankeyHexToRgb(c2)
  return sankeyRgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t)
}

/** Income → hub: saturated green/teal at source, pale cream at hub (reference inflow ribbons). */
function sankeyInflowLinkStyle(sourceColor) {
  return {
    color: {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 0,
      colorStops: [
        { offset: 0, color: sourceColor },
        { offset: 0.35, color: sankeyMixHex(sourceColor, SANKEY_BLEND, 0.28) },
        { offset: 0.72, color: sankeyMixHex(sourceColor, SANKEY_BLEND, 0.62) },
        { offset: 1, color: sankeyMixHex(sourceColor, SANKEY_HUB_COLOR, 0.9) },
      ],
    },
    opacity: 0.84,
    curveness: 0.5,
  }
}

/** Hub → category: pale tint at hub deepening to saturated node color (reference outflow ribbons). */
function sankeyOutflowLinkStyle(targetColor) {
  const pale = sankeyMixHex(targetColor, '#FFFFFF', 0.76)
  const mid = sankeyMixHex(targetColor, '#FFFFFF', 0.42)
  return {
    color: {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 1,
      y2: 0,
      colorStops: [
        { offset: 0, color: sankeyMixHex(pale, SANKEY_HUB_COLOR, 0.55) },
        { offset: 0.28, color: pale },
        { offset: 0.62, color: mid },
        { offset: 1, color: targetColor },
      ],
    },
    opacity: 0.9,
    curveness: 0.5,
  }
}

function sankeyNodeName(base, used, fallbackSuffix) {
  const label = String(base || 'Uncategorized').trim() || 'Uncategorized'
  if (!used.has(label)) {
    used.add(label)
    return label
  }
  let n = 2
  let candidate = `${label} ${fallbackSuffix}`
  while (used.has(candidate)) {
    n += 1
    candidate = `${label} ${fallbackSuffix} ${n}`
  }
  used.add(candidate)
  return candidate
}

/** @param {{ income?: Array<{category_name?:string,amount:number}>, expense?: Array<{category_name?:string,amount:number}>, totals?: { income?: number, expense?: number } }} flow */
export function sankeyFromFlow(flow) {
  const incomeRows = (flow?.income || []).filter((r) => Number(r.amount) > 0)
  const expenseRows = (flow?.expense || []).filter((r) => Number(r.amount) > 0)
  const totalIncome =
    Number(flow?.totals?.income) || incomeRows.reduce((s, r) => s + Number(r.amount || 0), 0)
  const totalExpense =
    Number(flow?.totals?.expense) || expenseRows.reduce((s, r) => s + Number(r.amount || 0), 0)

  if (totalIncome <= 0 && totalExpense <= 0) {
    return {
      title: {
        text: 'No flow data',
        left: 'center',
        top: 'middle',
        textStyle: { color: D.muted, fontSize: 11 },
      },
      series: [],
    }
  }

  const nodes = []
  const links = []
  const usedNames = new Set()

  function addNode(name, depth, color, drillMeta = null) {
    nodes.push({
      name,
      depth,
      itemStyle: color ? { color, borderColor: 'rgba(255,255,255,0.85)', borderWidth: 1 } : undefined,
      ...(drillMeta || {}),
    })
  }

  if (totalIncome > 0) {
    incomeRows.forEach((row, i) => {
      const name = sankeyNodeName(row.category_name, usedNames, '(income)')
      const color = SANKEY_INCOME_COLORS[i % SANKEY_INCOME_COLORS.length]
      addNode(name, 0, color, {
        drillable: true,
        categoryId: row.category_id != null ? Number(row.category_id) : 0,
        categoryName: row.category_name || name,
        txnType: 'income',
      })
      links.push({
        source: name,
        target: SANKEY_HUB,
        value: Number(row.amount),
        lineStyle: sankeyInflowLinkStyle(color),
      })
    })
  } else if (totalExpense > 0) {
    addNode(SANKEY_SPENDING, 0, SANKEY_SPENDING_COLOR)
    links.push({
      source: SANKEY_SPENDING,
      target: SANKEY_HUB,
      value: totalExpense,
      lineStyle: sankeyInflowLinkStyle(SANKEY_SPENDING_COLOR),
    })
  }

  addNode(SANKEY_HUB, 1, SANKEY_HUB_COLOR)

  const expenseScale =
    totalIncome > 0 && totalExpense > totalIncome ? totalIncome / totalExpense : 1
  let allocatedExpense = 0

  expenseRows.forEach((row, i) => {
    const name = sankeyNodeName(row.category_name, usedNames, '(expense)')
    const raw = Number(row.amount) || 0
    const value = Math.round(raw * expenseScale * 100) / 100
    if (value <= 0) return
    const color = SANKEY_EXPENSE_COLORS[i % SANKEY_EXPENSE_COLORS.length]
    addNode(name, 2, color, {
      drillable: true,
      categoryId: row.category_id != null ? Number(row.category_id) : 0,
      categoryName: row.category_name || name,
      txnType: 'expense',
    })
    links.push({
      source: SANKEY_HUB,
      target: name,
      value,
      lineStyle: sankeyOutflowLinkStyle(color),
    })
    allocatedExpense += value
  })

  const remainder = Math.max(0, Math.round((totalIncome - allocatedExpense) * 100) / 100)
  if (remainder > 0.01) {
    addNode(SANKEY_SAVINGS, 2, SANKEY_SAVINGS_COLOR)
    links.push({
      source: SANKEY_HUB,
      target: SANKEY_SAVINGS,
      value: remainder,
      lineStyle: sankeyOutflowLinkStyle(SANKEY_SAVINGS_COLOR),
    })
  }

  const nodeCount = nodes.length

  return {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove|click',
      confine: true,
      formatter: (p) => {
        if (p.dataType === 'edge') {
          const v = Number(p.value) || 0
          let amt
          try {
            amt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v)
          } catch {
            amt = String(Math.round(v * 100) / 100)
          }
          return `${p.data.source} → ${p.data.target}<br/>${amt}`
        }
        const v = Number(p.value) || 0
        if (!v) return p.name
        let amt
        try {
          amt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v)
        } catch {
          amt = String(Math.round(v * 100) / 100)
        }
        return `${p.name}<br/>${amt}`
      },
    },
    __sankeyNodeCount: nodeCount,
    series: [
      {
        type: 'sankey',
        left: '3%',
        right: '3%',
        top: 10,
        bottom: 10,
        nodeGap: Math.max(6, Math.min(10, 200 / Math.max(nodeCount, 6))),
        nodeWidth: 16,
        nodeAlign: 'justify',
        layoutIterations: 64,
        emphasis: { focus: 'adjacency', lineStyle: { opacity: 0.95 } },
        lineStyle: { curveness: 0.5 },
        levels: [
          {
            depth: 0,
            label: { position: 'right', distance: 5, fontSize: 9, color: D.muted },
          },
          {
            depth: 1,
            label: { position: 'inside', fontSize: 8, color: 'rgba(0,0,0,0.5)' },
          },
          {
            depth: 2,
            label: { position: 'left', distance: 5, fontSize: 9, color: D.muted },
          },
        ],
        label: {
          show: true,
          color: D.muted,
          fontSize: 9,
        },
        data: nodes,
        links,
      },
    ],
  }
}

export function sankeyChartHeight(option) {
  const n = Number(option?.__sankeyNodeCount) || 6
  return Math.min(480, Math.max(300, n * 34))
}

function compactCategoryAxisLabel(catLen) {
  const dense = catLen > 7
  const medium = catLen > 4
  return {
    show: true,
    color: D.axis,
    fontSize: 7,
    interval: 0,
    hideOverlap: false,
    rotate: dense ? 45 : medium ? 30 : 0,
    margin: dense ? 10 : 6,
    formatter: (name) => {
      const s = String(name || '')
      const max = dense ? 8 : medium ? 10 : 14
      return s.length > max ? `${s.slice(0, max - 1)}…` : s
    },
  }
}

function paretoGridBottom(catLen) {
  if (catLen > 7) return 34
  if (catLen > 4) return 24
  return 18
}

export function paretoOption(sortedCategories, amounts) {
  if (!sortedCategories?.length || !amounts?.length) {
    return {
      grid: gridStd(),
      xAxis: { type: 'category', data: ['—'] },
      yAxis: { type: 'value' },
      series: [],
    }
  }
  const cats = sortedCategories.slice(0, 12)
  const vals = amounts.slice(0, 12)
  const total = vals.reduce((s, v) => s + v, 0)
  let cum = 0
  const paretoCum = vals.map((v) => {
    cum += total > 0 ? (v / total) * 100 : 0
    return Math.min(100, Math.round(cum))
  })
  const paretoBarGrad = vals.map((_, i) => {
    const c = donutChartColor(i)
    return lg(`${c}DD`, c)
  })
  const ymaxBar = niceCeilMax(vals)
  return {
    grid: { left: 4, right: 32, top: 8, bottom: paretoGridBottom(cats.length), containLabel: true },
    tooltip: { show: false },
    legend: { show: false },
    __pareto: true,
    xAxis: {
      type: 'category',
      data: cats,
      axisLine: { show: true, lineStyle: { color: D.grid, width: 0.5 } },
      axisTick: { show: false },
      splitLine: xSplit,
      axisLabel: compactCategoryAxisLabel(cats.length),
    },
    yAxis: [
      {
        type: 'value',
        min: 0,
        max: ymaxBar,
        splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: D.axis,
          fontSize: 7,
          formatter: chartAxisLabelFormatter(ymaxBar),
        },
      },
      {
        type: 'value',
        min: 0,
        max: 100,
        position: 'right',
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: D.axis, fontSize: 7, formatter: '{value}%' },
      },
    ],
    series: [
      {
        name: 'Amount',
        type: 'bar',
        yAxisIndex: 0,
        data: vals.map((v, i) => ({
          value: v,
          itemStyle: { color: paretoBarGrad[i], borderRadius: [5, 5, 0, 0] },
        })),
        barMaxWidth: 16,
      },
      {
        name: 'Cumulative %',
        type: 'line',
        yAxisIndex: 1,
        data: paretoCum,
        smooth: 0.2,
        showSymbol: true,
        symbolSize: 3,
        lineStyle: { color: '#D64550', width: 1.8 },
        itemStyle: { color: '#D64550' },
      },
    ],
  }
}

export function radarBudgetOption(items) {
  const maxVal = Math.max(
    1,
    ...items.map((i) => Math.max(Number(i.budget) || 0, Number(i.actual) || 0))
  )
  const radarAx = items.map((it, idx) => ({
    name: it.category_name || 'Category',
    max: maxVal * 1.05,
    nameTextStyle: { color: donutChartColor(idx), fontSize: 8 },
  }))
  const radarP = items.map((it) => Number(it.budget) || 0)
  const radarA = items.map((it) => Number(it.actual) || 0)
  return {
    tooltip: { show: false },
    legend: {
      show: true,
      bottom: 0,
      data: [
        { name: 'Planned', textStyle: { color: '#26A69A', fontSize: 7 } },
        { name: 'Actual', textStyle: { color: '#1976D2', fontSize: 7 } },
      ],
      itemWidth: 8,
      itemHeight: 8,
    },
    radar: {
      center: ['50%', '48%'],
      radius: '58%',
      shape: 'polygon',
      splitNumber: 4,
      indicator: radarAx,
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
      splitArea: { show: true, areaStyle: { color: ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.04)'] } },
      axisName: { fontSize: 8 },
    },
    series: [
      {
        type: 'radar',
        symbol: 'none',
        data: [
          {
            name: 'Planned',
            value: radarP,
            symbol: 'none',
            areaStyle: { color: 'rgba(38, 166, 154, 0.18)' },
            lineStyle: { color: '#26A69A', width: 1.2 },
          },
          {
            name: 'Actual',
            value: radarA,
            symbol: 'none',
            areaStyle: { color: 'rgba(25, 118, 210, 0.22)' },
            lineStyle: { color: '#1976D2', width: 1.2 },
          },
        ],
      },
    ],
  }
}

export function emptyRadarPlaceholder() {
  return {
    tooltip: { show: false },
    radar: {
      indicator: [{ name: 'No budget data', max: 100 }],
      splitLine: { lineStyle: { type: 'dashed', color: D.grid, width: 0.5 } },
    },
    series: [{ type: 'radar', data: [{ value: [0], name: '—' }] }],
  }
}

function getPrimaryXAxis(option) {
  if (!option?.xAxis) return null
  return Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis
}

function hasCategoryXAxis(option) {
  const xa = getPrimaryXAxis(option)
  return xa?.type === 'category' && Array.isArray(xa.data) && xa.data.length > 0
}

function hasPieSeries(option) {
  const series = option?.series
  if (!series) return false
  const list = Array.isArray(series) ? series : [series]
  return list.some((s) => s?.type === 'pie')
}

export function isPieChartOption(option) {
  return hasPieSeries(option)
}

function hasRadarSeries(option) {
  return !!option?.radar && hasSeriesType(option, 'radar')
}

function hasSeriesType(option, type) {
  const series = option?.series
  const list = Array.isArray(series) ? series : [series]
  return list.some((s) => s?.type === type)
}

export function isRadarChartOption(option) {
  return hasRadarSeries(option)
}

function hasTreemapSeries(option) {
  const series = option?.series
  const list = Array.isArray(series) ? series : [series]
  return list.some((s) => s?.type === 'treemap')
}

export function isTreemapChartOption(option) {
  return hasTreemapSeries(option)
}

function hasSankeySeries(option) {
  const series = option?.series
  const list = Array.isArray(series) ? series : series ? [series] : []
  return list.some((s) => s?.type === 'sankey')
}

export function isSankeyChartOption(option) {
  return hasSankeySeries(option)
}

/** Inline pie/treemap interaction without full modal expand treatment. */
export function interactiveChartOption(option, { selectedIndex = null } = {}) {
  if (!option || typeof option !== 'object') return option
  const seriesList = Array.isArray(option.series) ? option.series : [option.series]
  const nextSeries = seriesList.map((s) => {
    if (s?.type === 'treemap') {
      return {
        ...s,
        roam: true,
        scaleLimit: { min: 0.6, max: 3 },
        nodeClick: false,
      }
    }
    if (s?.type === 'pie') {
      const data = (s.data || []).map((d, i) => ({
        ...d,
        selected: selectedIndex === i,
      }))
      return {
        ...s,
        data,
        selectedMode: 'single',
        selectedOffset: 8,
        emphasis: {
          scale: true,
          scaleSize: 10,
          label: { show: true, fontSize: 10 },
        },
      }
    }
    return s
  })
  return { ...option, series: nextSeries }
}

/** Drop compact-view formatters that hide x-axis ticks (e.g. day 1,6,12 only). */
function maxCategoryLabelLen(labels) {
  return (labels || []).reduce((m, l) => Math.max(m, String(l || '').length), 0)
}

function categoryAxisRotation(catLen, maxLen, compact = false) {
  if (compact) {
    if (catLen > 10 || maxLen > 20) return { rotate: 20, margin: 6, fontSize: 9 }
    if (catLen > 6) return { rotate: 12, margin: 5, fontSize: 9 }
    return { rotate: 0, margin: 6, fontSize: 9 }
  }
  if (catLen > 10 || maxLen > 20) return { rotate: 50, margin: 14, fontSize: 10 }
  if (catLen > 6 || maxLen > 14) return { rotate: 42, margin: 12, fontSize: 10 }
  if (catLen > 3 || maxLen > 10) return { rotate: 35, margin: 10, fontSize: 10 }
  return { rotate: 0, margin: 8, fontSize: 11 }
}

function expandedCategoryGridBottom(baseGrid, catLen, labels = [], compact = false) {
  const maxLen = maxCategoryLabelLen(labels)
  const base = typeof baseGrid?.bottom === 'number' ? baseGrid.bottom : 16
  // containLabel already reserves axis label space — keep explicit bottom modest
  if (compact) {
    if (catLen > 10 || maxLen > 20) return Math.max(base, 20)
    if (catLen > 6) return Math.max(base, 18)
    return Math.max(base, 14)
  }
  if (catLen > 10 || maxLen > 20) return Math.max(base, 40)
  if (catLen > 6 || maxLen > 14) return Math.max(base, 34)
  if (catLen > 3 || maxLen > 10) return Math.max(base, 28)
  return Math.max(base, 22)
}

function expandedCategoryAxisLabel(axisLabel, catLen, labels = [], compact = false) {
  const base = { color: D.axis, ...(axisLabel || {}) }
  if (typeof base.formatter === 'function') {
    delete base.formatter
  }
  const maxLen = maxCategoryLabelLen(labels)
  const { rotate, margin, fontSize } = categoryAxisRotation(catLen, maxLen, compact)
  return {
    ...base,
    show: true,
    interval: 0,
    hideOverlap: false,
    fontSize,
    rotate,
    margin,
  }
}

function expandedXAxis(xAxis, catLen, compact = false) {
  const patch = (a) => ({
    ...a,
    axisLabel: expandedCategoryAxisLabel(a.axisLabel, catLen, a.data, compact),
  })
  return Array.isArray(xAxis) ? xAxis.map(patch) : patch(xAxis)
}

function expandedIeProgressionXAxis(xAxis, catLen, compact = false) {
  const step = ieProgressionAxisLabelStep(catLen)
  const { rotate, margin, fontSize } = categoryAxisRotation(catLen, 8, compact)
  const patch = (a) => ({
    ...a,
    axisLabel: {
      color: D.axis,
      show: true,
      fontSize,
      rotate,
      margin,
      interval: step === 2 ? 1 : 0,
      hideOverlap: true,
    },
  })
  return Array.isArray(xAxis) ? xAxis.map(patch) : patch(xAxis)
}

function expandedYAxis(yAxis) {
  const patch = (a) => ({
    ...a,
    axisLabel: {
      ...(a.axisLabel || {}),
      show: true,
      fontSize: Math.max(9, Number(a.axisLabel?.fontSize) || 8) + 2,
    },
  })
  if (!yAxis) return yAxis
  return Array.isArray(yAxis) ? yAxis.map(patch) : patch(yAxis)
}

function initialDataZoomRange(catLen) {
  if (catLen <= 12) return null
  const windowSize = 10
  const end = Math.min(100, Math.round((windowSize / catLen) * 100))
  return { start: 0, end }
}

/** Enable tooltip, zoom/pan, and slightly larger labels for the expanded chart modal. */
export function expandChartOption(option, { selectedIndex = null, compact = false } = {}) {
  if (!option || typeof option !== 'object') return option

  const next = { ...option }
  const pie = hasPieSeries(option)
  const radar = !!option.radar
  const sankey = hasSankeySeries(option)
  const catLen = hasCategoryXAxis(option) ? getPrimaryXAxis(option).data.length : 0

  if (pie) {
    const tall = !!option.__donutTall
    const pieSeries = (Array.isArray(option.series) ? option.series : [option.series]).find(
      (s) => s?.type === 'pie'
    )
    const rows = (pieSeries?.data || [])
      .filter((d) => d.name !== 'No data')
      .map((d, i) => ({
        name: d.name,
        value: d.value,
        color:
          d.itemStyle?.color?.colorStops?.[1]?.color ||
          d.itemStyle?.color?.colorStops?.[0]?.color ||
          donutChartColor(i),
      }))
    if (rows.length) {
      const expanded = buildDonutOption(rows, { tall, expanded: true })
      next.series = expanded.series
      next.__donutTotal = expanded.__donutTotal
      next.__donutTall = tall
    }
  }

  next.tooltip = {
    ...(option.tooltip || {}),
    show: true,
    trigger: pie || radar || sankey ? 'item' : 'axis',
    confine: true,
    ...(sankey ? { triggerOn: 'click' } : {}),
    ...(pie
      ? {
          formatter: (params) => {
            const name = params?.name || ''
            const value = formatChartAmount(params?.value)
            const pct = params?.percent != null ? params.percent.toFixed(2) : '0'
            return `${name}<br/>${value} (${pct}%)`
          },
        }
      : {}),
    ...(pie || radar || sankey ? {} : { axisPointer: { type: 'shadow' } }),
  }

  const baseGrid = option.grid && typeof option.grid === 'object' ? { ...option.grid } : gridStd()
  const zoomRange = initialDataZoomRange(catLen)
  const categoryLabels = hasCategoryXAxis(option) ? getPrimaryXAxis(option).data || [] : []

  if (option.__pareto) {
    next.tooltip = {
      ...(next.tooltip || {}),
      formatter: (params) => {
        const rows = Array.isArray(params) ? params : [params]
        const bar = rows.find((p) => p.seriesName === 'Amount')
        const line = rows.find((p) => p.seriesName === 'Cumulative %')
        if (!bar) return ''
        const name = bar.name || bar.axisValue || ''
        const raw = bar.value?.value ?? bar.value
        const amount = formatChartAmount(raw)
        const cum = line != null ? `${line.value}%` : ''
        return cum
          ? `${name}<br/>Amount: ${amount}<br/>Cumulative: ${cum}`
          : `${name}<br/>Amount: ${amount}`
      },
    }
  }

  if (option.__stacked) {
    next.tooltip = {
      ...(next.tooltip || {}),
      formatter: (params) => {
        const rows = Array.isArray(params) ? params : [params]
        const header = rows[0]?.axisValueLabel || rows[0]?.axisValue || ''
        const lines = rows
          .filter((p) => Number(p.value) > 0)
          .map((p) => `${p.marker || ''}${p.seriesName}: ${formatStackedPercent(p.value)}`)
        return lines.length ? `${header}<br/>${lines.join('<br/>')}` : header
      },
    }
  }

  if (hasCategoryXAxis(option)) {
    next.xAxis = option.__ieProgression
      ? expandedIeProgressionXAxis(option.xAxis, catLen, compact)
      : expandedXAxis(option.xAxis, catLen, compact)

    if (zoomRange) {
      const bottom =
        expandedCategoryGridBottom(baseGrid, catLen, categoryLabels, compact) +
        (compact ? 4 : 32)
      next.grid = { ...baseGrid, containLabel: true, bottom }
      const zoomOpts = { xAxisIndex: 0, filterMode: 'none', ...zoomRange }
      const insideZoom = {
        type: 'inside',
        ...zoomOpts,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
      }
      next.dataZoom = compact
        ? [insideZoom]
        : [
            insideZoom,
            {
              type: 'slider',
              ...zoomOpts,
              height: 22,
              bottom: 4,
            },
          ]
    } else if (catLen > 5) {
      next.grid = {
        ...baseGrid,
        containLabel: true,
        bottom: expandedCategoryGridBottom(baseGrid, catLen, categoryLabels, compact),
      }
      next.dataZoom = [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'none',
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: true,
        },
      ]
    } else {
      next.grid = {
        ...baseGrid,
        containLabel: true,
        bottom: expandedCategoryGridBottom(baseGrid, catLen, categoryLabels, compact),
      }
    }
  } else {
    next.grid = { ...baseGrid, containLabel: true }
  }

  if (option.yAxis) {
    next.yAxis = expandedYAxis(option.yAxis)
  }

  if (option.series) {
    const seriesList = Array.isArray(option.series) ? option.series : [option.series]
    next.series = (Array.isArray(next.series) ? next.series : seriesList).map((s, si) => {
      if (s?.type === 'treemap') {
        return {
          ...s,
          roam: true,
          scaleLimit: { min: 0.6, max: 3 },
          nodeClick: false,
        }
      }
      if (s?.type === 'sankey') {
        return {
          ...s,
          left: '2%',
          right: '2%',
          top: 16,
          bottom: 16,
          nodeWidth: 18,
          levels: s.levels?.length
            ? s.levels.map((lvl) => ({
                ...lvl,
                label: {
                  ...(lvl.label || {}),
                  fontSize: Math.max(11, Number(lvl.label?.fontSize) || 9) + 2,
                },
              }))
            : [
                { depth: 0, label: { position: 'right', fontSize: 11 } },
                { depth: 1, label: { position: 'right', fontSize: 11 } },
                { depth: 2, label: { position: 'left', fontSize: 11 } },
              ],
          label: {
            ...(s.label || {}),
            fontSize: Math.max(10, Number(s.label?.fontSize) || 9) + 2,
          },
        }
      }
      if (s?.type === 'pie') {
        const src = (Array.isArray(next.series) ? next.series : seriesList)[si] || s
        const data = (src.data || []).map((d, i) => ({
          ...d,
          selected: selectedIndex === i,
        }))
        return {
          ...src,
          data,
          selectedMode: 'single',
          selectedOffset: 10,
          emphasis: {
            scale: true,
            scaleSize: 14,
            label: { show: true, fontSize: 12 },
          },
        }
      }
      if (s?.type === 'bar' && (zoomRange || option.__pareto)) {
        return { ...s, barMaxWidth: option.__pareto ? 36 : 28, barWidth: '55%' }
      }
      return s
    })
  }

  if (radar && Array.isArray(option.__radarItems) && option.__radarItems.length) {
    const items = option.__radarItems
    next.tooltip = {
      ...(next.tooltip || {}),
      triggerOn: 'click',
      formatter: (params) => {
        const idx = params?.dataIndex
        if (params?.seriesType === 'radar' && idx != null && items[idx]) {
          const item = items[idx]
          const planned = formatChartAmount(Number(item.budget) || 0)
          const actual = formatChartAmount(Number(item.actual) || 0)
          return `${item.category_name}<br/>Planned: ${planned}<br/>Actual: ${actual}`
        }
        const item = items.find((it) => it.category_name === params?.name)
        if (!item) return ''
        const planned = formatChartAmount(Number(item.budget) || 0)
        const actual = formatChartAmount(Number(item.actual) || 0)
        return `${item.category_name}<br/>Planned: ${planned}<br/>Actual: ${actual}`
      },
    }
  }

  if (option.radar) {
    next.radar = {
      ...option.radar,
      axisName: option.radar.axisName
        ? {
            ...option.radar.axisName,
            fontSize: Math.max(9, Number(option.radar.axisName.fontSize) || 8) + 3,
          }
        : option.radar.axisName,
      indicator: (option.radar.indicator || []).map((ind) => ({
        ...ind,
        nameTextStyle: {
          ...(ind.nameTextStyle || {}),
          fontSize: Math.max(9, Number(ind.nameTextStyle?.fontSize) || 8) + 2,
        },
      })),
    }
  }

  return next
}
