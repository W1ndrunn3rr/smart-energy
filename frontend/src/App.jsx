import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { getUser } from './scripts/api'

function App() {
  const [count, setCount] = useState(0)
  const [user, setUser] = useState(null)

  useEffect(() => {
    console.log(user)
  }, [user])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Niko + Zjeba</h1><br></br>
      <h2>Zapraszamy na reklamy</h2>
      <div className="card">
        <button onClick={async () => setUser(await getUser(1))}>Get user</button>
        <h1>
          {user ? `Email: ${user["email"]} Hasło: ${user.password}` : "Brak danych użytkownika"}
        </h1>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App