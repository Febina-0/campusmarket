import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge, ConditionBadge } from '../common/Badge';
import {
  Heart,
  Image as ImageIcon,
  CalendarCheck,
} from 'lucide-react';

import {
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
} from '../../api/wishlist';

import { useAuth } from '../../context/AuthContext';
import { createReservation } from '../../api/reservations';

export const ProductCard = ({
  product,
  isWishlisted = false,
  onWishlistToggle,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveMessage, setReserveMessage] = useState('');

  const mainImage = product.images?.[0]?.url;

  // ==============================
  // RESERVE ITEM
  // ==============================
  const handleReserveClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setReserveLoading(true);
    setReserveMessage('');

    try {
      const data = await createReservation(product._id);

      setReserveMessage(
        data.message || 'Reservation request sent successfully'
      );
    } catch (err) {
      console.error('Reservation error:', err);

      setReserveMessage(
        err.response?.data?.message ||
          'Failed to send reservation request'
      );
    } finally {
      setReserveLoading(false);
    }
  };

  // ==============================
  // WISHLIST
  // ==============================
  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setWishlistLoading(true);

    try {
      if (wishlisted) {
        await apiRemoveFromWishlist(product._id);

        setWishlisted(false);

        if (onWishlistToggle) {
          onWishlistToggle(product._id, false);
        }
      } else {
        await apiAddToWishlist(product._id);

        setWishlisted(true);

        if (onWishlistToggle) {
          onWishlistToggle(product._id, true);
        }
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <Link
      to={`/products/${product._id}`}
      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col"
    >
      {/* ==============================
          IMAGE
      ============================== */}

      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">

        {mainImage ? (
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
            <ImageIcon className="w-10 h-10 stroke-1" />

            <span className="text-xs mt-1">
              No image
            </span>
          </div>
        )}

        {/* Status */}

        <div className="absolute top-3 left-3">
          <StatusBadge status={product.status} />
        </div>

        {/* Wishlist */}

        <button
          onClick={handleWishlistClick}
          disabled={wishlistLoading}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
            wishlisted
              ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
              : 'bg-white/80 text-slate-600 hover:bg-white hover:text-rose-500 shadow-sm'
          }`}
          title={
            wishlisted
              ? 'Remove from wishlist'
              : 'Add to wishlist'
          }
        >
          <Heart
            className={`w-4 h-4 ${
              wishlisted ? 'fill-white' : ''
            }`}
          />
        </button>

        {/* Price */}

        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md text-white font-extrabold text-sm shadow-sm">
            ₹{product.price}
          </span>
        </div>
      </div>

      {/* ==============================
          CONTENT
      ============================== */}

      <div className="p-4 flex-1 flex flex-col justify-between">

        <div>

          {/* Category + Condition */}

          <div className="flex items-center gap-2 mb-1.5">

            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {product.category}
            </span>

            <ConditionBadge
              condition={product.condition}
            />

          </div>

          {/* Title */}

          <h3 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {product.title}
          </h3>

          {/* Description */}

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* ==============================
              RESERVE BUTTON
          ============================== */}

          {product.status === 'Available' && (
            <div className="mt-4">

              <button
                onClick={handleReserveClick}
                disabled={reserveLoading}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CalendarCheck className="w-4 h-4" />

                {reserveLoading
                  ? 'Reserving...'
                  : 'Reserve Item'}
              </button>

            </div>
          )}

          {/* Reservation message */}

          {reserveMessage && (
            <p className="text-xs text-center text-indigo-600 mt-2 font-medium">
              {reserveMessage}
            </p>
          )}

        </div>

        {/* ==============================
            FOOTER
        ============================== */}

        <div className="border-t border-slate-100 mt-3 pt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-medium">

          <span>
            Seller:{' '}
            {product.seller?.name ||
              'Campus Student'}
          </span>

          <span>
            {new Date(
              product.createdAt
            ).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })}
          </span>

        </div>

      </div>
    </Link>
  );
};

export default ProductCard;