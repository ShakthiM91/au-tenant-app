<template>
  <div class="card project-overview">
    <div class="card-header">
      <span class="card-title">Project Overview</span>
      <button class="dropdown-btn">
        Our Wedding ❤
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M6.75 8.25L9 10.5L11.25 8.25" stroke="#6E6A7C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="overview-body">
      <!-- Left Column: Tasks + Gauge -->
      <div class="left-col">
        <span class="col-label">Tasks</span>
        <div class="task-stats">
          <div class="stat-row">
            <div class="stat stat-overdue">
              <span class="stat-label">Overdue</span>
              <span class="stat-value">8</span>
            </div>
            <div class="stat stat-inprogress">
              <span class="stat-label">In Progress</span>
              <span class="stat-value">5</span>
            </div>
          </div>
          <div class="stat-row">
            <div class="stat stat-pending">
              <span class="stat-label">Pending</span>
              <span class="stat-value">87</span>
            </div>
            <div class="stat stat-completed">
              <span class="stat-label">Completed</span>
              <span class="stat-value">66</span>
            </div>
          </div>
        </div>

        <div class="gauge-container">
          <svg viewBox="0 0 152 80" class="gauge-svg">
            <path
              d="M 10 76 A 66 66 0 0 1 142 76"
              fill="none"
              stroke="#D9D9D9"
              stroke-width="12"
              stroke-linecap="round"
            />
            <path
              :d="gaugeArcPath"
              fill="none"
              stroke="#52BF90"
              stroke-width="12"
              stroke-linecap="round"
            />
            <line
              :x1="needleX1" :y1="needleY1"
              :x2="needleX2" :y2="needleY2"
              stroke="rgba(0,0,0,0.72)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle :cx="needleX2" :cy="needleY2" r="3" fill="#52BF90"/>
          </svg>
          <div class="gauge-text">
            <span class="gauge-value">39%</span>
            <span class="gauge-label">Completed</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Budget + Upcoming -->
      <div class="right-col">
        <div class="budget-section">
          <span class="col-label">Budget</span>
          <div class="budget-rows">
            <div class="budget-row">
              <span class="budget-label">Planned</span>
              <span class="budget-value">3,600,000</span>
            </div>
            <div class="budget-row">
              <span class="budget-label">Spent</span>
              <span class="budget-value">2,368,500</span>
            </div>
            <div class="budget-row">
              <span class="budget-label">Remaining</span>
              <span class="budget-value">1,231,500</span>
            </div>
            <div class="budget-row">
              <span class="budget-label">Divertible</span>
              <span class="budget-value">500,000</span>
            </div>
          </div>
        </div>

        <div class="upcoming-section">
          <span class="col-label">Upcoming Payments</span>
          <div class="payment-rows">
            <div class="payment-row">
              <span class="payment-name">Venue</span>
              <span class="payment-amount">200,000</span>
            </div>
            <div class="payment-row">
              <span class="payment-name">Videographer</span>
              <span class="payment-amount">90,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const percentage = 39
const radius = 66
const cx = 76
const cy = 76

const gaugeArcPath = computed(() => {
  const startAngle = Math.PI
  const endAngle = startAngle + (Math.PI * percentage) / 100
  const startX = cx + radius * Math.cos(startAngle)
  const startY = cy + radius * Math.sin(startAngle)
  const endX = cx + radius * Math.cos(endAngle)
  const endY = cy + radius * Math.sin(endAngle)
  const largeArc = percentage > 50 ? 1 : 0
  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`
})

const needleAngle = computed(() => Math.PI + (Math.PI * percentage) / 100)
const needleLength = 48
const needleX1 = computed(() => cx)
const needleY1 = computed(() => cy)
const needleX2 = computed(() => cx + needleLength * Math.cos(needleAngle.value))
const needleY2 = computed(() => cy + needleLength * Math.sin(needleAngle.value))
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

.overview-body {
  display: flex;
  gap: 8px;
}

.left-col,
.right-col {
  flex: 1;
  min-width: 0;
}

.col-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 6px;
}

.task-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.stat-row {
  display: flex;
  gap: 8px;
}

.stat {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-label {
  font-size: 9px;
  color: #6E6A7C;
}

.stat-value {
  font-size: 11px;
  font-weight: 700;
  color: #1A1A2E;
}

.stat-overdue .stat-label,
.stat-overdue .stat-value {
  color: rgba(195, 0, 16, 0.74);
}

.stat-pending .stat-label,
.stat-pending .stat-value {
  color: #A8A8A8;
}

.stat-completed .stat-label,
.stat-completed .stat-value {
  color: #52BF90;
}

.stat-inprogress .stat-label,
.stat-inprogress .stat-value {
  color: rgba(0, 0, 0, 0.72);
}

.gauge-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-svg {
  width: 100%;
  max-width: 152px;
  height: auto;
}

.gauge-text {
  position: absolute;
  bottom: 4px;
  right: 4px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.gauge-value {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 141, 40, 0.75);
}

.gauge-label {
  font-size: 8px;
  color: #6E6A7C;
}

.budget-section {
  margin-bottom: 10px;
}

.budget-rows {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.budget-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-label {
  font-size: 10px;
  color: #6E6A7C;
}

.budget-value {
  font-size: 10px;
  font-weight: 600;
  color: #1A1A2E;
}

.upcoming-section {
  border-top: 1px solid #F0F0F0;
  padding-top: 8px;
}

.payment-rows {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-name {
  font-size: 10px;
  color: #6E6A7C;
}

.payment-amount {
  font-size: 10px;
  font-weight: 600;
  color: #1A1A2E;
}
</style>
