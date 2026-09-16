import { useState } from 'react'


import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Audioinput from './components/input'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Audioinput />} />
          <Route path="/input" element={<Audioinput />} />
        </Routes>
      </BrowserRouter>


    </>
  )
}

export default App
