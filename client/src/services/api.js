import axios from 'axios';
const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
});
// --- Auth ---
export const login = (username, password) => api.post('/auth/login', { username, password });
export const registerParent = (data) => api.post('/auth/register/parent', data);
export const registerChild = (data) => api.post('/auth/register/child', data);
export const logout = () => api.post('/auth/logout');
// --- User ---
export const getMe = () => api.get('/user/me');
export const getFamilyChildren = (familyId) => api.get(`/user/family/${familyId}/children`);
export const getFamilyParents = (familyId) => api.get(`/user/family/${familyId}/parents`);
export const confirmChild = (id) => api.patch(`/user/${id}/confirm`);
export const promoteToParent = (id) => api.patch(`/user/${id}/promote`);
export const deleteUser = (id) => api.delete(`/user/${id}`);
// --- Family ---
export const getFamily = (id) => api.get(`/family/${id}`);
export const updateInterests = (id, data) => api.patch(`/family/${id}/interests`, data);
// --- Action ---
export const getActions = (userId) => api.get(`/action/${userId}`);
export const createAction = (data) => api.post('/action', data);
// --- Loan ---
export const getLoans = (userId) => api.get(`/loan/${userId}`);
export const createLoan = (data) => api.post('/loan', data);
export const repayLoans = (ids) => api.delete('/loan', { data: { ids } });
// --- Invest ---
export const getInvests = (userId) => api.get(`/invest/${userId}`);
export const createInvest = (data) => api.post('/invest', data);
export const withdrawInvests = (ids) => api.delete('/invest', { data: { ids } });
// --- Message ---
export const getInbox = (userId) => api.get(`/message/inbox/${userId}`);
export const getSent = (userId) => api.get(`/message/sent/${userId}`);
export const getConversation = (otherUserId) => api.get(`/message/conversation/${otherUserId}`);
export const getChildThread = (childId) => api.get(`/message/child-thread/${childId}`);
export const getUnreadCounts = () => api.get('/message/unread-counts');
export const sendMessage = (data) => api.post('/message', data);
export const markRead = (ids) => api.patch('/message/read', { ids });
