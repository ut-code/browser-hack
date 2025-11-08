export {}

// ✅ 問題1：テキスト要素
function getTextValue(): string {
  const el = document.querySelector<HTMLElement>('[data-check]')
  if (!el) return ''
  return (el.textContent ?? '').trim()
}

// ✅ 問題2：画像要素
function getImgValue(): string {
  const img = document.querySelector<HTMLImageElement>('[data-check-img]')
  if (!img) return ''
  return img.src ?? ''
}

// 現在の値をまとめて送る関数
function getAllValues() {
  return [
    { kind: 'text', actual: getTextValue() },
    { kind: 'img', actual: getImgValue() },
  ]
}

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

  // 初回送信
  for (const v of getAllValues()) {
    port.postMessage({ type: 'DOM_VALUE_UPDATE', ...v })
  }

  port.onDisconnect.addListener(() => ports.delete(port))
})

// DOM監視で変更を検知
const notify = debounce(() => {
  for (const v of getAllValues()) {
    for (const p of ports) {
      try {
        p.postMessage({ type: 'DOM_VALUE_UPDATE', ...v })
      } catch {}
    }
  }
}, 200)

const mo = new MutationObserver(() => notify())
mo.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
})
