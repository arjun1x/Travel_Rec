import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { login } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-center text-3xl font-extrabold tracking-tight">
        Welcome <span className="text-sky-600 dark:text-sky-400">back</span>
      </h1>
      <p className="mt-2 text-center text-gray-500 dark:text-gray-400">
        Sign in to sync your trips and preferences.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-900"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gray-900 py-3 font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
        New here?{' '}
        <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
        Demo account: demo@travelrec.dev / demo1234
      </p>
    </main>
  )
}
