import { lazy, Suspense } from "react";
import { createBrowserRouter, useParams } from "react-router-dom";
import Layout from "../pages/Layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Role } from "../types/user";
import ErrorBoundary from "../components/ErrorBoundary";
import { chatListLoader } from "../pages/ChatListPage";
import { advertisementLoader } from "../pages/SearchPage";
import { myAdvertisementLoader } from "../pages/MyAdvertisementPage";
import { advertisementDetailLoader } from "../pages/AdvertisementPage";
import { chatLoader } from "../pages/ChatPage";
export { advertisementLoader } from "../pages/SearchPage";
export { myAdvertisementLoader } from "../pages/MyAdvertisementPage";
export { advertisementDetailLoader } from "../pages/AdvertisementPage";
export { chatListLoader } from "../pages/ChatListPage";
export { chatLoader } from "../pages/ChatPage";

const HomePage = lazy(() => import("../pages/HomePage"));
const AuthPage = lazy(() => import("../pages/AuthPage"));
const MyProfilePage = lazy(() => import("../pages/myProfilePage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const MyAdvertisementPage = lazy(() => import("../pages/MyAdvertisementPage"));
const AdvertisementPage = lazy(() => import("../pages/AdvertisementPage"));
const ChatListPage = lazy(() => import("../pages/ChatListPage"));
const ChatPage = lazy(() => import("../pages/ChatPage"));
const RoomPage = lazy(() => import("../pages/RoomPage"));
const AllRoomPage = lazy(() => import("../pages/AllRoomPage"));
const CalendarPage = lazy(() => import("../pages/CalendarPage"));
const AllUsersPage = lazy(() => import("../pages/AllUsersPage"));
const VerifyEmailPage = lazy(() => import("../pages/VerifyEmailPage"));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));

const ChatPageWrapper = () => {
  const { email } = useParams();
  return <ChatPage key={email} />;
};

const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3D5B82]"></div>
  </div>
);

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorBoundary><div /></ErrorBoundary>,
    children: [
      { index: true, element: <Lazy><HomePage /></Lazy> },
      { path: 'auth', element: <Lazy><AuthPage /></Lazy> },
      {
        path: 'myprofile',
        element: <ProtectedRoute><Lazy><MyProfilePage /></Lazy></ProtectedRoute>,
      },
      {
        path: 'search',
        loader: advertisementLoader,
        element: <Lazy><SearchPage /></Lazy>,
      },
      {
        path: 'myadvertisement',
        loader: myAdvertisementLoader,
        element: <ProtectedRoute allowedRoles={[Role.TEACHER]}><Lazy><MyAdvertisementPage /></Lazy></ProtectedRoute>,
      },
      {
        path: "advertisement/:id",
        loader: advertisementDetailLoader,
        element: <Lazy><AdvertisementPage /></Lazy>,
      },
      {
        path: "chats",
        loader: chatListLoader,
        element: <ProtectedRoute><Lazy><ChatListPage /></Lazy></ProtectedRoute>,
      },
      {
        path: "chat/:email",
        loader: chatLoader,
        element: <ProtectedRoute><Lazy><ChatPageWrapper /></Lazy></ProtectedRoute>,
      },
      {
        path: 'rooms',
        element: <Lazy><AllRoomPage /></Lazy>,
      },
      {
        path: 'room/:id',
        element: <Lazy><RoomPage /></Lazy>,
      },
      {
        path: 'calendar',
        element: <Lazy><CalendarPage /></Lazy>,
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute allowedRoles={[Role.ADMIN]}>
            <Lazy><AllUsersPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: 'verify-email',
        element: <Lazy><VerifyEmailPage /></Lazy>,
      },
      {
        path: 'reset-password',
        element: <Lazy><ResetPasswordPage /></Lazy>,
      },
    ],
  },
]);