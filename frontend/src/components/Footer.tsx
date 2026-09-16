import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import BrandMark from './BrandMark'

export default function Footer() {
  return <footer className="site-footer"><div className="footer-main page-width">
    <div><Link to="/" className="wordmark"><BrandMark />travel<span>rec</span>.</Link><p>For the places you haven’t been.<br />And the person you’ll be when you get back.</p></div>
    <div className="footer-links"><div><span>GO SOMEWHERE</span><Link to="/explore">Explore destinations</Link><Link to="/collections">Find your kind of trip</Link><Link to="/saved">Your saved places</Link></div>
      <div><span>MAKE IT YOURS</span><Link to="/trips">My trips</Link><Link to="/profile">Travel preferences</Link><Link to="/help">Questions & answers</Link></div></div>
    <Link to="/explore" className="footer-callout">Good things<br />are out there. <ArrowUpRight size={28} /></Link>
  </div><div className="footer-bottom page-width"><span>© {new Date().getFullYear()} Travel Rec</span><span>Made for the curious.</span><div><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather by Open-Meteo</a><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a><a href="/images/CREDITS.md">Photo credits</a></div></div></footer>
}
