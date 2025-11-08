// App.tsx
import { useEffect, useRef, useState } from 'react'
import './App.css'

type CheckResult = { ok: boolean; details: string }

// 答えの定義
const ANSWERS = {
  p1: "すばらしい。",
  p2: "./images/star5.png",
  p3Visible: false,
}

function App() {
  // 現在の問題番号 
  const [step, setStep] = useState(1)
  // 判定結果
  const [result, setResult] = useState<CheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // イベントリスナー内で最新の step を参照するための Ref
  const stepRef = useRef(step)
  // 各ステップの初期値を保持するベースライン
  const baselineRef = useRef<{ p1: string | null; p2: string | null; p3Visible: boolean | null }>({
    p1: null,
    p2: null,
    p3Visible: null,
  })

  // state が変わったら ref も更新しておく
  useEffect(() => {
    stepRef.current = step
  }, [step])

  useEffect(() => {
    let port: chrome.runtime.Port | null = null

    const connect = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab?.id) return

        port = chrome.tabs.connect(tab.id, { name: 'sidepanel' })

        port.onMessage.addListener((msg) => {
          if (msg?.type === 'DOM_VALUE_UPDATE') {
            const { p1, p2, p3Visible } = msg.values
            const currentStep = stepRef.current

            if (currentStep === 1) {
              if (baselineRef.current.p1 === null) {
                baselineRef.current.p1 = p1
                return
              }
              if (p1 !== baselineRef.current.p1) {
                const isCorrect = p1 === ANSWERS.p1
                setResult({ ok: isCorrect, details: isCorrect ? `一致: "${p1}"` : `不一致: "${p1}"` })
                if (isCorrect) {
                  setTimeout(() => {
                    setStep(2)
                    setResult(null)
                    baselineRef.current.p2 = p2
                  }, 2000)
                }
              }
            }
            
            if (currentStep === 2) {
              if (baselineRef.current.p2 === null) {
                baselineRef.current.p2 = p2
                return
              }
              if (p2 !== baselineRef.current.p2) {
                const isCorrect = p2.includes(ANSWERS.p2)
                setResult({ ok: isCorrect, details: isCorrect ? `一致: (${p2})` : `不一致: (${p2})` })
                if (isCorrect) {
                  setTimeout(() => {
                    setStep(3)
                    setResult(null)
                    baselineRef.current.p3Visible = p3Visible
                  }, 2000)
                }
              }
            }

            // 問題3のロジック
            if (currentStep === 3) {
              if (baselineRef.current.p3Visible === null) {
                baselineRef.current.p3Visible = p3Visible
                return
              }
              if (p3Visible !== baselineRef.current.p3Visible) {
                const isCorrect = p3Visible === ANSWERS.p3Visible
                setResult({
                  ok: isCorrect,
                  details: isCorrect ? `要素が非表示になりました` : `要素はまだ表示されています`
                })
              }
            }
          }
        })

        port.onDisconnect.addListener(() => {
          baselineRef.current = { p1: null, p2: null, p3Visible: null }
          port = null
          setResult(null)
          setStep(1)
        })
      } catch (e: any) {
        setError(e?.message ?? String(e))
      }
    }

    connect()

    return () => {
      if (port) {
        try { port.disconnect() } catch {}
      }
      baselineRef.current = { p1: null, p2: null, p3Visible: null }
    }
  }, [])

  // UI描画
  return (
    <div className="container">
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {step === 1 && (
        <div>
          <h2>問題1</h2>
          <p>レビューの「とにかくひどい。」を「すばらしい。」に書き換えてみよう！</p>
          {result && <div className={result.ok ? "result-ok" : "result-ng"}><h3>判定: {result.ok ? '正解！' : '不正解'}</h3><p>{result.details}</p>{result.ok && <p>次の問題へ進みます...</p>}</div>}
          {!result && <p className="hint">ヒント：開発者ツールを使って、レビューに当たる要素を探してみよう。</p>}
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>問題2</h2>
          <p>星1の画像(star1.png)の <code>src</code> を書き換えて、星5 (star5.png) にしてみよう！</p>
          {result && <div className={result.ok ? "result-ok" : "result-ng"}><h3>判定: {result.ok ? '正解！' : '不正解'}</h3><p>{result.details}</p>{result.ok && <p>次の問題へ進みます...</p>}</div>}
          {!result && <p className="hint">ヒント：imgタグの src 属性を探そう。</p>}
        </div>
      )}

      {/* ステップ3の表示 */}
      {step === 3 && (
        <div>
          <h2>問題3</h2>
          <p>一つ目のレビューを、CSSを使って非表示にしてみよう！</p>
          {result && (
            <div className={result.ok ? "result-ok" : "result-ng"}>
              <h3>判定: {result.ok ? '正解！' : '不正解'}</h3>
              <p>{result.details}</p>
            </div>
          )}
          {!result && <p className="hint">ヒント：DevToolsのスタイルパネルで <code>display: none;</code> を追加してみよう。</p>}
        </div>
      )}
    </div>
  )
}

export default App