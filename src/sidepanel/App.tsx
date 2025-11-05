// App.tsx
import { useEffect, useRef, useState } from 'react'
import './App.css'

type CheckResult = { ok: boolean; details: string }

// 答えの定義
const ANSWERS = {
  p1: "すばらしい。",
  p2: "./images/star5.png"
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
  const baselineRef = useRef<{ p1: string | null; p2: string | null }>({
    p1: null,
    p2: null,
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
            const { p1, p2 } = msg.values
            const currentStep = stepRef.current

            
            if (currentStep === 1) {
              // 初回ロード時の値をベースラインとして記憶
              if (baselineRef.current.p1 === null) {
                baselineRef.current.p1 = p1
                return
              }

              // ベースラインから変化があった場合のみ判定
              if (p1 !== baselineRef.current.p1) {
                const isCorrect = p1 === ANSWERS.p1
                setResult({
                  ok: isCorrect,
                  details: isCorrect ? `一致: "${p1}"` : `不一致: "${p1}"`
                })

                // 正解なら2秒後に次の問題へ
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
                setResult({
                  ok: isCorrect,
                  details: isCorrect ? `一致: (${p2})` : `不一致: (${p2})`
                })
                // ※ここでさらに step3 へ遷移させることも可能
              }
            }
          }
        })

        port.onDisconnect.addListener(() => {
          baselineRef.current = { p1: null, p2: null }
          port = null
          setResult(null)
          setStep(1) // 接続が切れたら最初に戻す
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
      baselineRef.current = { p1: null, p2: null }
    }
  }, [])

  // UI描画
  return (
    <div className="container">
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* ステップ1の表示 */}
      {step === 1 && (
        <div>
          <h2>問題1</h2>
          <p>レビューの「とにかくひどい。」を「すばらしい。」に書き換えてみよう！</p>
          {result && (
            <div className={result.ok ? "result-ok" : "result-ng"}>
              <h3>判定: {result.ok ? '正解！' : '不正解'}</h3>
              <p>{result.details}</p>
              {result.ok && <p>次の問題へ進みます...</p>}
            </div>
          )}
          {!result && <p className="hint">ヒント：開発者ツールを使って、レビューに当たる要素を探してみよう。</p>}
        </div>
      )}

      {/* ステップ2の表示 */}
      {step === 2 && (
        <div>
          <h2>問題2</h2>
          <p>星1の画像(star1.png)の <code>src</code> を書き換えて、星5 (star5.png) にしてみよう！</p>
          {result && (
            <div className={result.ok ? "result-ok" : "result-ng"}>
              <h3>判定: {result.ok ? '正解！' : '不正解'}</h3>
              <p>{result.details}</p>
            </div>
          )}
          {!result && <p className="hint">ヒント：imgタグの src 属性を探そう。</p>}
        </div>
      )}
    </div>
  )
}

export default App