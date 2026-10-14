import api from './axios';

export const createReservation = async (productId) => {
  const response = await api.post(`/reservations/${productId}`);
  return response.data;
};

export const getMyReservations = async () => {
  const response = await api.get('/reservations/my');
  return response.data;
};

export const getIncomingReservations = async () => {
  const response = await api.get('/reservations/incoming');
  return response.data;
};

export const acceptReservation = async (id) => {
  const response = await api.patch(`/reservations/${id}/accept`);
  return response.data;
};

export const rejectReservation = async (id) => {
  const response = await api.patch(`/reservations/${id}/reject`);
  return response.data;
};

export const cancelReservation = async (id) => {
  const response = await api.patch(`/reservations/${id}/cancel`);
  return response.data;
};
