/**
 * The bookmarklet. Runs inside the retailer's page, in your browser, reads what
 * is already on screen, and hands it to WolfGrandma through the URL fragment —
 * no server, no CORS, no credentials anywhere.
 */
import { capture } from '../capture'

declare const __ADMIN_URL__: string

const payload = capture(document, location.href)
const target = `${__ADMIN_URL__}#capture=${encodeURIComponent(JSON.stringify(payload))}`

const opened = window.open(target, 'wolfgrandma')
if (!opened) {
  // Popup blocked: fall back to the clipboard so the capture is never lost.
  void navigator.clipboard
    ?.writeText(JSON.stringify(payload))
    .then(() => alert('弹窗被拦截了。数据已复制到剪贴板，去狼外婆粘贴。'))
    .catch(() => alert('弹窗被拦截，剪贴板也不可用。请允许本站弹窗后重试。'))
}
