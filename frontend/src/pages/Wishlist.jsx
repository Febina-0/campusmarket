import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

import {
  getWishlist,
  removeFromWishlist,
} from '../api/wishlist';

const Wishlist = () => {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getWishlist();

      // Handles either an array or { wishlist: [...] }
      setWishlist(
        Array.isArray(data)
          ? data
          : data.wishlist || data.products || []
      );
    } catch (err) {
      console.error('Wishlist error:', err);
      setError(
        err.response?.data?.message ||
        'Failed to load wishlist'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      setRemoving(productId);

      await removeFromWishlist(productId);

      setWishlist((prev) =>
        prev.filter((item) => {
          const product = item.product || item;
          return product._id !== productId;
        })
      );
    } catch (err) {
      console.error('Remove wishlist error:', err);
      alert(
        err.response?.data?.message ||
        'Failed to remove item'
      );
    } finally {
      setRemoving(null);
    }
  };

  const getProduct = (item) => item.product || item;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-slate-500">
            Loading wishlist...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center">
                <Heart className="w-5 h-5 fill-current" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  My Wishlist
                </h1>

                <p className="text-sm text-slate-500 mt-0.5">
                  {wishlist.length} saved item
                  {wishlist.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore Items
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-600">
            {error}
          </div>
        )}

        {/* Empty Wishlist */}
        {wishlist.length === 0 && !error ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-rose-400 flex items-center justify-center">
              <Heart className="w-8 h-8" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-800">
              Your wishlist is empty
            </h2>

            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Save items you're interested in and come back to them later.
            </p>

            <button
              onClick={() => navigate('/')}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              <ShoppingBag className="w-4 h-4" />
              Explore Items
            </button>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {wishlist.map((item) => {
              const product = getProduct(item);

              if (!product) return null;

              const image = product.images?.[0]?.url;

              return (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div
                    onClick={() =>
                      navigate(`/products/${product._id}`)
                    }
                    className="relative aspect-[4/3] bg-slate-100 cursor-pointer overflow-hidden"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={product.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-10 h-10" />
                      </div>
                    )}

                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg bg-white/90 text-xs font-semibold text-indigo-600 shadow-sm">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          onClick={() =>
                            navigate(`/products/${product._id}`)
                          }
                          className="font-bold text-slate-800 cursor-pointer hover:text-indigo-600 line-clamp-1"
                        >
                          {product.title}
                        </h3>

                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      <span className="flex-shrink-0 font-extrabold text-slate-900">
                        ₹{product.price}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() =>
                          navigate(`/products/${product._id}`)
                        }
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                      >
                        View Item
                      </button>

                      <button
                        onClick={() =>
                          handleRemove(product._id)
                        }
                        disabled={removing === product._id}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;