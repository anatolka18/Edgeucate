import { createBrowserRouter } from "react-router-dom";
import Layout from "../pages/Layout";
import HomePage from "../pages/HomePage";
import AuthPage from "../pages/AuthPage";
import MyProfilePage from "../pages/myProfilePage";
import SearchPage, { advertisementLoader } from "../pages/SearchPage";
import MyAdvertisementPage, { myAdvertisementLoader } from "../pages/MyAdvertisementPage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Role } from "../types/user";

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
      {
        path: 'myadvertisement',
        loader: myAdvertisementLoader,
        element: (
          <ProtectedRoute allowedRoles={[Role.TEACHER]}>
            <MyAdvertisementPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);