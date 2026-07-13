<template>
  <ion-page class="transactions-page">
    <ion-content :fullscreen="true" :scroll-y="true">
      <div class="page-container">
        <!-- Header (Accounts Ledger design style) -->
        <div class="top-header" :class="{ 'top-header--island-menu-open': showIslandOptionsMenu }">
          <button type="button" class="back-btn" @click="$router.back()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8D28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="header-center">
            <span class="header-title">{{ workspaceName || 'All transactions' }}</span>
            <span class="header-subtitle">Transaction Log</span>
          </div>
          <div v-if="showIslandOptionsButton" class="header-actions">
            <div class="tx-island-menu-wrapper" @click.stop>
              <button
                type="button"
                class="icon-btn"
                aria-label="Island options"
                @click.stop="toggleIslandOptionsMenu($event)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8D28" stroke-width="2" stroke-linecap="round">
                  <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
              <Transition name="popover-fade">
                <div
                  v-if="showIslandOptionsMenu"
                  class="island-options-popover"
                  :class="{ 'island-options-popover--up': islandOptionsPopoverOpenUp }"
                  @click.stop
                >
                  <button
                    v-for="item in islandMenuItems"
                    :key="item.role"
                    type="button"
                    class="island-popover-option"
                    :class="{ destructive: item.destructive }"
                    @click="onIslandMenuSelect(item.role)"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <Transition name="fade">
          <div
            v-if="showIslandOptionsMenu"
            class="island-options-backdrop"
            @click="closeIslandOptionsMenu"
          />
        </Transition>

        <!-- Summary Grid -->
        <div class="summary-grid">
          <div class="sum-cell">
            <span class="sum-label">Income</span>
            <span class="sum-val positive">{{ formatCurrency(summary.total_income) }}</span>
          </div>
          <div class="sum-cell">
            <span class="sum-label">Expense</span>
            <span class="sum-val negative">{{ formatCurrency(summary.total_expense) }}</span>
          </div>
          <div class="sum-cell">
            <span class="sum-label">Net</span>
            <span class="sum-val" :class="net >= 0 ? 'positive' : 'negative'">{{ formatCurrency(net) }}</span>
          </div>
        </div>

        <!-- Filter row (same pattern as Flow Log) -->
        <div class="ledger-filter-row" :class="{ 'ledger-filter-row--search-open': filterMode === 'search' }">
          <div
            class="ledger-filter-search-slot"
            :class="{ 'ledger-filter-search-slot--expanded': filterMode === 'search' }"
          >
            <button
              type="button"
              class="filter-pill filter-pill-icon"
              :class="{ active: filterMode === 'search' }"
              aria-label="Search"
              @click="toggleSearchMode"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8D28" stroke-width="2" stroke-linecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <input
              v-if="filterMode === 'search'"
              ref="searchInputRef"
              v-model="searchQuery"
              type="search"
              class="ledger-inline-search-input"
              placeholder="Search transactions…"
              enterkeyhint="search"
              autocapitalize="off"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="ledger-filter-trailing">
            <button
              type="button"
              class="filter-pill filter-pill-date"
              :class="{ active: !!(dateFrom || dateTo) }"
              @click="openDateFilter"
            >
              <svg class="filter-pill-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <svg class="filter-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="filter-pill-wrap">
              <button
                type="button"
                class="filter-pill filter-pill-grow"
                :class="{ active: categoryMenuOpen || categoryFilterIds.length > 0 }"
                @click.stop="openCategoryMenu"
              >
                <span class="filter-pill-label filter-pill-label-truncate">{{ categoryButtonLabel }}</span>
                <svg class="filter-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div v-if="categoryMenuOpen" class="filter-flyout filter-flyout-categories" @click.stop>
                <div
                  v-if="categoriesLoading && !incomeCategoryTree.length && !expenseCategoryTree.length"
                  class="filter-flyout-loading filter-flyout-categories-loading-inner"
                >
                  Loading…
                </div>
                <template v-else>
                  <div class="filter-flyout-categories-scroll">
                    <div class="filter-flyout-cat-header">
                      <label class="filter-flyout-row filter-flyout-row-all-categories">
                        <input
                          type="checkbox"
                          class="filter-flyout-cb"
                          :checked="categoryFilterIds.length === 0"
                          @change="onAllCategoriesCheckboxChange"
                        />
                        <span class="filter-flyout-row-text filter-flyout-row-text-strong">All categories</span>
                      </label>
                      <div
                        v-if="incomeCategoryTree.length || expenseCategoryTree.length"
                        class="filter-flyout-categories-search-wrap"
                      >
                        <input
                          v-model="categoryFilterSearch"
                          type="search"
                          class="filter-flyout-categories-search"
                          placeholder="Search categories…"
                          enterkeyhint="search"
                          autocapitalize="off"
                          autocomplete="off"
                          spellcheck="false"
                          @click.stop
                        />
                      </div>
                    </div>
                    <template v-if="categoryFilterHasRenderableTree">
                      <div v-if="filteredIncomeCategoryTree.length" class="filter-flyout-cat-section">
                        <div class="filter-flyout-cat-section-title">Income</div>
                        <CategoryTreeRows
                          :nodes="filteredIncomeCategoryTree"
                          :selected-set="categorySelectionSet"
                          @toggle="onCategoryTreeToggle"
                        />
                      </div>
                      <div v-if="filteredExpenseCategoryTree.length" class="filter-flyout-cat-section">
                        <div class="filter-flyout-cat-section-title">Expense</div>
                        <CategoryTreeRows
                          :nodes="filteredExpenseCategoryTree"
                          :selected-set="categorySelectionSet"
                          @toggle="onCategoryTreeToggle"
                        />
                      </div>
                    </template>
                    <div
                      v-else-if="incomeCategoryTree.length || expenseCategoryTree.length"
                      class="filter-flyout-loading filter-flyout-cat-empty"
                    >
                      No matching categories
                    </div>
                    <div v-else class="filter-flyout-loading filter-flyout-cat-empty">No categories</div>
                  </div>
                </template>
              </div>
            </div>
            <div class="filter-pill-wrap filter-pill-wrap-type">
              <button
                type="button"
                class="filter-pill filter-pill-grow filter-pill-type-btn"
                :class="{ active: typeMenuOpen || flowTypeFilterValues.length > 0 }"
                @click.stop="openTypeMenu"
              >
                <span class="filter-pill-label filter-pill-label-truncate">{{ flowTypeButtonLabel }}</span>
                <svg class="filter-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A8A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div v-if="typeMenuOpen" class="filter-flyout filter-flyout-type" @click.stop>
                <label class="filter-flyout-row">
                  <input
                    type="checkbox"
                    class="filter-flyout-cb"
                    :checked="flowTypeFilterValues.length === 0"
                    @change="onAllFlowTypesCheckboxChange"
                  />
                  <span class="filter-flyout-row-text">All types</span>
                </label>
                <label
                  v-for="f in filterTypeOptions"
                  :key="f.value"
                  class="filter-flyout-row"
                >
                  <input
                    type="checkbox"
                    class="filter-flyout-cb"
                    :checked="isFlowTypeFilterSelected(f.value)"
                    @change="onFlowTypeCheckboxChange(f.value, $event)"
                  />
                  <span class="filter-flyout-row-text">{{ f.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <Transition name="fade">
          <div
            v-if="categoryMenuOpen || typeMenuOpen"
            class="filter-menu-backdrop"
            @click="closeFilterMenus"
          />
        </Transition>

        <DateRangePicker
          :model-value="{ from: dateFrom, to: dateTo }"
          :visible="showDatePicker"
          quick-presets="month"
          @close="showDatePicker = false"
          @select="onDateRangeSelect"
        />

        <!-- Entry count -->
        <div v-if="!loading && displayList.length" class="entry-count-wrapper">
          <span class="entry-count-line" />
          <span class="entry-count">Showing {{ displayList.length }} entries</span>
          <span class="entry-count-line" />
        </div>

        <!-- Transaction List (grouped by day) -->
        <div v-if="!loading && groupedByDate.length" class="transactions-list">
          <div
            v-for="group in groupedByDate"
            :key="group.dateKey"
            class="day-group"
          >
            <div class="day-header">{{ group.dateLabel }}</div>
            <div class="day-card">
              <div
                v-for="(row, idx) in group.items"
                :key="row.id"
                class="transaction-row"
                :class="{ 'has-separator': idx < group.items.length - 1 }"
                :id="row._pending ? undefined : 'tx-row-' + row.id"
                @click="onRowClick(row)"
              >
                <div class="tx-main">
                  <div class="tx-row-top">
                    <span class="tx-description">{{ row.title || row.transaction_number || '-' }}</span>
                    <span class="tx-top-right">
                      <ion-icon v-if="row._pending" :icon="cloudOfflineOutline" class="pending-icon" title="Not synced" />
                      <span class="tx-amount" :class="amountClass(row.type)">
                        {{ formatAmountShort(row) }}
                      </span>
                      <!-- <button
                        v-if="rowHasOverflowActions(row)"
                        class="more-btn"
                        @click.stop="openRowOptions(row)"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#6E6A7C">
                          <circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>
                        </svg>
                      </button> -->
                    </span>
                  </div>
                  <div class="tx-row-bottom">
                    <span class="tx-user-line">
                      <svg class="person-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                      </svg>
                      <strong>{{ getUserLabel(row) }}</strong> at <strong>{{ formatTime(row.transaction_date) }}</strong>
                    </span>
                    <span class="tx-category-pill">{{ getCategoryLabel(row) }}</span>
                    <span v-if="isExcludedFromReports(row)" class="tx-excluded-pill">Excluded</span>
                    <span v-if="formatBalance(row)" class="tx-balance">{{ formatBalance(row) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="loading && list.length === 0" class="loading-state">
          <ion-spinner name="crescent" />
        </div>

        <div v-else-if="!loading && displayList.length === 0" class="empty-state">
          <p>No transactions</p>
        </div>

        <!-- Infinite scroll -->
        <div v-if="hasMore && !loading" class="load-more">
          <ion-spinner v-if="loadingMore" name="crescent" />
          <button v-else class="load-more-btn" @click="loadMore">Load more</button>
        </div>
      </div>
      <div class="tab-spacer" />
    </ion-content>

    <FloatingAddButton v-if="transactionsFabVisible" @select="onFabSelect" />

    <AccountForm
      :is-open="accountFormOpen"
      :account="null"
      :preselected-workspace-id="accountFormWorkspaceId ?? null"
      @close="onAccountFormClose"
      @success="onAccountFormSuccess"
    />

    <IslandForm
      :is-open="islandFormOpen"
      :workspace="islandFormWorkspace"
      @close="islandFormOpen = false; islandFormWorkspace = null"
      @success="onIslandFormSuccess"
    />

    <ShareAccess
      :is-open="showShareAccess"
      :group="shareAccessGroup"
      @close="showShareAccess = false; shareAccessGroup = null"
      @success="onShareAccessSuccess"
    />

    <!-- Transaction detail (same flow as Flow Log: preview then Edit) -->
    <ion-modal mode="ios"
      :is-open="detailVisible"
      @didDismiss="onDetailModalDismiss"
      :initial-breakpoint="1"
      :breakpoints="[0, 0.55, 0.85, 1]"
      :handle="true"
    >
      <ion-header v-if="selectedTransaction">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="onDetailModalDismiss">Close</ion-button>
          </ion-buttons>
          <ion-title>Transaction Details</ion-title>
          <ion-buttons slot="end">
            <ion-button
              v-if="detailModalShowEditButton()"
              @click="goEditTransaction(selectedTransaction)"
            >
              Edit
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content v-if="selectedTransaction" class="detail-modal-content">
        <div class="detail-sheet">
          <div class="detail-grid">
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>
                <span>Transaction ID</span>
              </div>
              <span class="detail-cell-value">{{ selectedTransaction.transaction_number || selectedTransaction.id || '—' }}</span>
            </div>
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon type-icon" :class="detailAmountToneClass(selectedTransaction)">
                  <svg v-if="selectedTransaction.type === 'income'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="7 13 12 18 17 13"/><line x1="12" y1="18" x2="12" y2="6"/>
                  </svg>
                  <svg v-else-if="selectedTransaction.type === 'expense'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="7 11 12 6 17 11"/><line x1="12" y1="6" x2="12" y2="18"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/>
                  </svg>
                </span>
                <span>Type</span>
              </div>
              <span class="detail-cell-value" :class="detailAmountToneClass(selectedTransaction)">{{ formatTransactionTypeLabel(selectedTransaction.type) }}</span>
            </div>
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 22a8 8 0 0 1 16 0"/><circle cx="10" cy="8" r="4"/><path d="M14 2a6 6 0 0 1 5 9"/></svg></span>
                <span>Island</span>
              </div>
              <span class="detail-cell-value">{{ detailIslandLabel(selectedTransaction) }}</span>
            </div>
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></span>
                <span>Account</span>
              </div>
              <span class="detail-cell-value">{{ detailAccountLabel(selectedTransaction) }}</span>
            </div>
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg></span>
                <span>Category</span>
              </div>
              <span class="detail-cell-value">
                <span class="detail-pill">{{ getCategoryLabel(selectedTransaction) || '—' }}</span>
              </span>
            </div>
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h10M4 18h14"/></svg></span>
                <span>Title</span>
              </div>
              <span class="detail-cell-value">{{ detailTransactionTitle(selectedTransaction) || '—' }}</span>
            </div>
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                <span>Date & time</span>
              </div>
              <span class="detail-cell-value">{{ formatDateAtTime(selectedTransaction.transaction_date) }}</span>
            </div>
            <div class="detail-cell">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg></span>
                <span>Status</span>
              </div>
              <span class="detail-cell-value">{{ paymentStatusLabel(selectedTransaction) }}</span>
            </div>
            <div class="detail-cell detail-cell-span-full detail-exclude-row">
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M7.5 7.5C5.7 8.9 4.5 11 4.5 13.5A7.5 7.5 0 0 0 12 21c2.5 0 4.6-1.2 6-3"/></svg></span>
                <span>Exclude from reports</span>
              </div>
              <div class="detail-exclude-control">
                <ion-toggle
                  :checked="isExcludedFromReports(selectedTransaction)"
                  :disabled="selectedTransaction._pending"
                  @ionChange="onDetailExcludeToggle"
                />
                <span class="detail-exclude-hint">Omitted from analytics charts. Balance unchanged.</span>
              </div>
            </div>
            <div
              class="detail-cell detail-cell-span-full"
              v-if="detailReferenceLabel(selectedTransaction)"
            >
              <div class="detail-cell-label">
                <span class="detail-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
                <span>Reference</span>
              </div>
              <span class="detail-cell-value">{{ detailReferenceLabel(selectedTransaction) }}</span>
            </div>
          </div>

          <div class="detail-amount-block">
            <span class="detail-amount-full" :class="detailAmountToneClass(selectedTransaction)">{{ formatDetailPrimaryAmount(selectedTransaction) }}</span>
          </div>

          <div class="detail-audit" v-if="hasAuditInfo(selectedTransaction)">
            <div class="detail-audit-row" v-if="transactionHasCreatedAudit(selectedTransaction)">
              <span class="detail-audit-label">Created by</span>
              <div class="detail-audit-right">
                <span class="detail-audit-who">{{ formatTransactionAuthorLabel(selectedTransaction, userStore.id) }}</span>
                <span class="detail-audit-when" v-if="selectedTransaction.created_at">On {{ formatDateAtTime(selectedTransaction.created_at) }}</span>
              </div>
            </div>
            <div class="detail-audit-row" v-if="selectedTransaction.updated_by_name || selectedTransaction.updated_at">
              <span class="detail-audit-label">Last edited by</span>
              <div class="detail-audit-right">
                <span class="detail-audit-who">{{ formatTransactionEditorLabel(selectedTransaction, userStore.id) }}</span>
                <span class="detail-audit-when" v-if="selectedTransaction.updated_at">On {{ formatDateAtTime(selectedTransaction.updated_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </ion-content>
    </ion-modal>

  </ion-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonToggle,
  onIonViewDidEnter
} from '@ionic/vue'
import { cloudOfflineOutline } from 'ionicons/icons'
import { showToast, showActionSheet, showConfirmDialog } from '@/utils/ionicFeedback'
import { getTransactions, deleteTransaction, getSummary, getCategoryTree, updateTransaction } from '@/api/accounting'
import { getWorkspaces, getSharedWorkspaces, deleteWorkspace } from '@/api/workspace'
import { getTenantDefaultCurrency } from '@/api/currency'
import { getPendingWrites, deleteEntry } from '@/db/pendingWrites'
import { invalidateAccountingCache } from '@/db/readCache'
import { useSyncStore } from '@/store/sync'
import { useUserStore } from '@/store/user'
import { refreshBootstrapCache } from '@/utils/bootstrapCache'
import {
  buildIslandMenuItems,
  formatIslandDisplayName,
  islandMenuPopoverOpensUpward,
} from '@/utils/islandMenu.js'
import AccountForm from '@/views/accounts/components/AccountForm.vue'
import IslandForm from '@/views/accounts/components/IslandForm.vue'
import ShareAccess from '@/views/accounts/components/ShareAccess.vue'
import {
  formatTransactionAuthorLabel,
  formatTransactionEditorLabel,
  transactionHasCreatedAudit
} from '@/utils/transactionAuthorDisplay'
import FloatingAddButton from '@/components/FloatingAddButton.vue'
import CategoryTreeRows from '@/components/CategoryTreeRows.vue'

import DateRangePicker from '@/components/DateRangePicker.vue'
import {
  normalizeCategoryTreeResponse,
  filterActiveCategoriesForMenu,
  flattenCategoryLabels,
  filterCategoryNodesBySearch,
  buildCategoryNodeMapFromTrees,
  expandedCategoryIdsForQuery,
} from '@/utils/categoryFilterTree.js'

const router = useRouter()
const route = useRoute()
const syncStore = useSyncStore()
const userStore = useUserStore()

const workspaceId = computed(() => {
  const id = route.query.workspace_id
  return id != null && id !== '' ? id : null
})
const workspaceName = computed(() => {
  const name = route.query.workspace_name
  return name ? decodeURIComponent(name) : null
})

function focusTransactionIdFromRoute() {
  const raw = route.query.focus_transaction_id
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isNaN(n) ? null : n
}

const resolvedWorkspaceId = computed(() => {
  const id = workspaceId.value
  if (id == null || id === '') return null
  const n = Number(id)
  return Number.isNaN(n) ? null : n
})

/** Hide FAB when viewing another tenant’s workspace with view-only merged scope. */
const transactionsFabVisible = ref(true)
/** Merged permission_scope when `workspace_id` is in the route (island transaction log). */
const listWorkspacePermissionScope = ref(null)
const currentWorkspaceRow = ref(null)
const currentWorkspaceIsShared = ref(false)

const showIslandOptionsMenu = ref(false)
const islandOptionsPopoverOpenUp = ref(false)
const accountFormOpen = ref(false)
const accountFormWorkspaceId = ref(null)
const islandFormOpen = ref(false)
const islandFormWorkspace = ref(null)
const showShareAccess = ref(false)
const shareAccessGroup = ref(null)

const isIslandTransactionLog = computed(() => {
  const q = route.query
  if (q.default_island === '1') return true
  if (q.workspace_name != null && String(q.workspace_name).trim() !== '') return true
  if (q.workspace_id != null && String(q.workspace_id).trim() !== '') return true
  if (Object.prototype.hasOwnProperty.call(q, 'workspace_id') && q.workspace_name) return true
  return false
})

const currentIslandGroup = computed(() => {
  if (!isIslandTransactionLog.value) return null

  const row = currentWorkspaceRow.value
  const nameFromRoute = workspaceName.value
    ? String(workspaceName.value).replace(/\s+Island$/i, '').trim()
    : 'Default'

  if (row) {
    return {
      island: {
        id: row.id ?? null,
        name: row.name || nameFromRoute,
        is_shared: currentWorkspaceIsShared.value,
        permission_scope: row.permission_scope ?? listWorkspacePermissionScope.value,
        can_share_workspace: row.can_share_workspace === true
      },
      accounts: []
    }
  }

  const wid = workspaceId.value
  return {
    island: {
      id: wid != null && wid !== '' ? (Number.isNaN(Number(wid)) ? wid : Number(wid)) : null,
      name: nameFromRoute,
      is_shared: false,
      permission_scope: listWorkspacePermissionScope.value,
      can_share_workspace: false
    },
    accounts: []
  }
})

const islandMenuItems = computed(() => {
  const group = currentIslandGroup.value
  if (!group) return []
  return buildIslandMenuItems(group).filter((item) => item.role !== 'transaction-log')
})

const showIslandOptionsButton = computed(() => islandMenuItems.value.length > 0)

function listScopeAllowsTransactionEdit(scope) {
  if (!scope) return true
  return !!(scope.edit_transaction || scope.full_access || scope.implicit_full)
}

/** Delete: full_access or workspace owner/admin/creator (implicit_full), not edit-only. */
function listScopeAllowsTransactionDelete(scope) {
  if (!scope) return true
  return !!(scope.full_access || scope.implicit_full)
}

async function refreshWorkspaceListPermissions() {
  const widRaw = workspaceId.value
  listWorkspacePermissionScope.value = null
  currentWorkspaceRow.value = null
  currentWorkspaceIsShared.value = false
  if (widRaw == null || widRaw === '') {
    transactionsFabVisible.value = true
    return
  }
  const wid = Number(widRaw)
  if (Number.isNaN(wid)) {
    transactionsFabVisible.value = true
    return
  }
  try {
    const [ownRes, sharedRes] = await Promise.all([getWorkspaces(), getSharedWorkspaces()])
    const own = Array.isArray(ownRes?.data) ? ownRes.data : []
    const shared = Array.isArray(sharedRes?.data?.active) ? sharedRes.data.active : []
    const ownRow = own.find((w) => Number(w.id) === wid)
    const sharedRow = shared.find((w) => Number(w.id) === wid)
    const row = ownRow || sharedRow
    currentWorkspaceRow.value = row ?? null
    currentWorkspaceIsShared.value = !!sharedRow && !ownRow
    const s = row?.permission_scope ?? null
    listWorkspacePermissionScope.value = s
    if (!s) {
      transactionsFabVisible.value = true
      return
    }
    transactionsFabVisible.value = !!(s.add_transaction || s.full_access || s.implicit_full)
  } catch {
    listWorkspacePermissionScope.value = null
    currentWorkspaceRow.value = null
    currentWorkspaceIsShared.value = false
    transactionsFabVisible.value = true
  }
}
const list = ref([])
const listQuery = ref({ limit: 30, offset: 0 })
const summary = ref({ total_income: 0, total_expense: 0 })
const defaultCurrency = ref({ code: 'USD' })
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const filterMode = ref('') // '' | 'search'
const searchQuery = ref('')
const searchInputRef = ref(null)
const dateFrom = ref('')
const dateTo = ref('')
const showDatePicker = ref(false)
/** Selected flow-style types; empty = all. Maps to API `types` (transfer_in/out → transfer). */
const flowTypeFilterValues = ref([])
const categoryFilterIds = ref([])
const categoryMenuOptions = ref([])
const incomeCategoryTree = ref([])
const expenseCategoryTree = ref([])
const categoryFilterSearch = ref('')
const categoriesLoading = ref(false)
const categoryMenuOpen = ref(false)
const typeMenuOpen = ref(false)
const detailVisible = ref(false)
const selectedTransaction = ref(null)

const filterTypeOptions = [
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
  { label: 'Transfer In', value: 'transfer_in' },
  { label: 'Transfer Out', value: 'transfer_out' }
]

const categoryNodeById = computed(() =>
  buildCategoryNodeMapFromTrees(incomeCategoryTree.value, expenseCategoryTree.value)
)

const categorySelectionSet = computed(() => new Set(categoryFilterIds.value.map(Number)))

const filteredIncomeCategoryTree = computed(() =>
  filterCategoryNodesBySearch(incomeCategoryTree.value, categoryFilterSearch.value)
)
const filteredExpenseCategoryTree = computed(() =>
  filterCategoryNodesBySearch(expenseCategoryTree.value, categoryFilterSearch.value)
)

const categoryFilterHasRenderableTree = computed(
  () =>
    filteredIncomeCategoryTree.value.length > 0 || filteredExpenseCategoryTree.value.length > 0
)

const categoryButtonLabel = computed(() => {
  const ids = categoryFilterIds.value
  if (!ids.length) return 'Category'
  if (ids.length === 1) {
    const id = ids[0]
    const node = categoryNodeById.value.get(Number(id))
    const pathLabel = categoryMenuOptions.value.find((o) => o.id === id)?.label ?? ''
    const isParent = !!(node?.children?.length)
    let text = String(pathLabel || node?.name || 'Category').trim()
    if (text.length > 22) text = `${text.slice(0, 20)}…`
    return isParent ? `${text} · incl. subs` : text
  }
  return `${ids.length} categories`
})

const flowTypeButtonLabel = computed(() => {
  const sel = flowTypeFilterValues.value
  if (!sel.length) return 'Type'
  if (sel.length === 1) {
    const f = filterTypeOptions.find((o) => o.value === sel[0])
    const label = f?.label ?? sel[0]
    return label.length > 16 ? `${label.slice(0, 14)}…` : label
  }
  return `${sel.length} types`
})

function isTransactionEntry(entry) {
  return entry.method === 'POST' && typeof entry.url === 'string' && entry.url.includes('transactions')
}

function pendingEntryToRow(entry) {
  const p = entry.payload || {}
  const dateVal = p.transaction_date || ''
  return {
    id: 'pending_' + entry.id,
    _pending: true,
    _pendingId: entry.id,
    transaction_number: p.transaction_number || '-',
    title: p.title || '',
    transaction_date: dateVal,
    type: p.type || 'expense',
    amount: p.amount ?? 0,
    currency: p.currency || defaultCurrency.value?.code || 'USD',
    category_name: p.category_name || '-',
    category: p.category_name || '-'
  }
}

function payloadToRow(id, payload) {
  const p = payload || {}
  const dateVal = p.transaction_date || ''
  return {
    id: 'pending_' + id,
    _pending: true,
    _pendingId: id,
    transaction_number: p.transaction_number || '-',
    title: p.title || '',
    transaction_date: dateVal,
    type: p.type || 'expense',
    amount: p.amount ?? 0,
    currency: p.currency || defaultCurrency.value?.code || 'USD',
    category_name: p.category_name || '-',
    category: p.category_name || '-'
  }
}

const net = computed(() => (summary.value.total_income || 0) - (summary.value.total_expense || 0))

const hasMore = computed(() => !finished.value)

const displayList = computed(() => list.value)

/** Normalize any date string to YYYY-MM-DD for consistent grouping by calendar day */
function toDateKey(dateStr) {
  if (!dateStr) return 'unknown'
  const parsed = new Date(typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr)
  if (Number.isNaN(parsed.getTime())) return 'unknown'
  const y = parsed.getFullYear()
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Group transactions by date (newest first) */
const groupedByDate = computed(() => {
  const items = displayList.value
  const groups = new Map()
  for (const row of items) {
    const dateKey = toDateKey(row.transaction_date)
    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        dateKey,
        dateLabel: formatDateHeader(dateKey),
        items: []
      })
    }
    groups.get(dateKey).items.push(row)
  }
  return Array.from(groups.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
})

function onDateRangeSelect({ from, to }) {
  dateFrom.value = from
  dateTo.value = to || from
  onFilter()
}

function formatDateHeader(s) {
  if (!s) return '-'
  const d = new Date(s.split(' ')[0] || s.split('T')[0])
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatCurrency(v, code) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code || defaultCurrency.value?.code || 'USD',
    minimumFractionDigits: 2
  }).format(v || 0)
}

function formatDate(s) {
  if (!s) return '-'
  const d = new Date(s)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getCategoryLabel(row) {
  return row.category_name || row.category || '-'
}

/** Island (workspace) the transaction's account belongs to; accounts without a workspace are the Default Island. */
function detailIslandLabel(row) {
  if (!row) return '—'
  const name = (row.account_workspace_name || '').toString().trim()
  return name || 'Default Island'
}

function detailAccountLabel(row) {
  if (!row) return '—'
  if (row.type === 'transfer') {
    const from = row.account_name || '—'
    const to = row.to_account_name || '—'
    return `${from} → ${to}`
  }
  return row.account_name || '—'
}

function formatAmountShort(row) {
  const amt = formatCurrency(row.amount, row.currency)
  if (row.type === 'income') return amt
  if (row.type === 'transfer') return `→ ${amt}`
  return amt
}

function formatTime(s) {
  if (!s) return '-'
  const d = new Date(s.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return '-'
  const h = d.getHours()
  const m = d.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function getUserLabel(row) {
  return formatTransactionAuthorLabel(row, userStore.id)
}

function formatBalance(row) {
  // TODO: API does not return balance_after for transactions list; add when available
  if (row.balance_after != null) {
    return formatCurrency(row.balance_after, row.currency)
  }
  return ''
}

function amountClass(type) {
  if (type === 'income') return 'income'
  if (type === 'transfer') return 'transfer'
  return 'expense'
}

function formatDateAtTime(dateString) {
  if (!dateString) return '—'
  const d = new Date(String(dateString).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return '—'
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date} at ${time}`
}

function formatTransactionTypeLabel(type) {
  if (type === 'income') return 'Income'
  if (type === 'expense') return 'Expense'
  if (type === 'transfer') return 'Transfer'
  if (type) return String(type)
  return '—'
}

function paymentStatusLabel(row) {
  if (!row) return '—'
  return row.status === 'pending' ? 'Pending' : row.status === 'cancelled' ? 'Cancelled' : 'Paid'
}

/** Modal amount / type icon tone: matches Flow Log positive / negative / transfer. */
function detailAmountToneClass(row) {
  if (!row) return ''
  if (row.type === 'income') return 'positive'
  if (row.type === 'expense') return 'negative'
  if (row.type === 'transfer') return 'transfer'
  return ''
}

function detailTransactionTitle(row) {
  if (!row) return ''
  return (row.title || '').toString().trim()
}

function detailReferenceLabel(row) {
  if (!row) return ''
  const desc = (row.description || '').trim()
  const txnNum = row.transaction_number || ''
  if (desc && desc !== txnNum) return desc
  return ''
}

function hasAuditInfo(row) {
  if (!row) return false
  return !!(
    transactionHasCreatedAudit(row) ||
    row.updated_by_name ||
    row.updated_at
  )
}

function formatDetailPrimaryAmount(row) {
  if (!row) return '—'
  const cur = row.currency || defaultCurrency.value?.code || 'USD'
  const n = Math.abs(Number(row.amount) || 0)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 2
  }).format(n)
  if (row.type === 'transfer') return `→ ${formatted}`
  if (row.type === 'income') return `+${formatted}`
  if (row.type === 'expense') return `-${formatted}`
  return formatted
}

function pendingMatchesTypeFilter(rowType) {
  const sel = flowTypeFilterValues.value
  if (!sel.length) return true
  const allowed = new Set()
  for (const v of sel) {
    if (v === 'transfer_in' || v === 'transfer_out') allowed.add('transfer')
    else allowed.add(v)
  }
  return allowed.has(rowType)
}

async function loadCategoryMenu() {
  categoriesLoading.value = true
  try {
    const wsId = resolvedWorkspaceId.value
    const [incomeRes, expenseRes] = await Promise.all([
      getCategoryTree('income', wsId),
      getCategoryTree('expense', wsId)
    ])
    const incomeData = filterActiveCategoriesForMenu(normalizeCategoryTreeResponse(incomeRes))
    const expenseData = filterActiveCategoriesForMenu(normalizeCategoryTreeResponse(expenseRes))
    incomeCategoryTree.value = incomeData
    expenseCategoryTree.value = expenseData
    const flat = [...flattenCategoryLabels(incomeData), ...flattenCategoryLabels(expenseData)]
    const byId = new Map()
    for (const o of flat) {
      if (!byId.has(o.id)) byId.set(o.id, o)
    }
    categoryMenuOptions.value = [...byId.values()].sort((a, b) => a.label.localeCompare(b.label))
  } catch (_) {
    incomeCategoryTree.value = []
    expenseCategoryTree.value = []
    categoryMenuOptions.value = []
  } finally {
    categoriesLoading.value = false
  }
}

function closeFilterMenus() {
  categoryMenuOpen.value = false
  categoryFilterSearch.value = ''
  typeMenuOpen.value = false
  closeIslandOptionsMenu()
}

function closeIslandOptionsMenu() {
  showIslandOptionsMenu.value = false
  islandOptionsPopoverOpenUp.value = false
}

function toggleIslandOptionsMenu(event) {
  categoryMenuOpen.value = false
  categoryFilterSearch.value = ''
  typeMenuOpen.value = false
  if (showIslandOptionsMenu.value) {
    closeIslandOptionsMenu()
    return
  }
  const trigger = event?.currentTarget
  showIslandOptionsMenu.value = true
  nextTick(() => {
    islandOptionsPopoverOpenUp.value = islandMenuPopoverOpensUpward(
      trigger,
      islandMenuItems.value.length
    )
  })
}

function onIslandMenuSelect(role) {
  closeIslandOptionsMenu()
  handleIslandMenuAction(role, currentIslandGroup.value)
}

function islandNavQuery(island, islandName) {
  const q = new URLSearchParams()
  if (island?.id != null && island.id !== '') {
    q.set('workspace_id', String(island.id))
  } else if (Object.prototype.hasOwnProperty.call(route.query, 'workspace_id') || route.query.default_island === '1') {
    q.set('workspace_id', '')
  }
  if (islandName) q.set('workspace_name', encodeURIComponent(islandName))
  return q.toString()
}

function handleIslandMenuAction(role, group) {
  if (!group) return
  const island = group.island
  const islandName = formatIslandDisplayName(island)

  if (role === 'add-entry') {
    if (island?.id != null && island.id !== '') {
      router.push(
        `/transactions/create?workspace_id=${island.id}&workspace_name=${encodeURIComponent(islandName)}`
      )
    } else {
      router.push(
        `/transactions/create?default_island=1&workspace_name=${encodeURIComponent(islandName)}`
      )
    }
  } else if (role === 'add-account') {
    accountFormWorkspaceId.value = island?.id != null ? island.id : null
    accountFormOpen.value = true
  } else if (role === 'transaction-log') {
    const qs = islandNavQuery(island, islandName)
    router.replace(qs ? `/transactions?${qs}` : '/transactions')
  } else if (role === 'manage-categories') {
    const qs = islandNavQuery(island, islandName)
    router.push(qs ? `/accounting/categories?${qs}` : '/accounting/categories')
  } else if (role === 'manage-budget') {
    goManageBudgetForIsland(island, islandName)
  } else if (role === 'rename') {
    islandFormWorkspace.value = island
    islandFormOpen.value = true
  } else if (role === 'share-access') {
    shareAccessGroup.value = group
    showShareAccess.value = true
  } else if (role === 'destructive') {
    onDeleteIsland(group)
  }
}

function goManageBudgetForIsland(island, islandName) {
  const wsId = island?.id != null && island.id !== '' ? Number(island.id) : null
  if (wsId == null) {
    showToast('Budget setup requires an island with a workspace')
    return
  }
  router.push({
    name: 'BudgetManagement',
    query: {
      workspace_id: String(wsId),
      workspace_name: encodeURIComponent(islandName || '')
    }
  })
}

function onAccountFormClose() {
  accountFormOpen.value = false
  accountFormWorkspaceId.value = null
}

async function onAccountFormSuccess() {
  onAccountFormClose()
  await invalidateAccountingCache({ accounts: true })
  await refreshBootstrapCache().catch(() => {})
}

async function onIslandFormSuccess() {
  islandFormOpen.value = false
  islandFormWorkspace.value = null
  await invalidateAccountingCache({ accounts: true })
  await refreshWorkspaceListPermissions()
  await refreshData()
}

async function onShareAccessSuccess() {
  showShareAccess.value = false
  shareAccessGroup.value = null
  await refreshWorkspaceListPermissions()
}

async function onDeleteIsland(group) {
  const island = group?.island
  if (!island?.id) return
  const name = formatIslandDisplayName(island)
  try {
    await showConfirmDialog({
      title: 'Delete Island',
      message: `Are you sure you want to delete "${name}"? You will no longer have access to this island and all its accounts. This action cannot be undone.`
    })
    const res = await deleteWorkspace(island.id)
    showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'island deleted')
    router.replace('/accounts')
  } catch (e) {
    if (e !== 'cancel') showToast(e?.message || 'Delete failed')
  }
}

function openCategoryMenu() {
  closeIslandOptionsMenu()
  typeMenuOpen.value = false
  categoryMenuOpen.value = !categoryMenuOpen.value
}

function openTypeMenu() {
  closeIslandOptionsMenu()
  categoryMenuOpen.value = false
  typeMenuOpen.value = !typeMenuOpen.value
}

function openDateFilter() {
  closeFilterMenus()
  showDatePicker.value = true
}

function isFlowTypeFilterSelected(value) {
  return flowTypeFilterValues.value.includes(value)
}

function reloadAfterCategoryChange() {
  onFilter()
}

function reloadAfterFlowTypeChange() {
  onFilter()
}

function onAllCategoriesCheckboxChange(ev) {
  if (ev.target.checked) {
    categoryFilterIds.value = []
    reloadAfterCategoryChange()
    return
  }
  ev.target.checked = true
}

function onCategoryTreeToggle({ id, checked }) {
  const n = Number(id)
  const cur = categoryFilterIds.value
  if (checked && !cur.includes(n)) {
    categoryFilterIds.value = [...cur, n].sort((a, b) => a - b)
  } else if (!checked && cur.includes(n)) {
    categoryFilterIds.value = cur.filter((x) => x !== n)
  }
  reloadAfterCategoryChange()
}

function onAllFlowTypesCheckboxChange(ev) {
  if (ev.target.checked) {
    flowTypeFilterValues.value = []
    reloadAfterFlowTypeChange()
    return
  }
  ev.target.checked = true
}

function onFlowTypeCheckboxChange(value, ev) {
  const checked = ev.target.checked
  const cur = flowTypeFilterValues.value
  if (checked && !cur.includes(value)) {
    flowTypeFilterValues.value = [...cur, value].sort()
  } else if (!checked && cur.includes(value)) {
    flowTypeFilterValues.value = cur.filter((x) => x !== value)
  }
  reloadAfterFlowTypeChange()
}

let searchDebounceTimer = null
function clearSearchDebounce() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
}

async function toggleSearchMode() {
  closeFilterMenus()
  const opening = filterMode.value !== 'search'
  if (!opening) {
    clearSearchDebounce()
    searchQuery.value = ''
  }
  filterMode.value = opening ? 'search' : ''
  if (opening) {
    await nextTick()
    searchInputRef.value?.focus?.()
  } else {
    onFilter()
  }
}

function appendCategoryFilterParams(params) {
  const expanded = expandedCategoryIdsForQuery(categoryFilterIds.value, categoryNodeById.value)
  if (!expanded.length) return
  params.category_ids = expanded.join(',')
}

function appendTransactionTypesParam(params) {
  const sel = flowTypeFilterValues.value
  if (!sel.length) return
  params.types = sel.join(',')
}

function appendSearchParam(params) {
  if (filterMode.value !== 'search') return
  const q = searchQuery.value.trim()
  if (q) params.search = q
}

async function loadPendingRows() {
  try {
    const entries = await getPendingWrites()
    let transactionEntries = entries.filter(isTransactionEntry)
    transactionEntries = transactionEntries.filter((e) =>
      pendingMatchesTypeFilter(e.payload?.type || 'expense')
    )
    if (filterMode.value === 'search') {
      const q = searchQuery.value.trim().toLowerCase()
      if (q) {
        transactionEntries = transactionEntries.filter((e) => {
          const p = e.payload || {}
          return (
            (p.title || '').toLowerCase().includes(q) ||
            (p.transaction_number || '').toLowerCase().includes(q) ||
            (p.category_name || '').toLowerCase().includes(q)
          )
        })
      }
    }
    if (categoryFilterIds.value.length) {
      const allow = new Set(
        expandedCategoryIdsForQuery(categoryFilterIds.value, categoryNodeById.value)
      )
      transactionEntries = transactionEntries.filter((e) => {
        const cid = e.payload?.category_id
        return cid != null && allow.has(Number(cid))
      })
    }
    return transactionEntries.map(pendingEntryToRow)
  } catch (_) {
    return []
  }
}

function mergeAndSort(pendingRows, serverData) {
  const merged = [...pendingRows, ...serverData]
  const sortByDate = (a, b) => {
    const da = (a.transaction_date || '').replace(' ', 'T')
    const db = (b.transaction_date || '').replace(' ', 'T')
    return new Date(db) - new Date(da)
  }
  merged.sort(sortByDate)
  return merged
}

async function load(append = false) {
  if (append) loadingMore.value = true
  else loading.value = true
  try {
    const params = {
      limit: listQuery.value.limit,
      offset: append ? listQuery.value.offset : 0
    }
    if (dateFrom.value) params.start_date = dateFrom.value
    if (dateTo.value) params.end_date = dateTo.value
    if (workspaceId.value) params.workspace_id = workspaceId.value
    appendCategoryFilterParams(params)
    appendTransactionTypesParam(params)
    appendSearchParam(params)
    const res = await getTransactions(params)
    const data = res?.data || []
    if (!append) {
      const pendingRows = await loadPendingRows()
      list.value = mergeAndSort(pendingRows, data)
      listQuery.value.offset = data.length
    } else {
      list.value.push(...data)
      listQuery.value.offset += data.length
    }
    finished.value = data.length < (listQuery.value.limit || 30)
  } catch (e) {
    showToast('Failed to load')
    finished.value = true
    if (!append) list.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function fetchSummary() {
  try {
    const params = {}
    if (workspaceId.value != null && workspaceId.value !== '') {
      params.workspace_id = workspaceId.value
    }
    if (dateFrom.value) params.start_date = dateFrom.value
    if (dateTo.value) params.end_date = dateTo.value
    appendCategoryFilterParams(params)
    appendTransactionTypesParam(params)
    appendSearchParam(params)
    const res = await getSummary(params)
    if (res?.success && res?.data) summary.value = res.data
  } catch (_) {}
}

async function onFilter() {
  listQuery.value.offset = 0
  finished.value = false
  await Promise.all([load(), fetchSummary()])
  await tryScrollToFocusTransaction()
}

async function loadMore() {
  await load(true)
}

async function refreshData() {
  listQuery.value.offset = 0
  finished.value = false
  await Promise.all([load(), fetchSummary()])
  await tryScrollToFocusTransaction()
}

/**
 * Deep-link: home (etc.) opens log with ?focus_transaction_id= — scroll into view after load, paginate if needed.
 */
async function tryScrollToFocusTransaction() {
  const focusId = focusTransactionIdFromRoute()
  if (focusId == null) return
  await nextTick()
  const maxExtraLoads = 25
  for (let i = 0; i < maxExtraLoads; i++) {
    const el = typeof document !== 'undefined' ? document.getElementById(`tx-row-${focusId}`) : null
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      const q = { ...route.query }
      delete q.focus_transaction_id
      router.replace({ query: q })
      return
    }
    if (finished.value) break
    await load(true)
    await nextTick()
  }
}

function onRowClick(row) {
  if (row._pending) {
    showToast('Syncing when online')
    return
  }
  openTransactionDetail(row)
}

function openTransactionDetail(row) {
  selectedTransaction.value = { ...row }
  detailVisible.value = true
}

function goEditTransaction(row) {
  const rawId = row?.transaction_id ?? row?.id
  const txnId = rawId != null && rawId !== '' ? String(rawId).replace(/^pending_/, '') : ''
  if (!txnId) return
  detailVisible.value = false
  clearSearchDebounce()
  const q = new URLSearchParams()
  if (workspaceId.value) q.set('workspace_id', workspaceId.value)
  if (workspaceName.value) q.set('workspace_name', encodeURIComponent(workspaceName.value))
  const qs = q.toString()
  router.push(qs ? `/transactions/${txnId}?${qs}` : `/transactions/${txnId}`)
}

function detailModalShowEditButton() {
  const row = selectedTransaction.value
  if (!row || row._pending) return false
  return transactionRowActionFlags().showEdit
}

function onDetailModalDismiss() {
  detailVisible.value = false
  selectedTransaction.value = null
}

function transactionRowActionFlags() {
  const wid = workspaceId.value
  const scoped = wid != null && wid !== ''
  const scope = listWorkspacePermissionScope.value
  const showEdit = !scoped || listScopeAllowsTransactionEdit(scope)
  const showDelete = !scoped || listScopeAllowsTransactionDelete(scope)
  return { showEdit, showDelete }
}

/** More menu: pending rows need “Remove from queue”; otherwise need at least one of Edit/Delete. */
function rowHasOverflowActions(row) {
  if (row._pending) return true
  return true
}

function isExcludedFromReports(row) {
  return Boolean(Number(row?.exclude_from_reports))
}

async function toggleExcludeFromReports(row) {
  if (!row || row._pending) return
  const next = !isExcludedFromReports(row)
  try {
    await updateTransaction(row.id, { exclude_from_reports: next })
    if (selectedTransaction.value?.id === row.id) {
      selectedTransaction.value = { ...selectedTransaction.value, exclude_from_reports: next ? 1 : 0 }
    }
    showToast(next ? 'Excluded from reports' : 'Included in reports')
    invalidateAccountingCache()
    await refreshData()
  } catch (e) {
    showToast(e?.message || 'Update failed')
  }
}

async function onDetailExcludeToggle(ev) {
  const row = selectedTransaction.value
  if (!row || row._pending) return
  const next = Boolean(ev.detail.checked)
  if (next === isExcludedFromReports(row)) return
  try {
    await updateTransaction(row.id, { exclude_from_reports: next })
    selectedTransaction.value = { ...row, exclude_from_reports: next ? 1 : 0 }
    showToast(next ? 'Excluded from reports' : 'Included in reports')
    invalidateAccountingCache()
    await refreshData()
  } catch (e) {
    showToast(e?.message || 'Update failed')
  }
}

async function openRowOptions(row) {
  const { showEdit, showDelete } = transactionRowActionFlags()

  const buttons = row._pending
    ? [{ text: 'Remove from queue', role: 'remove-queue' }, { text: 'Cancel', role: 'cancel' }]
    : (() => {
        const opts = []
        if (!row._pending) {
          opts.push({
            text: isExcludedFromReports(row) ? 'Include in reports' : 'Exclude from reports',
            role: 'exclude-reports'
          })
        }
        if (showEdit) opts.push({ text: 'Edit', role: 'edit' })
        if (showDelete) opts.push({ text: 'Delete', role: 'delete' })
        opts.push({ text: 'Cancel', role: 'cancel' })
        return opts
      })()
  const role = await showActionSheet({ header: 'Transaction', buttons })
  if (role === 'remove-queue' && row._pendingId) {
    try {
      await deleteEntry(row._pendingId)
      showToast('Removed from queue')
      await refreshData()
    } catch (e) {
      showToast(e?.message || 'Failed')
    }
  } else if (role === 'edit' && !row._pending) {
    router.push(`/transactions/${row.id}`)
  } else if (role === 'exclude-reports' && !row._pending) {
    await toggleExcludeFromReports(row)
  } else if (role === 'delete' && !row._pending) {
    try {
      await showConfirmDialog({ title: 'Delete', message: `Delete "${row.transaction_number || row.title}"?` })
      await deleteTransaction(row.id)
      showToast('Deleted')
      await refreshData()
    } catch (e) {
      if (e !== 'cancel') showToast(e?.message || 'Delete failed')
    }
  }
}

async function onFabSelect(type) {
  const q = new URLSearchParams()
  if (type) q.set('type', type)
  if (workspaceId.value) q.set('workspace_id', workspaceId.value)
  if (workspaceName.value) q.set('workspace_name', encodeURIComponent(workspaceName.value))
  router.push(`/transactions/create?${q.toString()}`)
}


watch(workspaceId, () => {
  refreshWorkspaceListPermissions()
})

watch(
  () => resolvedWorkspaceId.value,
  async (_wid, prev) => {
    await loadCategoryMenu()
    if (prev !== undefined) {
      categoryFilterIds.value = []
      categoryFilterSearch.value = ''
      flowTypeFilterValues.value = []
      await onFilter()
    }
  },
  { immediate: true }
)

watch(categoryMenuOptions, (opts) => {
  const valid = new Set(opts.map((o) => o.id))
  const next = categoryFilterIds.value.filter((id) => valid.has(id))
  if (next.length !== categoryFilterIds.value.length) {
    categoryFilterIds.value = next
    onFilter()
  }
})

watch(searchQuery, () => {
  if (filterMode.value !== 'search') return
  clearSearchDebounce()
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null
    onFilter()
  }, 320)
})

watch(
  () => syncStore.transactionListInvalidatedAt,
  (val) => {
    if (val > 0) refreshData()
  }
)

onIonViewDidEnter(() => {
  refreshWorkspaceListPermissions()
  const queued = syncStore.consumeLastQueuedTransaction()
  if (queued) {
    const row = payloadToRow(queued.id, queued.payload)
    if (pendingMatchesTypeFilter(row.type)) {
      list.value = mergeAndSort([row], list.value)
    }
  } else {
    refreshData()
  }
  refreshBootstrapCache().catch(() => {})
})

onMounted(async () => {
  try {
    const r = await getTenantDefaultCurrency()
    const c = r?.data?.data ?? r?.data
    if (c?.code) defaultCurrency.value = c
  } catch (_) {}
})

onUnmounted(() => {
  clearSearchDebounce()
})
</script>

<style scoped>
.transactions-page {
  --background: #F5F5F7;
}

.transactions-page ion-content {
  --background: #F5F5F7;
}

.page-container {
  padding: 0 16px;
  padding-top: env(safe-area-inset-top, 20px);
}

.top-header {
  display: flex;
  align-items: center;
  padding: 15px 0 10px 0;
  gap: 8px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  -webkit-tap-highlight-color: transparent;
}

.header-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-subtitle {
  font-size: 11px;
  color: #A7A7A7;
}

.top-header--island-menu-open {
  position: relative;
  z-index: 250;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  -webkit-tap-highlight-color: transparent;
}

.tx-island-menu-wrapper {
  position: relative;
}

.island-options-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 200px;
  max-width: min(92vw, 280px);
  max-height: min(65dvh, 360px);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.14);
  padding: 6px 0;
  z-index: 1;
}

.island-options-popover--up {
  top: auto;
  bottom: calc(100% + 6px);
}

.island-popover-option {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a2e;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.island-popover-option:active {
  background: rgba(0, 0, 0, 0.05);
}

.island-popover-option.destructive {
  color: rgba(195, 0, 16, 0.74);
}

.island-options-backdrop {
  position: fixed;
  inset: 0;
  z-index: 249;
  background: transparent;
}

.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.15s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
}

.summary-grid {
  display: flex;
  justify-content: space-between;
  background: #fff;
  border-radius: 14px;
  padding: 14px 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Ledger filter row (matches Flow Log) */
.ledger-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  min-width: 0;
}

.ledger-filter-row--search-open {
  flex-wrap: nowrap;
  gap: 8px;
}

.ledger-filter-search-slot {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-width: 0;
}

.ledger-filter-search-slot--expanded {
  flex: 1 1 0;
  min-width: 0;
}

.ledger-inline-search-input {
  flex: 1 1 0;
  min-width: 64px;
  width: 0;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #ff8d28;
  background: #fff;
  font-size: 13px;
  color: #1a1a2e;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.ledger-inline-search-input::placeholder {
  color: #a8a8a8;
}

.ledger-inline-search-input:focus {
  border-color: #ff8d28;
  box-shadow: 0 0 0 2px rgba(255, 141, 40, 0.12);
}

.ledger-filter-trailing {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  min-width: 0;
}

.ledger-filter-row--search-open .ledger-filter-trailing {
  margin-left: auto;
}

.ledger-filter-row--search-open .ledger-filter-trailing .filter-pill-grow {
  max-width: 112px;
}

.ledger-filter-row--search-open .ledger-filter-trailing .filter-pill-type-btn {
  max-width: 96px;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 28px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid #ff8d28;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.filter-pill.active {
  background: rgba(255, 141, 40, 0.08);
}

.filter-pill-icon {
  width: 38px;
  min-width: 38px;
  padding: 0;
}

.filter-pill-date {
  padding: 0 6px 0 8px;
}

.filter-chevron {
  flex-shrink: 0;
}

.filter-pill-wrap {
  position: relative;
  z-index: 55;
}

.filter-pill-label {
  color: #a8a8a8;
  font-weight: 500;
}

.filter-pill-grow {
  min-width: 0;
  max-width: 140px;
  flex: 1 1 auto;
  justify-content: space-between;
  padding: 0 8px 0 10px;
  gap: 6px;
}

.filter-pill-label-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.filter-pill-type-btn {
  max-width: 120px;
  gap: 8px;
  padding-right: 10px;
}

.filter-caret-solid {
  flex-shrink: 0;
  display: block;
}

.filter-flyout {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  max-width: min(280px, 90vw);
  max-height: 260px;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  padding: 6px 0;
  z-index: 60;
}

.filter-flyout-type {
  min-width: 140px;
}

.filter-flyout.filter-flyout-categories {
  box-sizing: border-box;
  /* Horizontally centered on viewport; vertical offset set inline from filter row */
  position: fixed;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
  top: 148px;
  min-width: unset;
  width: min(420px, calc(100vw - 48px));
  max-width: min(420px, calc(100vw - 48px));
  max-height: none;
  overflow: hidden;
  padding: 0;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.04),
    0 14px 36px rgba(0, 0, 0, 0.14);
  z-index: 10002;
}

.filter-flyout-categories-loading-inner {
  padding: 20px 18px;
}

.filter-flyout-categories-scroll {
  max-height: min(392px, 58dvh);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: 8px;
}

.filter-flyout-cat-header {
  padding: 12px 14px 14px;
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f7 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.filter-flyout-row-all-categories {
  padding: 8px 2px 12px;
}

.filter-flyout-row-text-strong {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.84);
}

.filter-flyout-categories-search-wrap {
  padding: 0;
}

.filter-flyout-categories-search {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  font-size: 15px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  background: #fff;
  border: 1px solid rgba(255, 141, 40, 0.28);
  border-radius: 12px;
  outline: none;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.03);
}

.filter-flyout-categories-search:focus {
  border-color: rgba(255, 141, 40, 0.55);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.03),
    0 0 0 3px rgba(255, 141, 40, 0.12);
}

.filter-flyout-categories-search::placeholder {
  color: #939393;
}

.filter-flyout-cat-section {
  padding: 10px 12px 4px;
}

.filter-flyout-cat-section + .filter-flyout-cat-section {
  margin-top: 6px;
  padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.055);
}

.filter-flyout-cat-section-title {
  padding: 10px 18px 8px;
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.42);
}

.filter-flyout-cat-empty {
  text-align: center;
  padding: 20px 18px 24px;
  color: rgba(0, 0, 0, 0.38);
  font-weight: 500;
  font-size: 14px;
}

.filter-flyout-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 10px 14px;
  box-sizing: border-box;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.filter-flyout-row:active {
  background: rgba(0, 0, 0, 0.04);
}

.filter-flyout-cb {
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin: 2px 0 0 0;
  flex-shrink: 0;
  accent-color: #ff8d28;
  cursor: pointer;
}

.filter-flyout-row-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.72);
  line-height: 1.35;
}

.filter-flyout-loading {
  padding: 12px 14px;
  font-size: 13px;
  color: #a8a8a8;
}

.filter-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: transparent;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sum-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.sum-label {
  font-size: 10px;
  color: #A7A7A7;
  text-transform: uppercase;
}

.sum-val {
  font-size: 13px;
  font-weight: 700;
  color: #1A1A2E;
}

.sum-val.positive {
  color: #52BF90;
}

.sum-val.negative {
  color: rgba(195, 0, 16, 0.74);
}

.entry-count-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.entry-count-line {
  flex: 1;
  height: 1px;
  background: #E0E0E0;
}

.entry-count {
  font-size: 12px;
  color: #A7A7A7;
  white-space: nowrap;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.day-header {
  font-size: 13px;
  font-weight: 500;
  color: #6E6A7C;
  padding-left: 4px;
}

.day-card {
  background: #fff;
  border-radius: 16px;
  padding: 0 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.transaction-row {
  position: relative;
  padding: 12px 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.transaction-row:active {
  background: #FAFAFA;
  margin: 0 -14px;
  padding: 12px 14px;
}

.tx-main {
  flex: 1;
  min-width: 0;
}

.tx-row-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 6px;
}

.tx-description {
  font-size: 15px;
  font-weight: 700;
  color: #1A1A2E;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-top-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.tx-amount {
  font-size: 15px;
  font-weight: 700;
}

.tx-amount.income {
  color: #52BF90;
}

.tx-amount.expense {
  color: rgba(195, 0, 16, 0.74);
}

.tx-amount.transfer {
  color: #1989fa;
}

.tx-row-bottom {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tx-user-line {
  font-size: 12px;
  color: #6E6A7C;
}

.tx-user-line .person-icon {
  vertical-align: middle;
  margin-right: 4px;
  color: #FF8D28;
}

.tx-user-line strong {
  color: #1A1A2E;
  font-weight: 600;
}

.tx-category-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 141, 40, 0.12);
  color: #ff8d28;
}

.tx-excluded-pill {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(110, 106, 124, 0.12);
  color: #6e6a7c;
}

.detail-exclude-control {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.detail-exclude-hint {
  font-size: 12px;
  color: #6e6a7c;
  line-height: 1.35;
}

.tx-balance {
  margin-left: auto;
  font-size: 11px;
  color: #A7A7A7;
}

.pending-icon {
  font-size: 18px;
  color: #A7A7A7;
}

.more-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  -webkit-tap-highlight-color: transparent;
}

.transaction-row.has-separator {
  border-bottom: 1px solid #F0F0F0;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
}

.empty-state p {
  font-size: 14px;
  color: #A7A7A7;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.load-more-btn {
  background: #fff;
  border: 1px solid #E8E8E8;
  border-radius: 10px;
  padding: 8px 24px;
  font-size: 13px;
  color: #6E6A7C;
  cursor: pointer;
}

.tab-spacer {
  height: 80px;
}

/* Transaction detail modal (aligned with Flow Log) */
.detail-modal-content {
  --background: #f8f8fa;
  --padding-top: 0;
  --padding-bottom: 0;
}

.detail-sheet {
  box-sizing: border-box;
  min-height: 100%;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 12px 20px 0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin-bottom: 20px;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  min-width: 0;
}

.detail-cell:nth-child(odd) {
  padding-right: 12px;
}

.detail-cell:nth-child(odd):not(:last-child) {
  border-right: 1px solid #f0f0f0;
}

.detail-cell:nth-child(even) {
  padding-left: 12px;
}

.detail-cell:nth-child(1),
.detail-cell:nth-child(2) {
  padding-top: 0;
}

.detail-cell-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #a7a7a7;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.detail-item-icon {
  flex-shrink: 0;
  color: #6e6a7c;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-item-icon.type-icon.positive {
  color: #52bf90;
}

.detail-item-icon.type-icon.negative {
  color: rgba(195, 0, 16, 0.74);
}

.detail-item-icon.type-icon.transfer {
  color: #1989fa;
}

.detail-cell-value {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-cell-value.positive {
  color: #52bf90;
  font-weight: 600;
}

.detail-cell-value.negative {
  color: rgba(195, 0, 16, 0.74);
  font-weight: 600;
}

.detail-cell-value.transfer {
  color: #1989fa;
  font-weight: 600;
}

.detail-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 10px;
  background: #f0f0f0;
  font-size: 12px;
  font-weight: 500;
  color: #6e6a7c;
}

.detail-cell.detail-cell-span-full {
  grid-column: 1 / -1;
  border-right: none !important;
  padding-left: 0;
  padding-right: 0;
}

.detail-amount-block {
  text-align: center;
  margin-bottom: 24px;
  padding: 20px 16px;
  background: #f8f8fa;
  border-radius: 14px;
}

.detail-amount-full {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.02em;
}

.detail-amount-full.positive {
  color: #52bf90;
}

.detail-amount-full.negative {
  color: rgba(195, 0, 16, 0.74);
}

.detail-amount-full.transfer {
  color: #1989fa;
}

.detail-audit {
  margin-bottom: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.detail-audit-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.detail-audit-row:last-child {
  margin-bottom: 0;
}

.detail-audit-label {
  font-size: 13px;
  color: #a7a7a7;
  flex-shrink: 0;
}

.detail-audit-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.detail-audit-who {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a2e;
}

.detail-audit-when {
  font-size: 12px;
  color: #a7a7a7;
  margin-top: 2px;
}
</style>
