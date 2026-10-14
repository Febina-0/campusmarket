import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProducts, deleteProduct } from "../api/products";
import { Edit, Package, Trash2 } from "lucide-react";

const MyListings = () => {
  const navigate = useNavigate();

  // ==============================
  // STATE
  // ==============================
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // ==============================
  // LOAD MY PRODUCTS
  // ==============================
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyProducts();

      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to load listings:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load your listings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ==============================
  // DELETE PRODUCT
  // ==============================
  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(productId);
      setMessage("");
      setError("");

      await deleteProduct(productId);

      // Remove deleted product from UI immediately
      setProducts((prevProducts) =>
        prevProducts.filter(
          (product) => product._id !== productId
        )
      );

      setMessage("Item deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to delete item."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==============================
  // LOADING
  // ==============================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">
          Loading your listings...
        </p>
      </div>
    );
  }

  // ==============================
  // ERROR
  // ==============================
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-500 mb-4">
            {error}
          </p>

          <button
            onClick={loadProducts}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ==============================
            HEADER
        ============================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              My Listings
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Manage the items you are selling
            </p>
          </div>

          <button
            onClick={() => navigate("/products/new")}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
          >
            + Sell New Item
          </button>

        </div>

        {/* ==============================
            SUCCESS / MESSAGE
        ============================== */}
        {message && (
          <div className="mb-6 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
            ✓ {message}
          </div>
        )}

        {/* ==============================
            NO LISTINGS
        ============================== */}
        {products.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">

            <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />

            <h2 className="text-lg font-semibold text-slate-700">
              No listings yet
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Start selling an item on CampusMarket.
            </p>

            <button
              onClick={() => navigate("/products/new")}
              className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm"
            >
              Sell Your First Item
            </button>

          </div>
        ) : (

          /* ==============================
             LISTINGS GRID
          ============================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {products.map((product) => (

              <div
                key={product._id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >

                {/* ==============================
                    IMAGE
                ============================== */}
                <div className="h-52 bg-slate-100">

                  {product.images?.length > 0 ? (
                    <img
                      src={
                        product.images[0]?.url ||
                        product.images[0]
                      }
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      No Image
                    </div>
                  )}

                </div>

                {/* ==============================
                    CONTENT
                ============================== */}
                <div className="p-4">

                  {/* TITLE + STATUS */}
                  <div className="flex items-start justify-between gap-2">

                    <h2 className="font-bold text-lg text-slate-800 line-clamp-1">
                      {product.title}
                    </h2>

                    <span
                      className={`flex-shrink-0 text-xs px-2 py-1 rounded-full font-semibold ${
                        product.status === "Sold"
                          ? "bg-slate-100 text-slate-500"
                          : product.status === "Reserved"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {product.status || "Available"}
                    </span>

                  </div>

                  {/* PRICE */}
                  <p className="text-lg font-bold text-indigo-600 mt-2">
                    ₹{product.price}
                  </p>

                  {/* CATEGORY + CONDITION */}
                  <div className="flex gap-2 mt-3 flex-wrap">

                    {product.category && (
                      <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md">
                        {product.category}
                      </span>
                    )}

                    {product.condition && (
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        {product.condition}
                      </span>
                    )}

                  </div>

                  {/* DESCRIPTION */}
                  <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                    {product.description ||
                      "No description provided."}
                  </p>

                  {/* ==============================
                      ACTIONS
                  ============================== */}
                  <div className="flex gap-2 mt-5">

                    {/* EDIT */}
                    <button
                      onClick={() =>
                        navigate(
                          `/products/${product._id}/edit`
                        )
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() =>
                        handleDelete(product._id)
                      }
                      disabled={
                        deletingId === product._id
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />

                      {deletingId === product._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>
    </div>
  );
};

export default MyListings;