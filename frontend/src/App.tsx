import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-10 p-6">

      {/* HERO */}
      <section className="flex flex-col items-center gap-6 text-center">
        <div className="relative flex items-center justify-center">
          <img src={heroImg} className="w-40 opacity-80" />
          <img src={reactLogo} className="w-16 absolute left-0 animate-spin" />
          <img src={viteLogo} className="w-16 absolute right-0" />
        </div>

        <div>
          <h1 className="text-4xl font-bold text-blue-400">
            Get started 🚀
          </h1>
          <p className="text-gray-300 mt-2">
            Edit <code className="bg-gray-800 px-1 rounded">src/App.tsx</code> and test HMR
          </p>
        </div>

        <button
          onClick={() => setCount((count) => count + 1)}
          className="bg-blue-500 hover:bg-red-600 transition px-6 py-2 rounded-lg font-semibold shadow-lg"
        >
          Count is {count}
        </button>
      </section>

      {/* DOCS + SOCIAL */}
      <section className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">

        {/* DOCS */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:scale-105 transition">
          <h2 className="text-xl font-semibold text-green-400">Documentation</h2>
          <p className="text-gray-400 mb-4">Your questions, answered</p>

          <ul className="space-y-2">
            <li>
              <a href="https://vite.dev/" target="_blank"
                className="flex items-center gap-2 hover:text-blue-400">
                <img className="w-5" src={viteLogo} />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank"
                className="flex items-center gap-2 hover:text-blue-400">
                <img className="w-5" src={reactLogo} />
                Learn more
              </a>
            </li>
          </ul>
        </div>

        {/* SOCIAL */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:scale-105 transition">
          <h2 className="text-xl font-semibold text-purple-400">Community</h2>
          <p className="text-gray-400 mb-4">Join the Vite community</p>

          <ul className="space-y-2">
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank"
                className="hover:text-blue-400">
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank"
                className="hover:text-blue-400">
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank"
                className="hover:text-blue-400">
                X.com
              </a>
            </li>
          </ul>
        </div>

      </section>

    </div>
  )
}

export default App