import { useEffect, useState } from 'react'
import './App.css'

type CheckResult = { ok: boolean; details: string }

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
          if (msg?.type === 'UPDATE' && msg.result) setResult(msg.result as CheckResult)
        })
        return () => {
          disconnected = true
          try { port.disconnect() } catch {}
        }
      } catch (e: any) {
        setError(e?.message ?? String(e))
      }
    })()
  }, [])

  return (
    <div className="container">
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {result
        ? (<><div>判定: {result.ok ? '正解' : '不正解'}</div><div>詳細: {result.details}</div></>)
        : (<div>判定の更新を待機中…</div>)
      }
    </div>
  )
}

export default App
