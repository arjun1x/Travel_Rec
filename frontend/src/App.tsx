import { createBrowserRouter, RouterProvider } from 'react-router'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DestinationPage from './pages/DestinationPage'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/destinations/:id', element: <DestinationPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
