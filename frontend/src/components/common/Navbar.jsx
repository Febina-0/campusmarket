
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

import {
  ShoppingBag,
  PlusCircle,
  Heart,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Package,
  CalendarCheck,
  ClipboardList,
  CheckCheck,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const {
    notifications = [],
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
  } = useNotification();

  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  const isAdmin = isAuthenticated && user?.role === "admin";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }

      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setMobileMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const getId = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value._id || null;
    return value;
  };

  const handleNotificationClick = async (notif) => {
    // Notifications are student features, so admins do not use this menu.
    if (isAdmin) return;

    try {
      if (!notif.isRead) {
        await markAsRead(notif._id);
      }

      setShowNotifications(false);

      const title = (notif.title || "").toLowerCase();

      if (notif.type === "message" && notif.relatedConversation) {
        const conversationId = getId(notif.relatedConversation);
        if (!conversationId) return;

        navigate(`/messages?conversation=${conversationId}`);
        return;
      }

      if (notif.type === "reservation" && notif.relatedReservation) {
        const reservationId = getId(notif.relatedReservation);
        if (!reservationId) return;

        if (
          title.includes("new reservation") ||
          title.includes("reservation request")
        ) {
          navigate(
            `/reservations?tab=incoming&reservationId=${reservationId}`
          );
          return;
        }

        if (title.includes("accepted") || title.includes("approved")) {
          const orderId = getId(notif.relatedOrder);

          if (orderId) {
            navigate(
              `/orders?tab=buying&orderId=${orderId}&action=payment`
            );
          } else {
            navigate(
              `/reservations?tab=outgoing&reservationId=${reservationId}`
            );
          }
          return;
        }

        if (
          title.includes("rejected") ||
          title.includes("expired")
        ) {
          navigate(
            `/reservations?tab=outgoing&reservationId=${reservationId}`
          );
          return;
        }

        if (
          title.includes("cancelled") ||
          title.includes("canceled")
        ) {
          navigate(
            `/reservations?tab=incoming&reservationId=${reservationId}`
          );
          return;
        }

        navigate(
          `/reservations?tab=outgoing&reservationId=${reservationId}`
        );
        return;
      }

      if (notif.type === "order" && notif.relatedOrder) {
        const orderId = getId(notif.relatedOrder);
        if (!orderId) return;

        if (
          title.includes("payment selected") ||
          title.includes("payment method selected")
        ) {
          navigate(`/orders?tab=selling&orderId=${orderId}`);
          return;
        }

        if (
          title.includes("handed over") ||
          title.includes("handover")
        ) {
          navigate(`/orders?tab=buying&orderId=${orderId}&action=confirm`);
          return;
        }

        if (
          title.includes("item received") ||
          title.includes("completed") ||
          title.includes("order completed")
        ) {
          navigate(`/orders?tab=selling&orderId=${orderId}`);
          return;
        }

        navigate(`/orders?tab=buying&orderId=${orderId}`);
        return;
      }

      if (notif.relatedProduct) {
        const productId = getId(notif.relatedProduct);
        if (!productId) return;

        navigate(`/products/${productId}`);
      }
    } catch (error) {
      console.error("Notification navigation error:", error);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinkClass =
    "block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors";

  const adminLinkClass =
    "block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors";

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* LOGO */}
          <Link
            to={isAdmin ? "/admin/dashboard" : "/"}
            className="flex items-center gap-2.5 flex-shrink-0 group"
            onClick={closeMobileMenu}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>

            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight block leading-tight">
                Campus<span className="text-indigo-600">Market</span>
              </span>

              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                {isAdmin ? "Administration" : "Student Marketplace"}
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden md:flex items-center gap-2">
            {isAdmin ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Admin Dashboard
                </Link>

                <Link to="/admin/users" className={adminLinkClass}>
                  Manage Students
                </Link>

                <Link to="/admin/products" className={adminLinkClass}>
                  Manage Products
                </Link>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : isAuthenticated ? (
              <>
                <Link to="/" className={navLinkClass}>
                  Explore Items
                </Link>

                <Link
                  to="/wishlist"
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                  title="My Wishlist"
                >
                  <Heart className="w-5 h-5" />
                </Link>

                <Link
                  to="/messages"
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>

                {/* NOTIFICATIONS */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications((previous) => !previous)}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />

                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-800">
                            Notifications
                          </h3>

                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>

                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 15).map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3 text-left transition-colors cursor-pointer ${
                                notif.isRead
                                  ? "bg-white hover:bg-slate-50"
                                  : "bg-indigo-50/50 hover:bg-indigo-50/80"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-800">
                                  {notif.title}
                                </span>

                                <span className="text-[10px] text-slate-400">
                                  {new Date(notif.createdAt).toLocaleDateString(
                                    [],
                                    { month: "short", day: "numeric" }
                                  )}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to="/products/new"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Sell Item
                </Link>

                {/* STUDENT USER MENU */}
                <div className="relative ml-1" ref={userRef}>
                  <button
                    onClick={() => setShowUserMenu((previous) => !previous)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 text-slate-700"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-sm">
                      {user?.name ? user.name[0].toUpperCase() : "U"}
                    </div>

                    <span className="text-sm font-semibold hidden lg:inline max-w-[120px] truncate">
                      {user?.name || "User"}
                    </span>

                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user?.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/my-listings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50"
                        >
                          <Package className="w-4 h-4" />
                          My Listings
                        </Link>

                        <Link
                          to="/reservations"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50"
                        >
                          <CalendarCheck className="w-4 h-4" />
                          Reservations
                        </Link>

                        <Link
                          to="/orders"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50"
                        >
                          <ClipboardList className="w-4 h-4" />
                          Orders & Handover
                        </Link>

                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50"
                        >
                          <User className="w-4 h-4" />
                          Profile Settings
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/" className={navLinkClass}>
                  Explore Items
                </Link>

                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 rounded-xl hover:bg-slate-100"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* MOBILE HEADER BUTTONS */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && !isAdmin && (
              <Link
                to="/products/new"
                className="p-2 text-white bg-indigo-600 rounded-lg"
                title="Sell"
              >
                <PlusCircle className="w-5 h-5" />
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen((previous) => !previous)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          {isAdmin ? (
            <>
              <Link
                to="/admin/dashboard"
                onClick={closeMobileMenu}
                className={adminLinkClass}
              >
                <span className="inline-flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Dashboard
                </span>
              </Link>

              <Link
                to="/admin/users"
                onClick={closeMobileMenu}
                className={adminLinkClass}
              >
                Manage Students
              </Link>

              <Link
                to="/admin/products"
                onClick={closeMobileMenu}
                className={adminLinkClass}
              >
                Manage Products
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-base font-semibold text-rose-600 rounded-lg hover:bg-rose-50"
              >
                Sign Out
              </button>
            </>
          ) : isAuthenticated ? (
            <>
              <Link to="/" onClick={closeMobileMenu} className={navLinkClass}>
                Explore Items
              </Link>

              <Link to="/wishlist" onClick={closeMobileMenu} className={navLinkClass}>
                Wishlist
              </Link>

              <Link to="/messages" onClick={closeMobileMenu} className={navLinkClass}>
                Messages
              </Link>

              <Link to="/my-listings" onClick={closeMobileMenu} className={navLinkClass}>
                My Listings
              </Link>

              <Link to="/reservations" onClick={closeMobileMenu} className={navLinkClass}>
                Reservations
              </Link>

              <Link to="/orders" onClick={closeMobileMenu} className={navLinkClass}>
                Orders
              </Link>

              <Link to="/profile" onClick={closeMobileMenu} className={navLinkClass}>
                Profile Settings
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-base font-semibold text-rose-600 rounded-lg hover:bg-rose-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/" onClick={closeMobileMenu} className={navLinkClass}>
                Explore Items
              </Link>

              <Link to="/login" onClick={closeMobileMenu} className={navLinkClass}>
                Log In
              </Link>

              <Link to="/register" onClick={closeMobileMenu} className={navLinkClass}>
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;