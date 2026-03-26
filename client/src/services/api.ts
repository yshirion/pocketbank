import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// --- Auth ---
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password });

export const registerParent = (data: {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}) => api.post('/auth/register/parent', data);

export const registerChild = (data: {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  familyId: number;
}) => api.post('/auth/register/child', data);

export const logout = () => api.post('/auth/logout');

// --- User ---
export const getMe = () => api.get('/user/me');
export const getFamilyChildren = (familyId: number) =>
  api.get(`/user/family/${familyId}/children`);
export const getFamilyParents = (familyId: number) =>
  api.get(`/user/family/${familyId}/parents`);
export const promoteToParent = (id: number) => api.patch(`/user/${id}/promote`);
export const deleteUser = (id: number) => api.delete(`/user/${id}`);

// --- Family ---
export const getFamily = (id: number) => api.get(`/family/${id}`);
export const updateInterests = (
  id: number,
  data: { loanInterest: number; investLongInterest: number; investShortInterest: number }
) => api.patch(`/family/${id}/interests`, data);

// --- Action ---
export const getActions = (userId: number) => api.get(`/action/${userId}`);
export const createAction = (data: {
  userId: number;
  positive: boolean;
  type: string;
  amount: number;
}) => api.post('/action', data);

// --- Loan ---
export const getLoans = (userId: number) => api.get(`/loan/${userId}`);
export const createLoan = (data: { userId: number; amount: number }) =>
  api.post('/loan', data);
export const repayLoans = (ids: number[]) => api.delete('/loan', { data: { ids } });

// --- Invest ---
export const getInvests = (userId: number) => api.get(`/invest/${userId}`);
export const createInvest = (data: {
  userId: number;
  amount: number;
  longTerm: boolean;
}) => api.post('/invest', data);
export const withdrawInvests = (ids: number[]) =>
  api.delete('/invest', { data: { ids } });

// --- Message ---
export const getInbox = (userId: number) => api.get(`/message/inbox/${userId}`);
export const getSent = (userId: number) => api.get(`/message/sent/${userId}`);
export const getConversation = (otherUserId: number) => api.get(`/message/conversation/${otherUserId}`);
export const getUnreadCounts = () => api.get('/message/unread-counts');
export const sendMessage = (data: { receiverId: number; content: string }) =>
  api.post('/message', data);
export const markRead = (ids: number[]) => api.patch('/message/read', { ids });
