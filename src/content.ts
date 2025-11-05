// content.tsx
export {}

function isDisplayed(el: Element | null): boolean {
  if (!el) return false
  if (!el.isConnected) return false
  
  let current: Element | null = el
  while (current) {
    const style = getComputedStyle(current)
    if (style.display === 'none') {
      return false
    }
    current = current.parentElement
  }
  return true
}

// 複数の問題の「現在の値」をまとめて取得する
function getCurrentValues() {
  // 問題1: テキストのチェック
  const el1 = document.querySelector<HTMLElement>('.reviewText2')
  const val1 = el1 ? (el1.textContent ?? '').trim() : ''

  // 問題2: 画像のsrcチェック
  const el2 = document.querySelector('#starIcon2 img') as HTMLImageElement
  const val2 = el2 ? (el2.getAttribute('src') ?? '') : ''

  // 問題3: 要素の表示状態チェック
  const el3 = document.querySelector<HTMLElement>('.reviewBox1')
  const val3Visible = isDisplayed(el3)

  // 問題4: 価格表示のテキスト
  const el4 = document.querySelector<HTMLElement>('#discountMessage')
  const val4 = el4 ? (el4.textContent ?? '').trim() : ''

  return {
    p1: val1,
    p2: val2,
    p3Visible: val3Visible,
    p4: val4,
  }
}

// デバウンス
const debounce = <T extends (...a: any[]) => void>(fn: T, delay: number) => {
  let t: number | undefined
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t)
    // @ts-ignore
    t = setTimeout(() => fn(...args), delay) as unknown as number
  }
}

const ports = new Set<chrome.runtime.Port>()

// 変更があった場合のみメッセージを送信する
let lastJson = ''
function sendMessage() {
  const values = getCurrentValues()
  const currentJson = JSON.stringify(values)
  if (currentJson !== lastJson) {
    lastJson = currentJson
    for (const p of ports) {
      try {
        p.postMessage({ type: 'DOM_VALUE_UPDATE', values })
      } catch {}
    }
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return
  ports.add(port)

  // 接続直後に現在の状態を送る
  const initialValues = getCurrentValues()
  lastJson = JSON.stringify(initialValues)
  port.postMessage({ type: 'DOM_VALUE_UPDATE', values: initialValues })

  port.onDisconnect.addListener(() => ports.delete(port))
})

// DOM変更を監視し、まとめて通知
const notify = debounce(sendMessage, 200)

const mo = new MutationObserver(() => notify())
mo.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
})
// 定期的に送信
setInterval(sendMessage, 300)