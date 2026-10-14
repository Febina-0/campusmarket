import api from './axios';

export const startConversation = async (productId) => {
  const response = await api.post(`/conversations/${productId}`);
  return response.data;
};

export const getMyConversations = async () => {
  const response = await api.get('/conversations');
  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await api.get(`/messages/${conversationId}`);
  return response.data;
};

export const sendMessage = async (conversationId, text) => {
  const response = await api.post(`/messages/${conversationId}`, { text });
  return response.data;
};

export const markMessagesAsRead = async (conversationId) => {
  const response = await api.patch(`/messages/${conversationId}/read`);
  return response.data;
};
