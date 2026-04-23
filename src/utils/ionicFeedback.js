import { toastController, alertController, actionSheetController } from '@ionic/vue'
import { checkmarkCircle } from 'ionicons/icons'

/**
 * ion-toast leaves an empty `.toast-content` with `flex: 1`, which misaligns a lone icon.
 * Placement (viewport center) is handled in `app-toast.css` for `ion-toast.app-toast-icon::part(container)`.
 * @param {HTMLElement} toastEl
 */
function applyCompactIconToastLayout(toastEl) {
  const root = toastEl?.shadowRoot
  if (!root) return
  const content = root.querySelector('.toast-content')
  if (content) content.style.display = 'none'
  const wrap = root.querySelector('.toast-wrapper')
  if (wrap) {
    wrap.style.background = 'transparent'
    wrap.style.boxShadow = 'none'
    wrap.style.setProperty('backdrop-filter', 'none')
    wrap.style.setProperty('-webkit-backdrop-filter', 'none')
  }
}

/** Default headings when `variant` is set and `title` is omitted. */
const DEFAULT_TOAST_TITLES = {
  success: 'Success!',
  error: 'Failed!'
}

export async function showActionSheet({ header, buttons }) {
  const sheet = await actionSheetController.create({ header, buttons })
  await sheet.present()
  const { role } = await sheet.onDidDismiss()
  return role
}

/**
 * Standard message toasts: centered card + dimmed backdrop (see `app-toast.css`).
 *
 * @param {string | {
 *   message: string,
 *   title?: string,
 *   duration?: number,
 *   variant?: 'success' | 'error',
 *   cssClass?: string | string[]
 * }} messageOrOptions
 */
export async function showToast(messageOrOptions) {
  const opts =
    typeof messageOrOptions === 'string'
      ? { message: messageOrOptions }
      : messageOrOptions

  const { message, duration = 2000, variant } = opts
  const titleExplicitlySet = Object.prototype.hasOwnProperty.call(opts, 'title')
  const titleRaw = opts.title
  let title =
    typeof titleRaw === 'string' && titleRaw.trim() ? titleRaw.trim() : undefined

  if (
    !title &&
    !titleExplicitlySet &&
    variant &&
    Object.prototype.hasOwnProperty.call(DEFAULT_TOAST_TITLES, variant)
  ) {
    title = DEFAULT_TOAST_TITLES[variant]
  }

  const cssClass = ['app-toast']
  if (title) cssClass.push('app-toast-with-header')
  if (variant === 'error') cssClass.push('app-toast-variant-error')
  if (variant === 'success') cssClass.push('app-toast-variant-success')
  if (opts.cssClass) {
    const extra = Array.isArray(opts.cssClass) ? opts.cssClass : [opts.cssClass]
    cssClass.push(...extra.filter(Boolean))
  }

  const toast = await toastController.create({
    header: title,
    message: message ?? '',
    duration,
    position: 'middle',
    layout: title ? 'stacked' : 'baseline',
    cssClass
  })
  await toast.present()
}

/**
 * Lightweight icon-only feedback: small floating badge, no full-screen dim.
 * Pass an icon from `ionicons/icons` or omit to use the default success checkmark.
 *
 * @param {{
 *   icon?: string,
 *   duration?: number,
 *   variant?: 'success'
 * }} [options]
 */
export async function showToastIcon(options = {}) {
  const { icon = checkmarkCircle, duration = 1200, variant = 'success' } = options

  const cssClass = ['app-toast-icon']
  if (variant === 'success') cssClass.push('app-toast-icon--success')

  const toast = await toastController.create({
    message: '',
    duration,
    position: 'middle',
    layout: 'stacked',
    cssClass,
    icon
  })
  await toast.present()

  toast.addEventListener('ionToastDidPresent', () => applyCompactIconToastLayout(toast), {
    once: true
  })
}

export async function showConfirmDialog({ title, message, confirmText = 'OK', cancelText = 'Cancel' }) {
  return new Promise((resolve, reject) => {
    alertController
      .create({
        header: title,
        message,
        buttons: [
          { text: cancelText, role: 'cancel', handler: () => reject('cancel') },
          { text: confirmText, role: 'confirm', handler: () => resolve() }
        ]
      })
      .then((alert) => alert.present())
  })
}
