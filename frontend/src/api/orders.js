import api from './axios';

export const getMyOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const selectPaymentMethod = async (orderId, paymentMethod) => {
  const response = await api.patch(`/orders/${orderId}/payment-method`, {
    paymentMethod,
  });
  return response.data;
};

export const confirmUPIPayment = async (orderId, paymentTransactionId) => {
  const response = await api.patch(`/orders/${orderId}/confirm-upi`, {
    paymentTransactionId,
  });
  return response.data;
};

export const markOrderHandedOver = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/handover`);
  return response.data;
};

export const confirmOrderReceived = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/confirm-receipt`);
  return response.data;
};
