// content.tsx
export {}

// 対象のホスト名
const TARGET_HOST = 'browser-hack.utcode.net';
if (window.location.host === TARGET_HOST) {
  let isSidePanelOpen = false;
  const warningElement = document.createElement('div');
  warningElement.id = 'sidepanel-warning';
  warningElement.innerHTML = `
    <p><strong>注意</strong></p>
    <p>サイドパネルが開かれていません。右上の<span class="badge">ブ</span>をクリックしてサイドパネルを開いてください。</p>
  `;

  const badge = warningElement.querySelector<HTMLSpanElement>('.badge')
  if (badge) {
    Object.assign(badge.style, {
      display: 'inline-block',
      width: '1.6em',
      height: '1.6em',
      backgroundColor: '#6a6767ff',
      textAlign: 'center',
      lineHeight: '1.6em',
      color: '#ffffff',
    })
  }

  // スタイルを直接設定
  warningElement.style.position = 'fixed';
  warningElement.style.top = '20px';
  warningElement.style.right = '20px';
  warningElement.style.padding = '20px';
  warningElement.style.backgroundColor = '#fff3cd';
  warningElement.style.color = '#ff0000ff';
  warningElement.style.border = '1px solid #ffc107';
  warningElement.style.borderRadius = '8px';
  warningElement.style.zIndex = '9999';
  warningElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
  warningElement.style.fontFamily = 'sans-serif';
  warningElement.style.display = 'none'; // 最初は非表示

  document.body.appendChild(warningElement);

  // 2秒後にサイドパネルが開かれていなければ警告を表示
  const warningTimeout = setTimeout(() => {
    if (!isSidePanelOpen) {
      warningElement.style.display = 'block';
    }
  }, 2000);

  // タブが閉じるとリセット
  window.addEventListener('beforeunload', () => {
    isSidePanelOpen = false;
    clearTimeout(warningTimeout); 
  });

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'sidepanel') return
    ports.add(port)

    // サイドパネルからのメッセージをリッスン
    port.onMessage.addListener((msg) => {
      if (msg.type === 'SIDE_PANEL_OPENED') {
        isSidePanelOpen = true;
        warningElement.style.display = 'none'; // 警告を非表示にする
      }
    });

    const initialValues = getCurrentValues()
    lastJson = JSON.stringify(initialValues)
    port.postMessage({
      type: 'DOM_VALUE_UPDATE',
      pageKey: PAGE_KEY,
      values: initialValues,
    })

    port.onDisconnect.addListener(() => ports.delete(port))
  })
}

const PAGE_KEY = `${location.origin}${location.pathname}`

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
        p.postMessage({
          type: 'DOM_VALUE_UPDATE',
          pageKey: PAGE_KEY,
          values,
        })
      } catch {}
    }
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return
  ports.add(port)


  const initialValues = getCurrentValues()
  lastJson = JSON.stringify(initialValues)
  port.postMessage({
    type: 'DOM_VALUE_UPDATE',
    pageKey: PAGE_KEY,
    values: initialValues,
  })

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