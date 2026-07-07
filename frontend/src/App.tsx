import { createBrowserRouter, RouterProvider } from 'react-router'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import ExplorePage from './pages/ExplorePage'
import SavedPage from './pages/SavedPage'
import DestinationPage from './pages/DestinationPage'
import ForYouPage from './pages/ForYouPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import TripsPage from './pages/TripsPage'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/explore', element: <ExplorePage /> },
      { path: '/saved', element: <SavedPage /> },
      { path: '/foryou', element: <ForYouPage /> },
      { path: '/trips', element: <TripsPage /> },
      { path: '/destinations/:id', element: <DestinationPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/admin', element: <AdminPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
