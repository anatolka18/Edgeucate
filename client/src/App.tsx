import { RouterProvider } from "react-router-dom"
import { router } from "./router/router"
import { useAppDispatch } from "./store/hooks"
import { getTokenFromLocalStorage } from "./helpers/localstorage.helper"
import { AuthService } from "./services/auth.service"
import { login, logout } from "./store/user/userSlice"
import { useEffect, useState } from "react"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { io, Socket } from "socket.io-client"
import { apiUrl } from "./api/axios.api"

export let MySocket: { socket: Socket | null } = { socket: null }

export function ensureSocket(token: string) {
  if (!MySocket.socket || !MySocket.socket.connected) {
    MySocket.socket = io(`${apiUrl}/users`, {
      auth: { token },
    })
    MySocket.socket.on("connect", () => {})
    MySocket.socket.on("connect_error", () => {})
  }
}

function App() {
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    const token = getTokenFromLocalStorage()
    try {
      if (token) {
        const data = await AuthService.getProfile()
        if (data) {
          dispatch(login(data))
          ensureSocket(token)
        } else {
          dispatch(logout())
          MySocket.socket = null
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

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