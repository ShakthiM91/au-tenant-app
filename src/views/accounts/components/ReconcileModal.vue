<template>
  <ion-modal :is-open="visible" @didDismiss="handleClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Reconcile Balance</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content v-if="account" class="ion-padding">
      <div class="account-name">{{ account.name }}</div>

      <ion-list lines="inset">
        <ion-item>
          <ion-label position="stacked">Current balance</ion-label>
          <ion-note slot="end" :class="currentBalance >= 0 ? 'positive' : 'negative'">
            {{ formatCurrency(currentBalance, account.currency) }}
          </ion-note>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Latest balance</ion-label>
          <ion-input
            :value="latestBalanceInput"
            type="number"
            inputmode="decimal"
            step="0.01"
            placeholder="Enter actual balance"
            @ionInput="onLatestBalanceInput"
          />
        </ion-item>

        <ion-item v-if="difference !== null">
          <ion-label position="stacked">Difference</ion-label>
          <ion-note slot="end" :class="difference > 0 ? 'positive' : difference < 0 ? 'negative' : ''">
            {{ formatCurrency(difference, account.currency) }}
            <span v-if="difference > 0"> (add as income)</span>
            <span v-else-if="difference < 0"> (deduct as expense)</span>
            <span v-else> (no adjustment)</span>
          </ion-note>
        </ion-item>

        <template v-if="difference !== null && difference !== 0">
          <ion-item button detail @click="showCategoryPicker = true">
            <ion-label position="stacked">Category</ion-label>
            <ion-note slot="end">{{ categoryText || 'Select' }}</ion-note>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Remark</ion-label>
            <ion-textarea v-model="remark" placeholder="e.g. Bank statement date" rows="2" />
          </ion-item>
        </template>
      </ion-list>

      <div class="action-buttons">
        <ion-button
          expand="block"
          :disabled="submitDisabled || submitLoading"
          @click="handleSubmit"
        >
          {{ submitLoading ? 'Applying...' : difference === 0 ? 'Close' : 'Apply adjustment' }}
        </ion-button>
      </div>

      <ion-modal :is-open="showCategoryPicker" @didDismiss="showCategoryPicker = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Category</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showCategoryPicker = false">Cancel</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item
              v-for="c in categoryCols"
              :key="c.value"
              button
              @click="selectCategory(c.value)"
            >
              <ion-label>{{ c.text }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonLabel, IonInput, IonNote, IonTextarea
} from '@ionic/vue'
import { showToast } from '@/utils/ionicFeedback'
import { createTransaction, getCategoryTree } from '@/api/accounting'

const props = defineProps({
  visible: { type: Boolean, default: false },
  account: { type: Object, default: null }
})

const emit = defineEmits(['close', 'success'])

const latestBalanceInput = ref('')
const categoryId = ref(null)
const remark = ref('')
const submitLoading = ref(false)
const showCategoryPicker = ref(false)
const categoryOptions = ref([])

const currentBalance = computed(() => {
  if (!props.account) return 0
  return parseFloat(props.account.current_balance ?? props.account.balance) || 0
})

const difference = computed(() => {
  const raw = latestBalanceInput.value
  if (raw === '' || raw === null || raw === undefined) return null
  return Math.round(((parseFloat(raw) || 0) - currentBalance.value) * 100) / 100
})

const categoryCols = computed(() =>
  categoryOptions.value.map(c => ({ text: c.text, value: c.value }))
)

const categoryText = computed(() => {
  const c = categoryCols.value.find(x => x.value === categoryId.value)
  return c ? c.text : ''
})

const submitDisabled = computed(() => {
  if (difference.value === null) return true
  if (difference.value === 0) return false
  return categoryId.value == null
})

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2
  }).format(amount)
}

function flatten(arr, pre = '') {
  const out = []
  for (const c of arr || []) {
    if (c.is_active === false) continue
    const t = pre ? `${pre} > ${c.name}` : c.name
    out.push({ value: Number(c.id), text: t })
    if (c.children?.length) out.push(...flatten(c.children, t))
  }
  return out
}

async function loadCategories(type) {
  if (!type) return
  try {
    const r = await getCategoryTree(type)
    const data = r?.data ?? r?.data?.data ?? []
    categoryOptions.value = flatten(Array.isArray(data) ? data : [])
  } catch (_) {
    categoryOptions.value = []
  }
}

function onLatestBalanceInput(e) {
  latestBalanceInput.value = e.detail?.value != null ? String(e.detail.value) : ''
}

function selectCategory(value) {
  categoryId.value = value
  showCategoryPicker.value = false
}

watch(
  () => [props.visible, props.account, difference.value],
  async ([visible, account, diff]) => {
    if (!visible || !account) return
    if (diff !== null && diff !== 0) {
      await loadCategories(diff > 0 ? 'income' : 'expense')
    } else {
      categoryOptions.value = []
    }
  }
)

watch(() => props.visible, (visible) => {
  if (visible && props.account) {
    const bal = props.account.current_balance ?? props.account.balance
    latestBalanceInput.value = bal != null ? String(bal) : ''
    categoryId.value = null
    remark.value = ''
  }
})

function handleClose() {
  emit('close')
}

function getCurrentDateTimeString() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function handleSubmit() {
  if (difference.value === 0) {
    showToast('No adjustment needed')
    handleClose()
    return
  }

  if (difference.value === null || categoryId.value == null) {
    showToast(difference.value === null ? 'Enter latest balance' : 'Select a category')
    return
  }

  submitLoading.value = true
  try {
    const type = difference.value > 0 ? 'income' : 'expense'
    const amount = Math.abs(difference.value)
    const description = remark.value?.trim()
      ? `Reconciliation: ${remark.value.trim()}`
      : 'Balance reconciliation'

    const res = await createTransaction({
      transaction_number: `RECON-${Date.now()}`,
      type,
      account_id: props.account.id,
      category_id: categoryId.value,
      amount,
      currency: props.account.currency || 'USD',
      description,
      transaction_date: getCurrentDateTimeString(),
      status: 'completed'
    })

    showToast(res?.queued ? 'Saved locally. Will sync when online.' : 'Balance reconciled')
    emit('success')
    handleClose()
  } catch (e) {
    showToast(e?.response?.data?.error || e?.message || 'Failed')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.account-name {
  font-weight: 600;
  margin-bottom: 16px;
}
.action-buttons {
  margin-top: 24px;
  padding: 0 16px;
}
.positive {
  color: var(--ion-color-success);
  font-weight: 600;
}
.negative {
  color: var(--ion-color-danger);
  font-weight: 600;
}
</style>
