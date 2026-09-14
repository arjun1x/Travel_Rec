import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { EmptyState } from '../components/QueryState'
export default function NotFoundPage() { return <main className="page-width py-20"><EmptyState title="A little off the beaten path." description="This page doesn’t exist. Let’s get you back to somewhere good." action={<Link to="/explore" className="button button-primary">Back to exploring <ArrowUpRight size={16} /></Link>} /></main> }
