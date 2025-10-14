import { useState } from 'react'
import './App.css'

function App() {
  const [text, setText] = useState('こんにちは、サイドパネル！')

  return (
    <div className="container">
      <h2>{text}</h2>
      <button onClick={() => setText('更新されました！')}>更新</button>
    </div>
  )
}


export default App
