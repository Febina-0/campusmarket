import React, { useEffect, useState } from "react";
import {
  getMyReservations,
  getIncomingReservations,
  acceptReservation,
  rejectReservation,
  cancelReservation,
} from "../api/reservations";

import {
  Inbox,
  Send,
  Check,
  X,
  ShoppingBag,
  Clock,
} from "lucide-react";

const Reservations = () => {
  const [myReservations, setMyReservations] = useState([]);
  const [incomingReservations, setIncomingReservations] = useState([]);

  const [activeTab, setActiveTab] = useState("incoming");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ==========================================
  // LOAD RESERVATIONS
  // ==========================================

  const loadReservations = async () => {
    try {
      setLoading(true);

      const [myData, incomingData] = await Promise.all([
        getMyReservations(),
        getIncomingReservations(),
      ]);

      setMyReservations(myData.reservations || []);
      setIncomingReservations(
        incomingData.reservations || []
      );
    } catch (error) {
      console.error(
        "Failed to load reservations:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to load reservations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  // ==========================================
  // ACCEPT RESERVATION
  // ==========================================

  const handleAccept = async (id) => {
    try {
      setMessage("");

      const data = await acceptReservation(id);

      setMessage(
        data.message ||
          "Reservation accepted successfully"
      );

      await loadReservations();
    } catch (error) {
      console.error("Accept error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to accept reservation"
      );
    }
  };

  // ==========================================
  // REJECT RESERVATION
  // ==========================================

  const handleReject = async (id) => {
    try {
      setMessage("");

      const data = await rejectReservation(id);

      setMessage(
        data.message ||
          "Reservation rejected successfully"
      );

      await loadReservations();
    } catch (error) {
      console.error("Reject error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to reject reservation"
      );
    }
  };

  // ==========================================
  // CANCEL RESERVATION
  // ==========================================

  const handleCancel = async (id) => {
    try {
      setMessage("");

      const data = await cancelReservation(id);

      setMessage(
        data.message ||
          "Reservation cancelled successfully"
      );

      await loadReservations();
    } catch (error) {
      console.error("Cancel error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to cancel reservation"
      );
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">
          Loading reservations...
        </p>
      </div>
    );
  }

  // ==========================================
  // CURRENT TAB DATA
  // ==========================================

  const currentReservations =
    activeTab === "incoming"
      ? incomingReservations
      : myReservations;

  return (
    <div className="min-h-screen bg-slate-50 py-10">

      {/* ======================================
          MAIN CONTAINER
      ======================================= */}

      <div className="max-w-6xl mx-auto px-4">

        {/* ======================================
            PAGE HEADER
        ======================================= */}

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-slate-900">
            Reservations
          </h1>

          <p className="text-base text-slate-500 mt-2">
            Manage reservation requests for items you
            are buying or selling.
          </p>

        </div>


        {/* ======================================
            SUCCESS / ERROR MESSAGE
        ======================================= */}

        {message && (
          <div
            className="
              mb-6
              p-3
              rounded-xl
              bg-indigo-50
              border
              border-indigo-100
              text-indigo-700
              text-sm
              font-medium
            "
          >
            {message}
          </div>
        )}


        {/* ======================================
            TABS
        ======================================= */}

        <div
          className="
            bg-white
            rounded-2xl
            border
            border-slate-200
            p-2
            shadow-sm
            flex
            gap-2
            mb-8
          "
        >

          {/* INCOMING TAB */}

          <button
            onClick={() => {
              setActiveTab("incoming");
              setMessage("");
            }}
            className={`
              flex-1
              flex
              items-center
              justify-center
              gap-2
              py-3
              px-4
              rounded-xl
              font-semibold
              text-sm
              transition-all
              ${
                activeTab === "incoming"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }
            `}
          >

            <Inbox className="w-4 h-4" />

            Incoming Requests

            <span
              className={`
                px-2
                py-0.5
                rounded-full
                text-xs
                font-bold
                ${
                  activeTab === "incoming"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }
              `}
            >
              {incomingReservations.length}
            </span>

          </button>


          {/* OUTGOING TAB */}

          <button
            onClick={() => {
              setActiveTab("outgoing");
              setMessage("");
            }}
            className={`
              flex-1
              flex
              items-center
              justify-center
              gap-2
              py-3
              px-4
              rounded-xl
              font-semibold
              text-sm
              transition-all
              ${
                activeTab === "outgoing"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }
            `}
          >

            <Send className="w-4 h-4" />

            Outgoing Requests

            <span
              className={`
                px-2
                py-0.5
                rounded-full
                text-xs
                font-bold
                ${
                  activeTab === "outgoing"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }
              `}
            >
              {myReservations.length}
            </span>

          </button>

        </div>


        {/* ======================================
            SECTION HEADER
        ======================================= */}

        <div className="mb-5">

          <h2 className="text-xl font-bold text-slate-900">

            {activeTab === "incoming"
              ? "Incoming Reservation Requests"
              : "Outgoing Reservation Requests"}

          </h2>

          <p className="text-sm text-slate-500 mt-1">

            {activeTab === "incoming"
              ? "Review and manage requests from students who want to reserve your items."
              : "Track the reservation requests you have made for other students' items."}

          </p>

        </div>


        {/* ======================================
            RESERVATIONS CARD
        ======================================= */}

        <div
          className="
            bg-white
            rounded-2xl
            border
            border-slate-200
            shadow-sm
            overflow-hidden
          "
        >

          {currentReservations.length === 0 ? (

            /* ==================================
               EMPTY STATE
            =================================== */

            <div
              className="
                min-h-[360px]
                flex
                flex-col
                items-center
                justify-center
                text-center
                px-6
              "
            >

              <div
                className="
                  w-16
                  h-16
                  rounded-full
                  bg-indigo-50
                  text-indigo-500
                  flex
                  items-center
                  justify-center
                  mb-5
                "
              >

                {activeTab === "incoming" ? (
                  <Inbox className="w-8 h-8" />
                ) : (
                  <Send className="w-8 h-8" />
                )}

              </div>


              <h3
                className="
                  text-xl
                  font-bold
                  text-slate-900
                "
              >

                {activeTab === "incoming"
                  ? "No incoming requests"
                  : "No outgoing requests"}

              </h3>


              <p
                className="
                  text-sm
                  text-slate-500
                  mt-2
                  max-w-md
                "
              >

                {activeTab === "incoming"
                  ? "Reservation requests from buyers will appear here."
                  : "Items you request to reserve will appear here."}

              </p>

            </div>

          ) : (

            /* ==================================
               RESERVATION LIST
            =================================== */

            <div className="divide-y divide-slate-100">

              {currentReservations.map(
                (reservation) => (

                  <div
                    key={reservation._id}
                    className="
                      p-6
                      hover:bg-slate-50/70
                      transition-colors
                    "
                  >

                    <div
                      className="
                        flex
                        flex-col
                        lg:flex-row
                        lg:items-center
                        lg:justify-between
                        gap-5
                      "
                    >

                      {/* ==========================
                          PRODUCT INFORMATION
                      =========================== */}

                      <div className="flex-1">

                        <div className="flex items-start gap-4">

                          {/* Product Icon */}

                          <div
                            className="
                              w-12
                              h-12
                              rounded-xl
                              bg-indigo-50
                              text-indigo-600
                              flex
                              items-center
                              justify-center
                              flex-shrink-0
                            "
                          >
                            <ShoppingBag className="w-5 h-5" />
                          </div>


                          {/* Product Details */}

                          <div className="min-w-0">

                            <h3
                              className="
                                text-base
                                font-bold
                                text-slate-900
                              "
                            >
                              {reservation.product?.title ||
                                "Product"}
                            </h3>


                            <p
                              className="
                                text-lg
                                font-bold
                                text-indigo-600
                                mt-1
                              "
                            >
                              ₹
                              {reservation.product?.price ||
                                0}
                            </p>


                            {/* Incoming */}

                            {activeTab === "incoming" ? (

                              <div className="mt-3 space-y-1">

                                <p className="text-sm text-slate-500">
                                  Buyer:{" "}
                                  <span className="font-semibold text-slate-700">
                                    {reservation.buyer?.name ||
                                      "Unknown"}
                                  </span>
                                </p>

                                <p className="text-sm text-slate-500">
                                  Email:{" "}
                                  {reservation.buyer?.email ||
                                    "Not available"}
                                </p>

                              </div>

                            ) : (

                              /* Outgoing */

                              <div className="mt-3 space-y-1">

                                <p className="text-sm text-slate-500">
                                  Seller:{" "}
                                  <span className="font-semibold text-slate-700">
                                    {reservation.seller?.name ||
                                      "Unknown"}
                                  </span>
                                </p>

                                <p className="text-sm text-slate-500">
                                  Email:{" "}
                                  {reservation.seller?.email ||
                                    "Not available"}
                                </p>

                              </div>

                            )}

                          </div>

                        </div>

                      </div>


                      {/* ==========================
                          STATUS + ACTIONS
                      =========================== */}

                      <div
                        className="
                          flex
                          flex-col
                          items-start
                          lg:items-end
                          gap-3
                          lg:min-w-[220px]
                        "
                      >

                        {/* STATUS */}

                        <div className="flex items-center gap-2">

                          <span
                            className="
                              text-xs
                              font-semibold
                              text-slate-500
                            "
                          >
                            Status
                          </span>

                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-1.5
                              px-3
                              py-1.5
                              rounded-full
                              text-xs
                              font-bold
                              ${
                                reservation.status ===
                                "Accepted"
                                  ? "bg-green-50 text-green-700"
                                  : reservation.status ===
                                    "Rejected"
                                  ? "bg-red-50 text-red-700"
                                  : reservation.status ===
                                    "Cancelled"
                                  ? "bg-slate-100 text-slate-600"
                                  : reservation.status ===
                                    "Expired"
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-amber-50 text-amber-700"
                              }
                            `}
                          >

                            {reservation.status ===
                              "Accepted" && (
                              <Check className="w-3.5 h-3.5" />
                            )}

                            {reservation.status ===
                              "Rejected" && (
                              <X className="w-3.5 h-3.5" />
                            )}

                            {reservation.status ===
                              "PendingSeller" && (
                              <Clock className="w-3.5 h-3.5" />
                            )}

                            {reservation.status}

                          </span>

                        </div>


                        {/* SELLER ACTIONS */}

                        {activeTab === "incoming" &&
                          reservation.status ===
                            "PendingSeller" && (

                            <div className="flex gap-2">

                              <button
                                onClick={() =>
                                  handleAccept(
                                    reservation._id
                                  )
                                }
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  px-4
                                  py-2
                                  bg-green-600
                                  hover:bg-green-700
                                  text-white
                                  rounded-lg
                                  text-sm
                                  font-semibold
                                  transition-colors
                                "
                              >
                                <Check className="w-4 h-4" />
                                Accept
                              </button>


                              <button
                                onClick={() =>
                                  handleReject(
                                    reservation._id
                                  )
                                }
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  px-4
                                  py-2
                                  bg-red-500
                                  hover:bg-red-600
                                  text-white
                                  rounded-lg
                                  text-sm
                                  font-semibold
                                  transition-colors
                                "
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </button>

                            </div>

                          )}


                        {/* BUYER CANCEL */}

                        {activeTab === "outgoing" &&
                          reservation.status ===
                            "PendingSeller" && (

                            <button
                              onClick={() =>
                                handleCancel(
                                  reservation._id
                                )
                              }
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                px-4
                                py-2
                                bg-slate-100
                                hover:bg-slate-200
                                text-slate-700
                                rounded-lg
                                text-sm
                                font-semibold
                                transition-colors
                              "
                            >
                              <X className="w-4 h-4" />
                              Cancel Request
                            </button>

                          )}

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>
    </div>
  );
};

export default Reservations;