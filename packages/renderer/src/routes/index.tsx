import { createFileRoute } from '@tanstack/react-router'
import logo from '../logo.svg'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <img
          src={logo}
          className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
          alt="logo"
          onError={(e) => {
            console.error('Logo failed to load:', e);
            // Hide the image if it fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="text-4xl font-bold mb-4">Welcome to Belcorp Report</h1>
        <p className="mb-4 text-lg">
          🎉 Your Electron app is working correctly with TanStack Router!
        </p>
        <p className="mb-4">
          Edit <code>src/routes/index.tsx</code> and save to reload.
        </p>
        <div className="flex flex-col gap-4">
          <a
            className="text-[#61dafb] hover:underline text-lg"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <a
            className="text-[#61dafb] hover:underline text-lg"
            href="https://tanstack.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn TanStack Router
          </a>
          <a
            className="text-[#61dafb] hover:underline text-lg"
            href="https://electronjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn Electron
          </a>
        </div>
      </header>
    </div>
  )
}
