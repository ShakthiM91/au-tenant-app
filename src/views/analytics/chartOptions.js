/** Shared ECharts option builders for Analytics (light theme; matches existing screen styles). */

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

const DONUT_COLORS = [
  '#1976D2',
  '#FF9800',
  '#F06292',
  '#7E57C2',
  '#66BB6A',
  '#9E9E9E',
  '#5C9FD4',
  '#E57373',
  '#26A69A',
  '#FFD92F',
  '#9C6BCE',
  '#FF8A65',
]

export function niceCeilMax(values, fallback = 1000) {
  const raw = Math.max(0, ...values.map((v) => Number(v) || 0))
  if (raw <= 0) return fallback
  const exp = Math.floor(Math.log10(raw))
  const step = 10 ** exp
  return Math.ceil(raw / step) * step
}

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
        formatter: (v) => (v === 0 ? '0' : `${Math.round(v / 1000)}k`),
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

export function incomeExpenseBarOption(monthLabels, income, expense) {
  const n = Math.max(monthLabels?.length || 0, income?.length || 0, expense?.length || 0, 1)
  const labels = monthLabels?.length ? monthLabels : Array.from({ length: n }, () => '—')
  const inc = (income?.length ? income : Array(n).fill(0)).map((v) => Number(v) || 0)
  const exp = (expense?.length ? expense : Array(n).fill(0)).map((v) => Number(v) || 0)
  const yMax = niceCeilMax([...inc, ...exp])
  const gIn = lg('#8FD99A', '#4CA658')
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
        formatter: (v) => (v === 0 ? '0' : `${Math.round(v / 1000)}k`),
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
  base.series[0].itemStyle = { color: lg('#8FD99A', '#4CA658'), borderRadius: [9, 9, 0, 0] }
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
  const pos = lg('#C8E6C9', '#1B5E20')
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
        formatter: (v) => `${Math.round(v / 1000)}k`,
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
  const gWfP = lg('#A5D6A7', '#1B5E20')
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
        formatter: (v) => (v >= 1e6 ? `${v / 1e6}M` : `${Math.round(v / 1000)}k`),
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

function buildDonutOption(rows, { tall = false } = {}) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  const sliceCap = tall ? 14 : 10
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  const top = sorted.slice(0, sliceCap - 1)
  const rest = sorted.slice(sliceCap - 1)
  const otherVal = rest.reduce((s, r) => s + r.value, 0)
  const slices =
    otherVal > 0 ? [...top, { name: 'Other', value: otherVal }] : top

  const subLabelRich = {}
  slices.forEach((s, i) => {
    const c = s.color || DONUT_COLORS[i % DONUT_COLORS.length]
    subLabelRich[`sn${i}`] = { color: c, fontSize: 6, lineHeight: 10, align: 'left' }
    subLabelRich[`sp${i}`] = { color: c, fontSize: 7, fontWeight: 600, lineHeight: 10, align: 'left' }
  })

  const scTop = (hex) => (hex.length === 7 ? `${hex}E0` : hex)
  const pieData = slices.map((s, i) => {
    const c = s.color || DONUT_COLORS[i % DONUT_COLORS.length]
    return {
      name: s.name,
      value: s.value,
      itemStyle: {
        color: lg(scTop(c), c),
        borderColor: '#fff',
        borderWidth: 2,
      },
    }
  })

  return {
    tooltip: { show: false },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        padAngle: 1.2,
        minShowLabelAngle: 0.2,
        radius: tall ? ['40%', '58%'] : ['40%', '62%'],
        center: ['50%', '50%'],
        data: pieData,
        label: {
          show: true,
          minMargin: 1,
          edgeDistance: 3,
          formatter: (p) => {
            const pct = total > 0 ? ((p.value / total) * 100).toFixed(2) : '0'
            return p.dataIndex == null ? '' : `{sn${p.dataIndex}|${p.name}}\n{sp${p.dataIndex}|${pct}%}`
          },
          rich: subLabelRich,
        },
        labelLine: {
          show: true,
          lineStyle: { color: '#C8C8C8', width: 0.75, type: [3, 3] },
          length: 6,
          length2: 10,
          smooth: 0.2,
        },
        emphasis: { disabled: true },
      },
    ],
  }
}

