import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  User,
  Tag,
  ShieldCheck,
  Phone,
  Mail,
  Eye,
  EyeOff,
  MessageSquare,
} from "lucide-react";
import { getProductById } from "../api/products";
import { createReservation } from "../api/reservations";
import { useAuth } from "../context/AuthContext";
import { startConversation } from "../api/conversations";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showContact, setShowContact] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  // ==============================
  // LOAD PRODUCT
  // ==============================

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProductById(id);

        setProduct(data.product || data);
      } catch (err) {
        console.error("Failed to load product:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load product"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // ==============================
  // REQUEST / BUY
  // ==============================

  const handleRequest = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setRequestLoading(true);
      setRequestMessage("");

      const data = await createReservation(product._id);

      setRequestMessage(
        data.message ||
          "Purchase request sent successfully"
      );
    } catch (err) {
      console.error("Request error:", err);

      setRequestMessage(
        err.response?.data?.message ||
          "Failed to send request"
      );
    } finally {
      setRequestLoading(false);
    }
  };
  const handleChat = async () => {

  if (!isAuthenticated) {
    navigate("/login");
    return;
  }

  try {

    setRequestMessage("");

    const data = await startConversation(
      product._id
    );

    const conversation =
      data.conversation;

    if (!conversation?._id) {
      throw new Error(
        "Conversation ID was not returned"
      );
    }

    navigate(
      `/messages?conversation=${conversation._id}`
    );

  } catch (err) {

    console.error(
      "Failed to start conversation:",
      err
    );

    setRequestMessage(
      err.response?.data?.message ||
      "Failed to start conversation"
    );

  }

};
  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">
          Loading product...
        </div>
      </div>
    );
  }

  // ==============================
  // ERROR
  // ==============================

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <p className="text-red-500 mb-4">
          {error || "Product not found"}
        </p>

        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ==============================
  // PRODUCT DATA
  // ==============================

  const image =
    product.images?.[0]?.url ||
    product.images?.[0] ||
    "/placeholder.jpg";

  const sellerName =
    product.seller?.name ||
    product.user?.name ||
    "Unknown Seller";

  const sellerPhone =
    product.seller?.phone ||
    product.user?.phone ||
    "";

  const sellerEmail =
    product.seller?.email ||
    product.user?.email ||
    "";

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ==============================
            BACK BUTTON
        ============================== */}

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* ==============================
            PRODUCT CARD
        ============================== */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* =========================
                IMAGE
            ========================= */}

            <div className="bg-slate-100 min-h-[400px] flex items-center justify-center p-6">

              <img
                src={image}
                alt={product.title}
                className="max-h-[500px] w-full object-contain rounded-2xl"
              />

            </div>

            {/* =========================
                DETAILS
            ========================= */}

            <div className="p-6 sm:p-8">

              {/* STATUS + WISHLIST */}

              <div className="flex items-center justify-between mb-4">

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.status === "Available"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {product.status || "Available"}
                </span>

                <button
                  className="p-2.5 rounded-full border border-slate-200 hover:bg-rose-50 hover:text-rose-500 transition"
                  title="Add to wishlist"
                >
                  <Heart className="w-5 h-5" />
                </button>

              </div>

              {/* =========================
                  TITLE
              ========================= */}

              <h1 className="text-3xl font-bold text-slate-900">
                {product.title}
              </h1>

              {/* =========================
                  PRICE
              ========================= */}

              <div className="mt-5">

                <span className="text-3xl font-bold text-indigo-600">
                  ₹{product.price}
                </span>

              </div>

              {/* =========================
                  CATEGORY + CONDITION
              ========================= */}

              <div className="flex flex-wrap gap-2 mt-5">

                {product.category && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                    <Tag className="w-4 h-4" />
                    {product.category}
                  </span>
                )}

                {product.condition && (
                  <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                    {product.condition}
                  </span>
                )}

              </div>

              {/* DIVIDER */}

              <div className="border-t border-slate-200 my-6" />

              {/* =========================
                  DESCRIPTION
              ========================= */}

              <div>

                <h2 className="text-lg font-bold text-slate-800 mb-3">
                  Description
                </h2>

                <div className="bg-slate-50 rounded-2xl p-4 max-h-64 overflow-y-auto">

                  <p className="text-slate-600 leading-7 whitespace-pre-wrap">
                    {product.description ||
                      "No description provided."}
                  </p>

                </div>

              </div>

              {/* =========================
                  SELLER
              ========================= */}

              <div className="border-t border-slate-200 mt-6 pt-6">

                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  Seller
                </h2>

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>

                  <div>

                    <p className="font-semibold text-slate-800">
                      {sellerName}
                    </p>

                    <p className="text-sm text-slate-500">
                      Campus Marketplace Seller
                    </p>

                  </div>

                </div>

                {/* =========================
                    CONTACT BUTTON
                ========================= */}

                {product.status === "Available" && (
                  <div className="mt-4">

                    {!showContact ? (

                      <button
                        onClick={() =>
                          setShowContact(true)
                        }
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition"
                      >
                        <Eye className="w-4 h-4" />
                        View Contact Details
                      </button>

                    ) : (

                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">

                        <div className="flex items-center justify-between mb-3">

                          <h3 className="font-semibold text-indigo-900">
                            Seller Contact
                          </h3>

                          <button
                            onClick={() =>
                              setShowContact(false)
                            }
                            className="text-indigo-500 hover:text-indigo-700"
                            title="Hide contact details"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>

                        </div>

                        {/* PHONE */}

                        {sellerPhone ? (

                          <div className="flex items-center gap-3 mb-3">

                            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                              <Phone className="w-4 h-4 text-indigo-600" />
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">
                                Phone
                              </p>

                              <a
                                href={`tel:${sellerPhone}`}
                                className="text-sm font-semibold text-slate-800 hover:text-indigo-600"
                              >
                                {sellerPhone}
                              </a>
                            </div>

                          </div>

                        ) : null}

                        {/* EMAIL */}

                        {sellerEmail ? (

                          <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                              <Mail className="w-4 h-4 text-indigo-600" />
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">
                                Email
                              </p>

                              <a
                                href={`mailto:${sellerEmail}`}
                                className="text-sm font-semibold text-slate-800 hover:text-indigo-600 break-all"
                              >
                                {sellerEmail}
                              </a>
                            </div>

                          </div>

                        ) : null}

                        {/* NO CONTACT */}

                        {!sellerPhone &&
                          !sellerEmail && (
                            <p className="text-sm text-slate-500">
                              Seller contact details are not available.
                            </p>
                          )}

                      </div>

                    )}

                  </div>
                )}

              </div>
              {/* =========================
    CHAT WITH SELLER
========================= */}

{isAuthenticated &&
  product.seller?._id && (
    <div className="mt-6">

      <button
        onClick={handleChat}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition"
      >

        <MessageSquare className="w-5 h-5" />

        Chat with Seller

      </button>

    </div>
  )}

              {/* =========================
                  ACTION
              ========================= */}

              <div className="mt-7">

                {product.status === "Available" ? (

                  <button
                    onClick={handleRequest}
                    disabled={requestLoading}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >

                    {requestLoading
                      ? "Sending Request..."
                      : "Request Item"}

                  </button>

                ) : (

                  <div className="w-full py-3.5 rounded-xl bg-slate-200 text-slate-500 text-center font-semibold">
                    Item Not Available
                  </div>

                )}

                {/* REQUEST MESSAGE */}

                {requestMessage && (

                  <p className="text-sm text-center text-indigo-600 mt-3 font-medium">
                    {requestMessage}
                  </p>

                )}

              </div>

              {/* =========================
                  TRUST INFO
              ========================= */}

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">

                <ShieldCheck className="w-4 h-4" />

                Campus Marketplace protected listing

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductDetails;