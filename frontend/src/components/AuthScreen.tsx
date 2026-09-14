import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react'
import { login, register, useAuth } from '../lib/auth'
import { DEMO_MODE } from '../lib/config'
import { safeReturnPath } from '../lib/discovery'
import BrandMark from './BrandMark'

export default function AuthScreen({ signup = false }: { signup?: boolean }) {
  const { isAuthed } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const next = safeReturnPath(location.state?.from, signup ? '/profile' : '/trips')
  if (isAuthed) return <Navigate to={next} replace />
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (DEMO_MODE || busy) return
    setBusy(true); setError('')
    try {
      if (signup) await register(email.trim(), password, name.trim())
      else await login(email.trim(), password)
      navigate(next, { replace: true })
    } catch (e) { setError(e instanceof TypeError ? 'We couldn’t reach the account service. Please try again in a moment.' : e instanceof Error ? e.message : 'Something went wrong. Please try again.') }
    finally { setBusy(false) }
  }
  return <main className="auth-page"><div className="auth-picture"><img src="/images/italian-coast.jpg" alt="Italian Riviera coastline" /><div><BrandMark /><h2>Your next chapter<br />starts somewhere.</h2><p>Keep your travel preferences, build a day-by-day itinerary, and bring your next trip a little closer.</p></div></div>
    <div className="auth-form-side"><span className="eyebrow">{signup ? 'ROOM FOR ONE MORE' : 'GOOD TO SEE YOU AGAIN'}</span><h1>{signup ? 'Join the journey.' : 'Welcome back.'}</h1><p>{signup ? 'A few details now. A whole world of possibilities next.' : 'Sign in for your itineraries, stays, and travel preferences.'}</p>
    {DEMO_MODE && <div className="service-note">You’re exploring the sample collection. Sign-in and accounts become available when the backend is connected. You can still explore and save places.</div>}
    <form onSubmit={(e) => void submit(e)}>
      {signup && <label className="auth-field">Your name<input autoComplete="name" required minLength={1} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="How should we call you?" disabled={DEMO_MODE} /></label>}
      <label className="auth-field">Email address<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={DEMO_MODE} /></label>
      <label className="auth-field">Password<div className="password-input"><input type={visible ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} required minLength={signup ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={signup ? 'At least 8 characters' : 'Your password'} disabled={DEMO_MODE} /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{signup && <small>Make it at least 8 characters.</small>}</label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button type="submit" className="button button-primary" disabled={busy || DEMO_MODE}>{busy ? 'One moment…' : signup ? 'Create my account' : 'Sign in'}<ArrowUpRight size={16} /></button>
    </form><p className="auth-alternate">{signup ? 'Already part of the journey?' : 'New around here?'} <Link to={signup ? '/login' : '/register'} state={location.state}>{signup ? 'Sign in' : 'Create an account'}</Link></p>
    <p className="auth-alternate"><Link to="/explore">Keep exploring without an account</Link></p></div>
  </main>
}
