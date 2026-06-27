import { createBrowserRouter } from "react-router";
import { ClientLayout } from "./components/client/ClientLayout";
import { Home } from "./components/client/Home";
import { LoginRegister } from "./components/client/LoginRegister";
import { Checkout } from "./components/client/Checkout";
import { Profile } from "./components/client/Profile";
import { KitchenDashboard } from "./components/kitchen/KitchenDashboard";
import { AdminDashboard } from "./components/admin/AdminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginRegister,
  },
  {
    path: "/client",
    Component: ClientLayout,
    children: [
      { index: true, Component: Home },
      { path: "checkout", Component: Checkout },
      { path: "profile", Component: Profile },
    ],
  },
  {
    path: "/kitchen",
    Component: KitchenDashboard,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
  },
]);
