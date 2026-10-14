import React, { useEffect, useState } from "react";

import {
  getMyOrders,
  selectPaymentMethod,
  markOrderHandedOver,
  confirmOrderReceived,
} from "../api/orders";

import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const Orders = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  // BUYING / SELLING TAB
  const [activeTab, setActiveTab] = useState("buying");

  // ==============================
  // LOAD ORDERS
  // ==============================

  const loadOrders = async () => {
    try {
      setError("");

      const data = await getMyOrders();

      setOrders(data.orders || []);
    } catch (err) {
      console.error(
        "Failed to load orders:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // INITIAL LOAD
  // ==============================

  useEffect(() => {
    loadOrders();
  }, []);

  // ==============================
  // SOCKET AUTO REFRESH
  // ==============================

  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = () => {
      loadOrders();
    };

    socket.on(
      "new_notification",
      handleOrderUpdate
    );

    return () => {
      socket.off(
        "new_notification",
        handleOrderUpdate
      );
    };
  }, [socket]);

  // ==============================
  // CURRENT USER ID
  // ==============================

  const currentUserId =
    user?.id || user?._id;

  // ==============================
  // SEPARATE BUYING & SELLING
  // ==============================

  const buyingOrders = orders.filter(
    (order) =>
      order.buyer?._id?.toString() ===
      currentUserId?.toString()
  );

  const sellingOrders = orders.filter(
    (order) =>
      order.seller?._id?.toString() ===
      currentUserId?.toString()
  );

  const displayedOrders =
    activeTab === "buying"
      ? buyingOrders
      : sellingOrders;

  // ==============================
  // SELECT PAYMENT METHOD
  // ==============================

  const handlePaymentMethod = async (
    orderId,
    method
  ) => {
    setActionLoading(orderId);

    try {
      await selectPaymentMethod(
        orderId,
        method
      );

      await loadOrders();
    } catch (err) {
      console.error(
        "Payment method error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to select payment method"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==============================
  // SELLER MARKS HANDED OVER
  // ==============================

  const handleHandover = async (
    orderId
  ) => {
    setActionLoading(orderId);

    try {
      await markOrderHandedOver(
        orderId
      );

      await loadOrders();
    } catch (err) {
      console.error(
        "Handover error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to mark order as handed over"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==============================
  // BUYER CONFIRMS RECEIPT
  // ==============================

  const handleConfirmReceived = async (
    orderId
  ) => {
    setActionLoading(orderId);

    try {
      await confirmOrderReceived(
        orderId
      );

      await loadOrders();
    } catch (err) {
      console.error(
        "Receipt confirmation error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to confirm receipt"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-slate-600 font-medium">
            Loading orders...
          </p>

        </div>

      </div>
    );
  }

  // ==============================
  // ERROR
  // ==============================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">

        <div className="max-w-5xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-center">

          <p className="text-red-600 font-medium">
            {error}
          </p>

          <button
            onClick={loadOrders}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // ==============================
  // PAGE
  // ==============================

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">

      <div className="max-w-5xl mx-auto">

        {/* ==============================
            PAGE HEADER
        ============================== */}

        <div className="mb-6">

          <h1 className="text-3xl font-bold text-slate-900">
            Orders & Handover
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Manage your purchases and items you have sold.
          </p>

        </div>


        {/* ==============================
            BUYING / SELLING TABS
        ============================== */}

        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 mb-6 shadow-sm">

          <div className="grid grid-cols-2 gap-1">

            {/* BUYING TAB */}

            <button
              onClick={() =>
                setActiveTab("buying")
              }
              className={`py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === "buying"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              🛒 Buying

              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "buying"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {buyingOrders.length}
              </span>

            </button>


            {/* SELLING TAB */}

            <button
              onClick={() =>
                setActiveTab("selling")
              }
              className={`py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === "selling"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              📦 Selling

              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "selling"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {sellingOrders.length}
              </span>

            </button>

          </div>

        </div>


        {/* ==============================
            SECTION DESCRIPTION
        ============================== */}

        <div className="mb-5">

          {activeTab === "buying" ? (

            <div>

              <h2 className="text-lg font-bold text-slate-800">
                Items You're Buying
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Track payment, pickup and received status
                for your purchases.
              </p>

            </div>

          ) : (

            <div>

              <h2 className="text-lg font-bold text-slate-800">
                Items You're Selling
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Manage handover and completed sales.
              </p>

            </div>

          )}

        </div>


        {/* ==============================
            EMPTY STATE
        ============================== */}

        {displayedOrders.length === 0 ? (

          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">

            <div className="text-4xl mb-4">
              {activeTab === "buying"
                ? "🛒"
                : "📦"}
            </div>

            <h3 className="font-bold text-lg text-slate-800">

              {activeTab === "buying"
                ? "No purchases yet"
                : "No sales yet"}

            </h3>

            <p className="text-sm text-slate-500 mt-2">

              {activeTab === "buying"
                ? "Items you purchase will appear here."
                : "Items sold by you will appear here."}

            </p>

          </div>

        ) : (

          /* ==============================
             ORDERS
          ============================== */

          <div className="space-y-5">

            {displayedOrders.map((order) => {

              const isBuyer =
                order.buyer?._id
                  ?.toString() ===
                currentUserId?.toString();

              const isSeller =
                order.seller?._id
                  ?.toString() ===
                currentUserId?.toString();

              const isLoading =
                actionLoading === order._id;

              return (

                <div
                  key={order._id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >

                  {/* ==============================
                      PRODUCT HEADER
                  ============================== */}

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <h2 className="font-bold text-lg text-slate-800">
                        {order.product?.title ||
                          "Product"}
                      </h2>

                      <p className="text-xl font-extrabold text-indigo-600 mt-1">
                        ₹{order.amount}
                      </p>

                    </div>


                    {/* ROLE BADGE */}

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        activeTab === "buying"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {activeTab === "buying"
                        ? "Buying"
                        : "Selling"}
                    </span>

                  </div>


                  {/* ==============================
                      PERSON
                  ============================== */}

                  <div className="mt-4 p-3 rounded-xl bg-slate-50">

                    {activeTab === "buying" ? (

                      <p className="text-sm text-slate-600">

                        <strong className="text-slate-800">
                          Seller:
                        </strong>{" "}

                        {order.seller?.name ||
                          "Unknown"}

                      </p>

                    ) : (

                      <p className="text-sm text-slate-600">

                        <strong className="text-slate-800">
                          Buyer:
                        </strong>{" "}

                        {order.buyer?.name ||
                          "Unknown"}

                      </p>

                    )}

                  </div>


                  {/* ==============================
                      STATUS
                  ============================== */}

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">

                    <div className="bg-slate-50 rounded-xl p-3">

                      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                        Order Status
                      </p>

                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {order.orderStatus}
                      </p>

                    </div>


                    <div className="bg-slate-50 rounded-xl p-3">

                      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                        Payment Status
                      </p>

                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {order.paymentStatus}
                      </p>

                    </div>


                    <div className="bg-slate-50 rounded-xl p-3">

                      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                        Payment Method
                      </p>

                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {order.paymentMethod ||
                          "Not selected"}
                      </p>

                    </div>

                  </div>


                  {/* ==============================
                      BUYER: CHOOSE PAYMENT
                  ============================== */}

                  {isBuyer &&
                    order.orderStatus ===
                      "AwaitingPaymentMethod" && (

                    <div className="mt-5 p-4 rounded-xl bg-indigo-50 border border-indigo-100">

                      <p className="font-bold text-indigo-800 mb-3">
                        Choose Payment Method
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3">

                        {/* CASH ON PICKUP */}

                        <button
                          onClick={() =>
                            handlePaymentMethod(
                              order._id,
                              "CashOnPickup"
                            )
                          }
                          disabled={isLoading}
                          className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm disabled:opacity-50"
                        >
                          {isLoading
                            ? "Processing..."
                            : "💵 Cash on Pickup"}
                        </button>

                      </div>

                    </div>
                  )}


                  {/* ==============================
                      CASH PAYMENT INFORMATION
                  ============================== */}

                  {isBuyer &&
                    order.paymentMethod ===
                      "CashOnPickup" &&
                    order.orderStatus ===
                      "ReadyForPickup" && (

                    <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200">

                      <p className="text-sm font-bold text-amber-800">
                        💵 Cash on Pickup
                      </p>

                      <p className="text-xs text-amber-700 mt-1">
                        Meet the seller and pay ₹
                        {order.amount} in cash.
                      </p>

                    </div>
                  )}


                  {/* ==============================
                      SELLER: MARK HANDED OVER
                  ============================== */}

                  {isSeller &&
                    order.orderStatus ===
                      "ReadyForPickup" && (

                    <div className="mt-5">

                      <button
                        onClick={() =>
                          handleHandover(
                            order._id
                          )
                        }
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                      >
                        {isLoading
                          ? "Processing..."
                          : "✓ Mark Handed Over"}
                      </button>

                    </div>
                  )}


                  {/* ==============================
                      BUYER: CONFIRM RECEIVED
                  ============================== */}

                  {isBuyer &&
                    order.orderStatus ===
                      "HandedOver" && (

                    <div className="mt-5">

                      <button
                        onClick={() =>
                          handleConfirmReceived(
                            order._id
                          )
                        }
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                      >
                        {isLoading
                          ? "Processing..."
                          : "✓ Confirm Item Received"}
                      </button>

                    </div>
                  )}


                  {/* ==============================
                      COMPLETED
                  ============================== */}

                  {order.orderStatus ===
                    "Completed" && (

                    <div className="mt-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold text-center">

                      <div className="text-lg">
                        ✓ Order Completed
                      </div>

                      <p className="text-xs mt-1">
                        {activeTab === "buying"
                          ? "You have received this item."
                          : "This item has been successfully sold."}
                      </p>

                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
};

export default Orders;