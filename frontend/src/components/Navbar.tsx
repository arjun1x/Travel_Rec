import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ArrowUpRight, Bookmark, Menu, X, UserRound } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useShortlist } from '../lib/shortlist'
import BrandMark from './BrandMark'

export default function Navbar() {
  const { ids } = useShortlist()
  const { user, isAuthed } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => { setOpen(false) }, [location])
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])
  return <header className="site-header">
    <div className="nav-inner">
      <Link to="/" className="wordmark" aria-label="Travel Rec home"><BrandMark />travel<span>rec</span><span className="brand-period">.</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        <NavLink to="/explore">Explore</NavLink>
        <NavLink to="/collections">Collections</NavLink>
        <NavLink to="/trips">My trips</NavLink>
        {isAuthed && <NavLink to="/foryou">For you</NavLink>}
        {user?.is_admin && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="nav-actions">
        <Link to="/saved" className="nav-saved" aria-label={`Saved places${ids.length ? ` (${ids.length})` : ''}`}><Bookmark size={18} /><span>Saved</span>{ids.length > 0 && <b>{ids.length}</b>}</Link>
        <Link to={isAuthed ? '/profile' : '/login'} className="nav-account">{isAuthed ? <><UserRound size={16} />{user?.name.split(' ')[0] || 'Account'}</> : <>Sign in <ArrowUpRight size={15} /></>}</Link>
        <button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
    </div>
    {open && <nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
      <NavLink to="/explore">Explore destinations <ArrowUpRight size={18} /></NavLink>
      <NavLink to="/collections">Travel collections <ArrowUpRight size={18} /></NavLink>
      <NavLink to="/trips">My trips <ArrowUpRight size={18} /></NavLink>
      <NavLink to="/saved">Saved places <span>{ids.length}</span></NavLink>
      {isAuthed && <NavLink to="/foryou">For you <ArrowUpRight size={18} /></NavLink>}
      {user?.is_admin && <NavLink to="/admin">Admin <ArrowUpRight size={18} /></NavLink>}
    </nav>}
  </header>
}
