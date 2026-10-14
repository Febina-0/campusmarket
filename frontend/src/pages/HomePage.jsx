import React, { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../api/products';
import { getWishlist } from '../api/wishlist';
import { ProductCard } from '../components/products/ProductCard';
import { ProductFilters } from '../components/products/ProductFilters';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    condition: '',
    // minPrice: '',
    maxPrice: '',
  });

  // =====================================
  // FETCH PRODUCTS
  // =====================================

  const fetchProductsList = useCallback(async () => {
    setLoading(true);

    try {
      const activeFilters = {};

      if (filters.search) {
        activeFilters.search = filters.search;
      }

      if (filters.category) {
        activeFilters.category = filters.category;
      }

      if (filters.condition) {
        activeFilters.condition = filters.condition;
      }

      // if (filters.minPrice) {
      //   activeFilters.minPrice = filters.minPrice;
      // }

      if (filters.maxPrice) {
        activeFilters.maxPrice = filters.maxPrice;
      }

      const data = await getProducts(activeFilters);

      setProducts(data.products || []);
    } catch (err) {
      console.error(
        'Failed to load products:',
        err
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // =====================================
  // LOAD PRODUCTS WHEN FILTERS CHANGE
  // =====================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductsList();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProductsList]);

  // =====================================
  // LOAD WISHLIST
  // =====================================

  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistIds(new Set());
      return;
    }

    getWishlist()
      .then((data) => {
        const ids = new Set(
          (data.wishlist || []).map(
            (p) => p._id || p
          )
        );

        setWishlistIds(ids);
      })
      .catch((err) => {
        console.error(
          'Failed to load wishlist:',
          err
        );
      });
  }, [isAuthenticated]);

  // =====================================
  // FILTER CHANGE
  // =====================================

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // =====================================
  // RESET FILTERS
  // =====================================

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: '',
      condition: '',
      // minPrice: '',
      maxPrice: '',
    });
  };

  // =====================================
  // WISHLIST TOGGLE
  // =====================================

  const handleWishlistToggle = (
    productId,
    isAdded
  ) => {
    setWishlistIds((prev) => {
      const updated = new Set(prev);

      if (isAdded) {
        updated.add(productId);
      } else {
        updated.delete(productId);
      }

      return updated;
    });
  };

  return (
    <div className="min-h-screen pb-20">

      {/* =====================================
          HERO BANNER
      ====================================== */}

      <div className="bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-950 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

        {/* Subtle decorative circles */}

        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />


        <div className="max-w-5xl mx-auto text-center relative z-10">

          {/* Badge */}

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-indigo-200 text-xs font-semibold mb-6">

            <Sparkles className="w-4 h-4 text-indigo-300" />

            Tailored for College Life

          </div>


          {/* Heading */}

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight sm:leading-tight">
            Buy, Sell & Reserve Directly on Your Campus
          </h1>


          {/* Description */}

          <p className="mt-4 text-sm sm:text-base text-indigo-200 max-w-2xl mx-auto leading-relaxed">
            Get affordable textbooks, cycles, lab stationery, and gadgets from fellow college mates with zero middlemen and campus-only handover.
          </p>


          {/* Hero Buttons */}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">

            <Link
              to="/products/new"
              className="px-6 py-3 rounded-xl bg-white text-indigo-900 font-bold text-sm shadow-xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Post a Free Ad
            </Link>


            <a
              href="#listings"
              className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm border border-white/20 hover:bg-white/15 transition-all flex items-center gap-1.5"
            >
              Browse Listings
              <ArrowRight className="w-4 h-4" />
            </a>

          </div>

        </div>

      </div>


      {/* =====================================
          MAIN CONTENT AREA
      ====================================== */}

      {/* FIXED: -mt-6 → mt-6 */}

      <div
        id="listings"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6"
      >

        <div className="space-y-6">

          {/* =====================================
              FILTERS BAR
          ====================================== */}

          <ProductFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />


          {/* =====================================
              RESULTS COUNT & STATUS
          ====================================== */}

          <div className="flex items-center justify-between px-1">

            <h2 className="text-base font-bold text-slate-800">

              {filters.category
                ? filters.category
                : 'All Campus Items'}

              {' '}

              <span className="text-xs font-semibold text-slate-400 font-normal">

                ({products.length}{' '}

                {products.length === 1
                  ? 'item'
                  : 'items'}{' '}

                found)

              </span>

            </h2>

          </div>


          {/* =====================================
              PRODUCTS
          ====================================== */}

          {loading ? (

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

              {[...Array(8)].map((_, i) => (

                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-3"
                >

                  <div className="aspect-[4/3] bg-slate-200 rounded-xl" />

                  <div className="h-4 bg-slate-200 rounded w-3/4" />

                  <div className="h-3 bg-slate-200 rounded w-1/2" />

                  <div className="h-4 bg-slate-200 rounded w-1/4 mt-4" />

                </div>

              ))}

            </div>

          ) : products.length === 0 ? (

            /* =====================================
                NO PRODUCTS
            ====================================== */

            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">

              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">

                <ShoppingBag className="w-6 h-6" />

              </div>

              <h3 className="text-base font-bold text-slate-800">
                No products found
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search keywords or clear the category and price filters.
              </p>

              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                Clear all filters
              </button>

            </div>

          ) : (

            /* =====================================
                PRODUCTS GRID
            ====================================== */

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

              {products.map((product) => (

                <ProductCard
                  key={product._id}
                  product={product}
                  isWishlisted={wishlistIds.has(
                    product._id
                  )}
                  onWishlistToggle={
                    handleWishlistToggle
                  }
                />

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
};

export default HomePage;