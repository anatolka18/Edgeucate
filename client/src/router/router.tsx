import { createBrowserRouter } from "react-router-dom";
import Layout from "../pages/Layout";
import HomePage from "../pages/HomePage";
import AuthPage from "../pages/AuthPage";
import MyProfilePage from "../pages/myProfilePage";
import SearchPage, { advertisementLoader } from "../pages/SearchPage";
import { ProtectedRoute } from "../pages/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'auth',
        element: <AuthPage />,
      },
      {
        path: 'myprofile',
        element: (
          <ProtectedRoute>
            <MyProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'search',
        loader: advertisementLoader,
        element: <SearchPage />,
      },
    ],
  },
]);