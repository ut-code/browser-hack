import { useEffect, useRef, useState } from 'react'
import './App.css'

type CheckResult = { ok: boolean; details: string }

const CORRECT_ANSWER = "すばらしい。"

function checkAnswer(actual: string): CheckResult {
  if (actual === CORRECT_ANSWER) {
    return { ok: true, details: `一致: "${actual}"` }
  } else {
    return { ok: false, details: `不一致: あなたの入力="${actual}"` }
  }
}

function App() {
  const [result, setResult] = useState<CheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const baselineRef = useRef<string | null>(null)

  useEffect(() => {
    let port: chrome.runtime.Port | null = null

    const connect = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab?.id) return

        port = chrome.tabs.connect(tab.id, { name: 'sidepanel' })

        port.onMessage.addListener((msg) => {
          if (msg?.type === 'DOM_VALUE_UPDATE') {
            const actual = String(msg.actual ?? '')

            // 初回はベースラインの設定のみ行う
            if (baselineRef.current === null) {
              baselineRef.current = actual
              setResult(null) // 待機画面を維持
              return
            }

            // 2回目以降で、かつ値がベースラインから変更された場合のみ判定する
            if (actual !== baselineRef.current) {
              setResult(checkAnswer(actual))
            }
          }
        })

        port.onDisconnect.addListener(() => {
          // ページ更新・遷移でリセット
          baselineRef.current = null
          port = null
          setResult(null) // 待機画面に戻す
        })
      } catch (e: any) {
        setError(e?.message ?? String(e))
      }
    }

    connect()

    return () => {
      if (port) {
        try {
          port.disconnect()
        } catch {}
      }
      baselineRef.current = null
    }
  }, [])

  return (
    <div className="container">
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {result ? (
        <>
          <h2>問題1</h2>
          <p>レビューの「とにかくひどい。」を「すばらしい。」に書き換えてみよう！</p>
          <h2>判定: {result.ok ? '正解' : '不正解'}</h2>
          <div>詳細: {result.details}</div>
        </>
      ) : (
        <div>
          <h2>問題1</h2>
          <p>レビューの「とにかくひどい。」を「すばらしい。」に書き換えてみよう！</p>
          <p>ヒント：開発者ツールを使って、レビューに当たる要素を探してみよう。</p>
        </div>
      )}
    </div>
  )
}

export default App