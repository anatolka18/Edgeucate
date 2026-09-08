import { RouterProvider } from "react-router-dom"
import { router } from "./router/router"
import { useAppDispatch } from "./store/hooks"
import { AuthService } from "./services/auth.service"
import { login, logout } from "./store/user/userSlice"
import { useEffect, useState } from "react"
import { Toaster } from 'sonner'
import { io } from "socket.io-client"
import { setAccessToken, setAuthReady, MySocket } from "./store/auth-state"
import { notificationsWebSocket } from "./services/notificationsWebSocket"

export function ensureSocket(token: string) {
  if (!MySocket.socket || !MySocket.socket.connected) {
    MySocket.socket = io('/users', {
      auth: { token },
    })
  }

  notificationsWebSocket.connect(token);
}

function App() {
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const path = window.location.pathname;

    if (path === '/auth' || path.startsWith('/verify-email') || path.startsWith('/reset-password')) {
      setAuthReady(true);
      setIsLoading(false);
      return;
    }

    const initCsrf = async () => {
      try {
        await fetch('/api/csrf-token', { credentials: 'include' });
      } catch {
        // ignore
      }
    };

    const checkAuth = async () => {
      await initCsrf();
      try {
        const newToken = await AuthService.refreshToken();
        if (newToken) {
          const data = await AuthService.getProfile();
          if (data) {
            dispatch(login(data));
            ensureSocket(newToken);
            setIsLoading(false);
            setAuthReady(true);
            return;
          }
        }
        dispatch(logout());
        setAccessToken(null);
        setIsLoading(false);
        setAuthReady(true);
        window.location.href = '/auth';
      } catch {
        dispatch(logout());
        setAccessToken(null);
        setIsLoading(false);
        setAuthReady(true);
        window.location.href = '/auth';
      }
    };

    checkAuth();
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D5B82]"></div>
      </div>
    )
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster 
        position="bottom-left" 
        theme={theme}
        richColors 
        closeButton 
        duration={2000}
        toastOptions={{
          style: {
            borderRadius: '4px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '13px',
            padding: '10px 14px',
            minWidth: '0',
            minHeight: '0',
            width: 'auto',
            textAlign: 'right',
          },
          classNames: {
            closeButton: 'min-w-0 min-h-0 w-5 h-5',
          },
        }}
      />
    </>
  )
}

export default App