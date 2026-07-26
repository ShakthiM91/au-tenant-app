/** Analytics donut slice palette (cycles when there are more categories than colors). */
export const DONUT_CHART_COLORS = [
  '#C9302C',
  '#5CB85C',
  '#337AB7',
  '#F1C40F',
  '#A389D4',
  '#E67E22',
  '#1ABC9C',
  '#566573',
  '#F875AA',
  '#5DADE2',
  '#D21312',
  '#4CAE4C',
  '#4B49AC',
  '#EDBB99',
  '#495057',
  '#20C997',
  '#F0AD4E',
  '#EF6262',
  '#0056B3',
  '#8E44AD',
  '#7DCEA0',
  '#DC7633',
  '#6C757D',
  '#82AAE3',
  '#BB86FC',
  '#117A65',
  '#BDC3C7',
  '#D9534F',
  '#28A745',
  '#F39C12',
  '#007BFF',
  '#6F42C1',
  '#999999',
  '#F06292',
  '#2A5C82',
  '#218838',
  '#EC971F',
  '#7D3C98',
  '#FFD3B6',
  '#1F4E79',
  '#A3E4D7',
  '#85929E',
  '#FF9494',
  '#91C8E4',
  '#F5B041',
  '#A9CCE3',
  '#E6B0AA',
  '#2980B9',
  '#EC407A',
  '#D6DBDF',
]

export const DONUT_OTHER_COLOR = '#999999'

export function donutChartColor(index) {
  const i = Number(index) || 0
  const len = DONUT_CHART_COLORS.length
  if (!len) return '#999999'
  return DONUT_CHART_COLORS[((i % len) + len) % len]
}