/** @param {{ category_name: string, amount: number }[]} rows */
export function categoryDonutFromRows(rows, opts) {
  const mapped = (rows || [])
    .filter((r) => Number(r.amount) > 0)
    .map((r, i) => ({
      name: r.category_name || 'Uncategorized',
      value: Number(r.amount) || 0,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }))
  if (!mapped.length) {
    return {
      tooltip: { show: false },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: opts?.tall ? ['40%', '58%'] : ['40%', '62%'],
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

const xLab136182430 = (i) => [0, 5, 11, 17, 23, 29].includes(i)

export function dailyExpenseAnalysisOption(daysInMonth, expenseByDayIndex) {
  const labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))
  const vals = labels.map((_, i) => Number(expenseByDayIndex[i] || 0))
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
      axisLabel: {
        color: D.axis,
        fontSize: 7,
        formatter: (v, i) => (xLab136182430(i) ? v : ''),
      },
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
        formatter: (v) => `${Math.round(v / 1000)}k`,
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
        formatter: (v) => `${Math.round(v / 1000)}k`,
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
    grid: gridStd(),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: dayLabels,
      splitLine: xSplit,
      axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.12)' } },
      axisTick: { show: false },
      axisLabel: {
        color: D.axis,
        fontSize: 7,
        formatter: (v, i) => (xLab136182430(i) ? v : ''),
      },
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
        formatter: (v) => `${Math.round(v / 1000)}k`,
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
  const yMax = niceCeilMax([...cumIncome, ...cumExpense])
  return {
    grid: gridStd(),
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: dayLabels,
      splitLine: xSplit,
      axisLine: { show: true, lineStyle: { color: 'rgba(0,0,0,0.1)', width: 0.5 } },
      axisTick: { show: false },
      axisLabel: {
        color: D.axis,
        fontSize: 7,
        formatter: (v, i) => ([0, 5, 11, 17, 23, 29].includes(i) ? v : ''),
      },
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
        formatter: (v) => `${Math.round(v / 1000)}k`,
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

const STACK_PALETTE = [
  ['#FFB74D', '#E65100'],
  ['#F48FB1', '#C2185B'],
  ['#64B5F6', '#0D47A1'],
  ['#E0E0E0', '#757575'],
  ['#A5D6A7', '#2E7D32'],
  ['#B39DDB', '#4527A0'],
]

function sk(a, t, b) {
  return lg(a + t, b)
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
  const nameSet = new Set()
  slices.forEach((s) => (s.parents || []).forEach((p) => nameSet.add(p.name)))
  const names = [...nameSet]

  if (!names.length) {
    return {
      grid: gridStd(),
      xAxis: { type: 'category', data: monthLabels.length ? monthLabels : ['—'] },
      yAxis: { type: 'value', max: 100 },
      series: [],
    }
  }

  const series = names.map((name, si) => {
    const data = slices.map((month) => {
      const parents = month.parents || []
      const row = parents.find((p) => p.name === name)
      const amt = row ? Number(row.amount) : 0
      const tot = parents.reduce((s, p) => s + Number(p.amount), 0)
      return tot > 0 ? (amt / tot) * 100 : 0
    })
    const [c1, c2] = STACK_PALETTE[si % STACK_PALETTE.length]
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
      textStyle: { fontSize: 7 },
      data: names.map((n) => ({ name: n })),
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
        formatter: (val) => (val === 0 ? '0' : `${Math.round(val / 1000)}k`),
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
          fontSize: 7,
          align: 'center',
          verticalAlign: 'middle',
          lineHeight: 12,
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
        upperLabel: { show: false },
        data: treemapRsData,
      },
    ],
  }
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
    const c = DONUT_COLORS[i % DONUT_COLORS.length]
    return lg(`${c}DD`, c)
  })
  const ymaxBar = niceCeilMax(vals)
  return {
    grid: { left: 4, right: 32, top: 8, bottom: 4, containLabel: true },
    tooltip: { show: false },
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: cats,
      axisLine: { show: true, lineStyle: { color: D.grid, width: 0.5 } },
      axisTick: { show: false },
      splitLine: xSplit,
      axisLabel: { show: false },
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
          formatter: (v) => `${Math.round(v / 1000)}k`,
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
    nameTextStyle: { color: DONUT_COLORS[idx % DONUT_COLORS.length], fontSize: 6 },
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
      axisName: { fontSize: 6 },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            name: 'Planned',
            value: radarP,
            areaStyle: { color: 'rgba(38, 166, 154, 0.18)' },
            lineStyle: { color: '#26A69A', width: 1.2 },
          },
          {
            name: 'Actual',
            value: radarA,
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
      indicator: [{ name: 'No ongoing budget', max: 100 }],
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

/** Drop compact-view formatters that hide x-axis ticks (e.g. day 1,6,12 only). */
function expandedCategoryAxisLabel(axisLabel, catLen) {
  const base = { color: D.axis, ...(axisLabel || {}) }
  if (typeof base.formatter === 'function') {
    delete base.formatter
  }
  const dense = catLen > 12
  const medium = catLen > 7
  return {
    ...base,
    show: true,
    interval: 0,
    hideOverlap: false,
    fontSize: Math.max(9, Number(base.fontSize) || 8) + (dense ? 0 : 1),
    rotate: dense ? 45 : medium ? 30 : 0,
    margin: dense ? 12 : 8,
  }
}

function expandedXAxis(xAxis, catLen) {
  const patch = (a) => ({
    ...a,
    axisLabel: expandedCategoryAxisLabel(a.axisLabel, catLen),
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
export function expandChartOption(option) {
  if (!option || typeof option !== 'object') return option

  const next = { ...option }
  const pie = hasPieSeries(option)
  const radar = !!option.radar
  const catLen = hasCategoryXAxis(option) ? getPrimaryXAxis(option).data.length : 0

  next.tooltip = {
    ...(option.tooltip || {}),
    show: true,
    trigger: pie || radar ? 'item' : 'axis',
    confine: true,
    ...(pie || radar ? {} : { axisPointer: { type: 'shadow' } }),
  }

  const baseGrid = option.grid && typeof option.grid === 'object' ? { ...option.grid } : gridStd()
  const zoomRange = initialDataZoomRange(catLen)

  if (hasCategoryXAxis(option)) {
    next.xAxis = expandedXAxis(option.xAxis, catLen)

    if (zoomRange) {
      const bottom = typeof baseGrid.bottom === 'number' ? baseGrid.bottom : 20
      next.grid = { ...baseGrid, containLabel: true, bottom: bottom + 40 }
      const zoomOpts = { xAxisIndex: 0, filterMode: 'none', ...zoomRange }
      next.dataZoom = [
        {
          type: 'inside',
          ...zoomOpts,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: true,
        },
        {
          type: 'slider',
          ...zoomOpts,
          height: 22,
          bottom: 4,
        },
      ]
    } else if (catLen > 5) {
      next.grid = { ...baseGrid, containLabel: true }
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
      next.grid = { ...baseGrid, containLabel: true }
    }
  } else {
    next.grid = { ...baseGrid, containLabel: true }
  }

  if (option.yAxis) {
    next.yAxis = expandedYAxis(option.yAxis)
  }

  if (option.series) {
    const seriesList = Array.isArray(option.series) ? option.series : [option.series]
    next.series = seriesList.map((s) => {
      if (s?.type === 'treemap') {
        return { ...s, roam: true, scaleLimit: { min: 0.6, max: 3 } }
      }
      if (s?.type === 'pie' && s.label) {
        return { ...s, label: { ...s.label, fontSize: Math.max(10, Number(s.label.fontSize) || 7) + 2 } }
      }
      if (s?.type === 'bar' && zoomRange) {
        return { ...s, barMaxWidth: 28, barWidth: '55%' }
      }
      return s
    })
  }

  if (option.radar) {
    next.radar = {
      ...option.radar,
      axisName: option.radar.axisName
        ? {
            ...option.radar.axisName,
            fontSize: Math.max(9, Number(option.radar.axisName.fontSize) || 6) + 3,
          }
        : option.radar.axisName,
    }
  }

  return next
}
