<template>
  <div class="card account-overview">
    <div class="card-header">
      <span class="card-title">Account Overview</span>
      <button class="dropdown-btn">
        {{ selectedAccount }}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M6.75 8.25L9 10.5L11.25 8.25" stroke="#6E6A7C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="overview-panels">
      <!-- Income Panel -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-label">Income</span>
          <button class="mini-dropdown">
            This Month
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M6.75 8.25L9 10.5L11.25 8.25" stroke="#6E6A7C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="amount-row">
          <div class="amount-group">
            <span class="amount">618,000.16</span>
            <span class="currency">Rs</span>
          </div>
          <span class="badge positive">
            + 1.8%
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 2L9 6H2L5.5 2Z" fill="#52BF90"/>
            </svg>
          </span>
        </div>
        <div class="chart-container income-chart">
          <Line :data="incomeChartData" :options="incomeChartOptions" />
        </div>
      </div>

      <!-- Expense Panel -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-label">Expense</span>
          <button class="mini-dropdown">
            This Month
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M6.75 8.25L9 10.5L11.25 8.25" stroke="#6E6A7C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="amount-row">
          <div class="amount-group">
            <span class="amount">313,633.16</span>
            <span class="currency">Rs</span>
          </div>
          <span class="badge negative">
            - 9.8%
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 9L2 5H9L5.5 9Z" fill="rgba(195, 0, 16, 0.74)"/>
            </svg>
          </span>
        </div>
        <div class="chart-container donut-chart">
          <Doughnut :data="expenseChartData" :options="expenseChartOptions" />
          <div class="donut-labels">
            <div v-for="cat in expenseCategories" :key="cat.label" class="donut-label">
              <span class="cat-name">{{ cat.label }}</span>
              <span class="cat-pct">{{ cat.pct }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cash Flow -->
    <div class="cashflow-section">
      <div class="cashflow-header">
        <span class="section-label">Cash Flow</span>
        <button class="mini-dropdown">
          Last Year
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M6.75 8.25L9 10.5L11.25 8.25" stroke="#6E6A7C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="cashflow-chart">
        <Bar :data="cashFlowData" :options="cashFlowOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { Line, Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip
)

const selectedAccount = 'Household Expenses'

// Income line/area chart
const incomeChartData = {
  labels: Array.from({ length: 30 }, (_, i) => i + 1),
  datasets: [{
    data: [
      380000, 410000, 395000, 420000, 450000, 440000, 470000, 490000,
      480000, 510000, 500000, 520000, 540000, 540919, 530000, 550000,
      560000, 570000, 580000, 590000, 600000, 605000, 610000, 615000,
      618000, 610000, 615000, 618000, 620000, 618000
    ],
    borderColor: '#52BF90',
    backgroundColor: 'rgba(82, 191, 144, 0.1)',
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    borderWidth: 2
  }]
}

const incomeChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { tooltip: { enabled: false }, legend: { display: false } },
  scales: {
    x: { display: false },
    y: { display: false }
  }
}

// Expense donut chart
const expenseCategories = [
  { label: 'Rent', pct: 30, color: '#75000A' },
  { label: 'Family', pct: 25, color: '#9C000D' },
  { label: 'Groceries', pct: 20, color: '#CF3340' },
  { label: 'Utility', pct: 15, color: '#DB6670' },
  { label: 'Other', pct: 10, color: 'rgba(168, 168, 168, 0.8)' }
]

const expenseChartData = {
  labels: expenseCategories.map(c => c.label),
  datasets: [{
    data: expenseCategories.map(c => c.pct),
    backgroundColor: expenseCategories.map(c => c.color),
    borderWidth: 0,
    cutout: '70%'
  }]
}

const expenseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { tooltip: { enabled: false }, legend: { display: false } }
}

// Cash flow bar chart
const cashFlowData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [{
    data: [120000, -35000, 130000, 115000, 118000, 80000, 48000, 105000, 23000, 130000, 30000, 38000],
    backgroundColor: (ctx) => {
      const val = ctx.raw
      return val >= 80000 ? '#52BF90' : 'rgba(195, 0, 16, 0.74)'
    },
    borderRadius: 3,
    barPercentage: 0.55
  }]
}

const cashFlowOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { tooltip: { enabled: false }, legend: { display: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 8 }, color: '#6E6A7C' }
    },
    y: {
      min: -120000,
      max: 200000,
      grid: { color: '#F0F0F0' },
      ticks: {
        font: { size: 8 },
        color: '#6E6A7C',
        callback: (v) => {
          if (v === 0) return '0'
          return (v / 1000) + 'k'
        },
        stepSize: 40000
      }
    }
  }
}
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A2E;
}

.dropdown-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  font-size: 11px;
  color: #6E6A7C;
  cursor: pointer;
  padding: 0;
}

.overview-panels {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.panel {
  flex: 1;
  min-width: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.panel-label {
  font-size: 12px;
  font-weight: 600;
  color: #1A1A2E;
}

.mini-dropdown {
  display: flex;
  align-items: center;
  gap: 1px;
  background: none;
  border: none;
  font-size: 9px;
  color: #6E6A7C;
  cursor: pointer;
  padding: 0;
}

.mini-dropdown svg {
  width: 14px;
  height: 14px;
}

.amount-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.amount-group {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.amount {
  font-size: 13px;
  font-weight: 700;
  color: #1A1A2E;
}

.currency {
  font-size: 10px;
  color: #6E6A7C;
}

.badge {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 9px;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 4px;
}

.badge.positive {
  color: #52BF90;
  background: rgba(82, 191, 144, 0.1);
}

.badge.negative {
  color: rgba(195, 0, 16, 0.74);
  background: rgba(195, 0, 16, 0.1);
}

.chart-container {
  position: relative;
}

.income-chart {
  height: 80px;
}

.donut-chart {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 86px;
}

.donut-chart canvas {
  max-width: 86px;
  max-height: 86px;
}

.donut-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.donut-label {
  display: flex;
  flex-direction: column;
}

.cat-name {
  font-size: 7px;
  color: #6E6A7C;
}

.cat-pct {
  font-size: 7px;
  font-weight: 600;
  color: #1A1A2E;
}

.cashflow-section {
  border-top: 1px solid #F0F0F0;
  padding-top: 12px;
}

.cashflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #1A1A2E;
}

.cashflow-chart {
  height: 135px;
}
</style>
