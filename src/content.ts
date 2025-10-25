export {}

// 判定する関数
// -> 要素の「現在の値」を取得するだけの関数に変更
function getActualValue(): string {
  const el = document.querySelector<HTMLElement>('[data-check]')
  if (!el) return '' // 見つからなければ空文字を返す
  return (el.textContent ?? '').trim()
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

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return
  ports.add(port)
  
  // 接続直後に「現在の値」を送る (判定結果ではない)
  port.postMessage({ type: 'DOM_VALUE_UPDATE', actual: getActualValue() })
  
  port.onDisconnect.addListener(() => ports.delete(port))
})

// DevTools等でのDOM変更を監視し、「現在の値」をサイドパネルへ通知
const notify = debounce(() => {
  // 判定(checkAnswer)はしない
  const actual = getActualValue() 
  for (const p of ports) {
    try { 
      // 判定結果ではなく、「現在の値」をそのまま送る
      p.postMessage({ type: 'DOM_VALUE_UPDATE', actual }) 
    } catch {}
  }
}, 200) // 200ms ディレイ

const mo = new MutationObserver(() => notify())
mo.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
})