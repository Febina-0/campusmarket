import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

export const CATEGORIES = [
  'All',
  'Books',
  'Electronics & Gadgets',
  'Stationery & Drafters',
  'Cycles & Accessories',
  'Hostel & Room Essentials',
  'Sports & Fitness',
  'Others',
];

export const CONDITIONS = [
  'All',
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor',
];

export const ProductFilters = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">

      {/* =========================
          Search Input
      ========================== */}
      <div className="relative w-full">
        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) =>
            onFilterChange('search', e.target.value)
          }
          placeholder="Search books, cycles, drafters, calculators..."
          className="
            w-full
            pl-10
            pr-4
            py-2.5
            bg-slate-50
            border
            border-slate-200
            rounded-xl
            text-sm
            text-slate-800
            placeholder-slate-400
            focus:outline-none
            focus:ring-2
            focus:ring-indigo-500
            focus:bg-white
            transition-all
            box-border
          "
        />
      </div>


      {/* =========================
          Category Pills
      ========================== */}
      <div className="w-full">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
          Category
        </label>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const isSelected =
              cat === 'All'
                ? !filters.category
                : filters.category === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  onFilterChange(
                    'category',
                    cat === 'All' ? '' : cat
                  )
                }
                className={`
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  rounded-lg
                  transition-all
                  whitespace-nowrap
                  ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>


      {/* =========================
          Condition & Price
      ========================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">

        {/* Condition */}
        <div className="w-full">
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Condition
          </label>

          <select
            value={filters.condition || 'All'}
            onChange={(e) =>
              onFilterChange(
                'condition',
                e.target.value === 'All'
                  ? ''
                  : e.target.value
              )
            }
            className="
              w-full
              px-3
              py-2
              bg-slate-50
              border
              border-slate-200
              rounded-xl
              text-xs
              text-slate-800
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
              box-border
            "
          >
            {CONDITIONS.map((condition) => (
              <option
                key={condition}
                value={condition}
              >
                {condition}
              </option>
            ))}
          </select>
        </div>


        {/* Max Price */}
        <div className="w-full">
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Max Price (₹)
          </label>

          <input
            type="number"
            min="0"
            value={filters.maxPrice || ''}
            onChange={(e) =>
              onFilterChange(
                'maxPrice',
                e.target.value
              )
            }
            placeholder="e.g. 5000"
            className="
              w-full
              px-3
              py-2
              bg-slate-50
              border
              border-slate-200
              rounded-xl
              text-xs
              text-slate-800
              placeholder-slate-400
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
              box-border
            "
          />
        </div>

      </div>


      {/* =========================
          Clear Filters
      ========================== */}
      {(filters.search ||
        filters.category ||
        filters.condition ||
        filters.minPrice ||
        filters.maxPrice) && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onReset}
            className="
              inline-flex
              items-center
              gap-1
              text-xs
              font-semibold
              text-rose-600
              hover:text-rose-700
              transition-colors
            "
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        </div>
      )}

    </div>
  );
};

export default ProductFilters;