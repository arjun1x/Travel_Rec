import { createBrowserRouter, RouterProvider } from 'react-router'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import ExplorePage from './pages/ExplorePage'
import SavedPage from './pages/SavedPage'
import DestinationPage from './pages/DestinationPage'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/explore', element: <ExplorePage /> },
      { path: '/saved', element: <SavedPage /> },
      { path: '/destinations/:id', element: <DestinationPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
