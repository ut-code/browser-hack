export {}

type CheckResult = { ok: boolean; details: string }
// 判定する関数
function checkAnswer(): CheckResult {
  const el = document.querySelector<HTMLElement>('[data-check]')
  if (!el) return { ok: false, details: 'data-check 要素が見つかりません' }
  const expected = el.getAttribute('data-check') ?? ''
  const actual = (el.textContent ?? '').trim()
  return actual === expected
    ? { ok: true, details: `一致: "${actual}"` }
    : { ok: false, details: `不一致: expected="${expected}", actual="${actual}"` }
}

// デバウンス
const debounce = <T extends (...a: any[]) => void>(fn: T, delay: number) => {
  let t: number | undefined // タイマーの識別子
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t)
    // @ts-ignore
    t = setTimeout(() => fn(...args), delay) as unknown as number
  }
}

const ports = new Set<chrome.runtime.Port>()

// サイドパネルからの Port 接続のみ対応
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return
  ports.add(port)
  // 接続直後に最新判定を送る
  port.postMessage({ type: 'UPDATE', result: checkAnswer() })
  port.onDisconnect.addListener(() => ports.delete(port))
})
// DevTools等でのDOM変更を監視し、判定結果をサイドパネルへ通知
const notify = debounce(() => {
  const result = checkAnswer()
  for (const p of ports) {
    try { p.postMessage({ type: 'UPDATE', result }) } catch {}
  }
}, 200) // 200ms ディレイ

const mo = new MutationObserver(() => notify())
mo.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
})