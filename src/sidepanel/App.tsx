import { useEffect, useRef, useState } from 'react'
import './App.css'

type CheckResult = { ok: boolean; details: string }

const CORRECT_ANSWER_Q1 = "すばらしい。"
const CORRECT_IMG_SRC = "./images/star5.jpg" // ✅ 正解画像URLをここに設定！

function checkAnswer(actual: string, type: 'text' | 'img'): CheckResult {
  if (type === 'text') {
    if (actual === CORRECT_ANSWER_Q1) {
      return { ok: true, details: `一致: "${actual}"` }
    } else {
      return { ok: false, details: `不一致: あなたの入力="${actual}"` }
    }
  } else if (type === 'img') {
    if (actual === CORRECT_IMG_SRC) {
      return { ok: true, details: `一致: 正しい画像が設定されています。` }
    } else {
      return { ok: false, details: `不一致: 現在の画像src="${actual}"` }
    }
  }
  return { ok: false, details: "未知のタイプ" }
}

function App() {
  const [result, setResult] = useState<CheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [question, setQuestion] = useState<number>(1)
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
            const { actual, kind } = msg // kind: 'text' or 'img'
            const value = String(actual ?? '')

            // 初回はベースライン設定
            if (baselineRef.current === null) {
              baselineRef.current = value
              setResult(null)
              return
            }

            // 値が変更された場合のみ判定
            if (value !== baselineRef.current) {
              setResult(checkAnswer(value, kind))
            }
          }
        })

        port.onDisconnect.addListener(() => {
          baselineRef.current = null
          port = null
          setResult(null)
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
  }, [question])

  return (
    <div className="container">
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!result ? (
        <>
          {question === 1 ? (
            <div>
              <h2>問題1</h2>
              <p>レビューの「とにかくひどい。」を「すばらしい。」に書き換えてみよう！</p>
              <p>ヒント：開発者ツールを使って、レビューに当たる要素を探してみよう。</p>
              <button onClick={() => setQuestion(2)}>▶ 次の問題へ</button>
            </div>
          ) : (
            <div>
              <h2>問題2</h2>
              <p>商品画像を別の正しい画像に差し替えてみよう！</p>
              <p>ターゲット画像は <code>data-check-img</code> 属性を持っています。</p>
              <p>ヒント：要素の <code>src</code> を編集して正しいURL（{CORRECT_IMG_SRC}）にしてみよう。</p>
              <button onClick={() => setQuestion(1)}>◀ 前の問題へ</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div>判定: {result.ok ? '正解' : '不正解'}</div>
          <div>詳細: {result.details}</div>
          <button onClick={() => setResult(null)}>もう一度挑戦</button>
        </>
      )}
    </div>
  )
}

export default App
