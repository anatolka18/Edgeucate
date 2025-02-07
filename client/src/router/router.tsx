import { createBrowserRouter } from "react-router-dom";
import Layout from "../pages/Layout";
import HomePage from "../pages/HomePage";
import AuthPage from "../pages/AuthPage";
import MyProfilePage from "../pages/myProfilePage";
import SearchPage, { advertisementLoader } from "../pages/SearchPage";
import MyAdvertisementPage, { myAdvertisementLoader } from "../pages/MyAdvertisementPage";
import AdvertisementPage, { advertisementDetailLoader } from "../pages/AdvertisementPage";
import ChatListPage, { chatListLoader } from "../pages/ChatListPage";
import ChatPage, { chatLoader } from "../pages/ChatPage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Role } from "../types/user";
import RoomPage from "../pages/RoomPage";
import AllRoomPage from "../pages/AllRoomPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'auth', element: <AuthPage /> },
      {
        path: 'myprofile',
        element: <ProtectedRoute><MyProfilePage /></ProtectedRoute>,
      },
      {
        path: 'search',
        loader: advertisementLoader,
        element: <SearchPage />,
      },
      {
        path: 'myadvertisement',
        loader: myAdvertisementLoader,
        element: <ProtectedRoute allowedRoles={[Role.TEACHER]}><MyAdvertisementPage /></ProtectedRoute>,
      },
      {
        path: "advertisement/:id",
        loader: advertisementDetailLoader,
        element: <AdvertisementPage />,
      },
      {
        path: "chats",
        loader: chatListLoader,
        element: <ProtectedRoute><ChatListPage /></ProtectedRoute>,
      },
      {
        path: "chat/:email",
        loader: chatLoader,
        element: <ProtectedRoute><ChatPage /></ProtectedRoute>,
      },
      {
        path: 'rooms',
        element: <AllRoomPage />,
      },
      {
        path: 'room/:id',
        element: <RoomPage />,
      }, 
    ],
  },
]);