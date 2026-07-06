import { createBrowserRouter, RouterProvider } from 'react-router'
import SearchPage from './pages/SearchPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <SearchPage />,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
