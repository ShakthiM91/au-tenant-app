import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  BarChart,
  LineChart,
  PieChart,
  SankeyChart,
  RadarChart,
  TreemapChart,
} from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent, RadarComponent } from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  SankeyChart,
  TreemapChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent,
])
