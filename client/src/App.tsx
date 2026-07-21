import { RouterProvider } from "react-router-dom"
import { router } from "./router/router"
import { useAppDispatch } from "./store/hooks"
import { AuthService } from "./services/auth.service"
import { login, logout } from "./store/user/userSlice"
import { useEffect, useState } from "react"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { io } from "socket.io-client"
import { setAccessToken, setAuthReady, MySocket } from "./store/auth-state"

export function ensureSocket(token: string) {
  if (!MySocket.socket || !MySocket.socket.connected) {
    MySocket.socket = io('/users', {
      auth: { token },
    })
  }
}

function App() {
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const path = window.location.pathname

    if (path === '/auth') {
      setAuthReady(true)
      setIsLoading(false)
      return
    }

    const checkAuth = async () => {
      try {
        const newToken = await AuthService.refreshToken()
        if (newToken) {
          const data = await AuthService.getProfile()
          if (data) {
            dispatch(login(data))
            ensureSocket(newToken)
            setIsLoading(false)
            setAuthReady(true)
            return
          }
        }
        dispatch(logout())
        setAccessToken(null)
        setIsLoading(false)
        setAuthReady(true)
        window.location.href = '/auth'
      } catch {
        dispatch(logout())
        setAccessToken(null)
        setIsLoading(false)
        setAuthReady(true)
        window.location.href = '/auth'
      }
    }

    checkAuth()
  }, [dispatch])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D5B82]"></div>
      </div>
    )
  }

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position='bottom-left' autoClose={2000} />
    </>
  )
}

export default App