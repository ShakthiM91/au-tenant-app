import { toastController, alertController, actionSheetController } from '@ionic/vue'

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
 * @param {string | {
 *   message: string,
 *   title?: string,
 *   duration?: number,
 *   variant?: 'success' | 'error'
 * }} messageOrOptions
 *
 * - Pass a string for message-only toasts (no header).
 * - Pass `title` for a custom heading. Use `title: ''` to force no heading even when `variant` is set.
 * - Pass `variant: 'success' | 'error'` to use the default heading for that outcome when `title` is omitted.
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

  const toast = await toastController.create({
    header: title,
    message,
    duration,
    position: 'middle',
    layout: title ? 'stacked' : 'baseline',
    cssClass
  })
  await toast.present()
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
