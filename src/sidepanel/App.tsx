import { useEffect, useState } from 'react'
import './App.css'

type CheckResult = { ok: boolean; details: string }

const CORRECT_ANSWER = "解答記入"


// 判定ロジックをサイドパネル側に持ってくる
function checkAnswer(actual: string): CheckResult {
  if (actual === CORRECT_ANSWER) {
    return { ok: true, details: `一致: "${actual}"` }
  } else {
    // ユーザーにヒントを出す（正解の文字列は見せない）
    return { ok: false, details: `不一致: あなたの入力="${actual}"` }
  }
}

function App() {
  const [result, setResult] = useState<CheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let disconnected = false
    ;(async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab?.id) return
        const port = chrome.tabs.connect(tab.id, { name: 'sidepanel' })
        
        port.onMessage.addListener((msg) => {
          if (disconnected) return
          
          // 'UPDATE' ではなく 'DOM_VALUE_UPDATE' を受信する
          if (msg?.type === 'DOM_VALUE_UPDATE') {
            // 送られてきた 'actual' の値を使って、こちら側で判定する
            const checkResult = checkAnswer(msg.actual as string)
            setResult(checkResult)
          }
        })
        
        return () => {
          disconnected = true
          try { port.disconnect() } catch {}
        }
      } catch (e: any) {
        setError(e?.message ?? String(e))
      }
    })()
  }, []) // CORRECT_ANSWER は定数なので依存配列に追加不要

  return (
    <div className="container">
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {result
        ? (<><div>判定: {result.ok ? '正解' : '不正解'}</div><div>詳細: {result.details}</div></>)
        // 初期状態を「判定中」や「入力待ち」などに変更
        : (<div>[data-check]要素の入力を待機中…</div>)
      }
    </div>
  )
}

export default App