import React, { useState } from 'react';
import {
  selectPaymentMethod as apiSelectPayment,
  confirmUPIPayment as apiConfirmUPI,
  markOrderHandedOver as apiMarkHandedOver,
  confirmOrderReceived as apiConfirmReceived,
} from '../../api/orders';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Banknote,
  Package,
  ArrowRight,
  ShieldCheck,
  User
} from 'lucide-react';

export const OrderCard = ({ order, currentUserId, onOrderUpdated }) => {
  const isBuyer = order.buyer?._id === currentUserId || order.buyer === currentUserId;
  const isSeller = order.seller?._id === currentUserId || order.seller === currentUserId;

  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [txnId, setTxnId] = useState('');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectPayment = async (method) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await apiSelectPayment(order._id, method);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUPI = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await apiConfirmUPI(order._id, txnId);
      setShowUpiModal(false);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to confirm UPI payment');
    } finally {
      setLoading(false);
    }
  };

  const handleHandover = async () => {
    if (!window.confirm('Confirm that you have handed the item over to the buyer?')) return;
    setLoading(true);
    try {
      await apiMarkHandedOver(order._id);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark handed over');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!window.confirm('Confirm that you have received and inspected this item?')) return;
    setLoading(true);
    try {
      await apiConfirmReceived(order._id);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-6 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs text-slate-400 font-medium">
            Order #{order._id.slice(-6).toUpperCase()}
          </span>
          <p className="text-xs text-slate-500 mt-0.5">
            Placed on {new Date(order.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Role pill */}
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
              isBuyer ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
            }`}
          >
            {isBuyer ? 'You are Buyer' : 'You are Seller'}
          </span>

          {/* Status pill */}
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
              order.orderStatus === 'Completed'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : order.orderStatus === 'Cancelled'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {order.orderStatus}
          </span>
        </div>
      </div>

      {/* Main product & details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 my-4">
        <div className="sm:col-span-2 flex items-start gap-4">
          <img
            src={order.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150'}
            alt={order.product?.title || 'Product'}
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-100 flex-shrink-0"
          />
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              {order.product?.title || 'Product item'}
            </h4>
            <div className="text-sm font-extrabold text-indigo-600 mt-0.5">
              ₹{order.amount}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {isBuyer ? `Seller: ${order.seller?.name || 'Student'}` : `Buyer: ${order.buyer?.name || 'Student'}`}
              </span>
              <span>•</span>
              <span>{isBuyer ? order.seller?.phone : order.buyer?.phone}</span>
            </div>
          </div>
        </div>

        {/* Payment & status info */}
        <div className="bg-slate-50 rounded-xl p-3.5 flex flex-col justify-center text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Method:</span>
            <span className="font-semibold text-slate-700">{order.paymentMethod || 'Pending selection'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment:</span>
            <span className="font-semibold text-slate-700">{order.paymentStatus}</span>
          </div>
          {order.paymentTransactionId && (
            <div className="flex justify-between">
              <span className="text-slate-500">Txn Ref:</span>
              <span className="font-mono text-indigo-600 truncate max-w-[100px]">{order.paymentTransactionId}</span>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 mb-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Action triggers depending on state & role */}
      <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
        {/* Buyer: Select Payment Method */}
        {isBuyer && order.orderStatus === 'AwaitingPaymentMethod' && (
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
            <span className="text-xs font-semibold text-amber-800">
              Select how you will pay the seller:
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={loading}
                onClick={() => handleSelectPayment('CashOnPickup')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash on Pickup
              </button>
              <button
                disabled={loading}
                onClick={() => handleSelectPayment('UPI')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                <CreditCard className="w-3.5 h-3.5" /> UPI Transfer
              </button>
            </div>
          </div>
        )}

        {/* Buyer: Enter UPI reference */}
        {isBuyer && order.orderStatus === 'AwaitingPayment' && order.paymentMethod === 'UPI' && (
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-50 p-3 rounded-xl border border-indigo-200">
            <span className="text-xs font-semibold text-indigo-900">
              Pay seller ₹{order.amount} and provide UPI Transaction ID:
            </span>
            <button
              onClick={() => setShowUpiModal(true)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Confirm UPI Payment
            </button>
          </div>
        )}

        {/* Seller: Mark Handed Over */}
        {isSeller && order.orderStatus === 'ReadyForPickup' && (
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-900">
              Item ready for handover. Meet buyer on campus:
            </span>
            <button
              disabled={loading}
              onClick={handleHandover}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              Mark as Handed Over
            </button>
          </div>
        )}

        {/* Buyer: Confirm Receipt */}
        {isBuyer && order.orderStatus === 'HandedOver' && (
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-purple-50 p-3 rounded-xl border border-purple-200">
            <span className="text-xs font-semibold text-purple-900">
              The seller handed over the product. Have you received it?
            </span>
            <button
              disabled={loading}
              onClick={handleConfirmReceived}
              className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
            >
              Confirm Item Received
            </button>
          </div>
        )}

        {order.orderStatus === 'Completed' && (
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Deal completed! Product marked as Sold.
          </div>
        )}
      </div>

      {/* Modal for UPI Txn */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">Confirm UPI Payment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your bank/UPI app transaction reference ID (optional but recommended):
            </p>
            <input
              type="text"
              placeholder="e.g. UPI/123456789012"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUpiModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleConfirmUPI}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                Submit Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard;
