
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";

import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Reservation from "./pages/Reservation";
import Orders from "./pages/Orders";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import Create from "./pages/Create";
import EditProduct from "./pages/EditProduct";
import MyListings from "./pages/MyListings";
import ProductDetails from "./pages/ProductDetails";
import MyProfile from "./pages/MyProfile";
import Messages from "./pages/Messages";
import Wishlist from "./pages/Wishlist";

import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminStudentProducts from "./pages/AdminStudentProducts";
import AdminProducts from "./pages/AdminProducts";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Navbar />

            <Routes>
              {/* Public pages */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Home page */}
              <Route path="/" element={<HomePage />} />

              {/* Student-only pages */}
              <Route element={<ProtectedRoute studentOnly />}>
                <Route path="/products/new" element={<Create />} />
                <Route path="/products/:id/edit" element={<EditProduct />} />
                <Route path="/my-listings" element={<MyListings />} />
                <Route path="/profile" element={<MyProfile />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/reservations" element={<Reservation />} />
                <Route path="/orders" element={<Orders />} />
              </Route>

              {/* Product details can be viewed by students and admins */}
              <Route
                path="/products/:id"
                element={<ProductDetails />}
              />

              {/* Admin-only pages */}
              <Route element={<ProtectedRoute adminOnly />}>
                <Route
                  path="/admin/dashboard"
                  element={<AdminDashboard />}
                />

                <Route
                  path="/admin/users"
                  element={<AdminUsers />}
                />

                <Route
                  path="/admin/users/:userId/products"
                  element={<AdminStudentProducts />}
                />

                <Route
                  path="/admin/products"
                  element={<AdminProducts />}
                />
              </Route>
            </Routes>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;