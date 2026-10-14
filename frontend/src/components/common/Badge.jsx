import React from 'react';

export const StatusBadge = ({ status }) => {
  const styles = {
    Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Reserved: 'bg-amber-50 text-amber-700 border-amber-200',
    Sold: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const defaultStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[status] || defaultStyle
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === 'Available'
            ? 'bg-emerald-500'
            : status === 'Reserved'
            ? 'bg-amber-500 animate-pulse'
            : 'bg-slate-400'
        }`}
      />
      {status}
    </span>
  );
};

export const ConditionBadge = ({ condition }) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
      {condition}
    </span>
  );
};

export default StatusBadge;
