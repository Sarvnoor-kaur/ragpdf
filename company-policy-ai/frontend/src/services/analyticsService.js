import api from './api';

// Get Overview Metrics
export const getOverviewMetrics = async (params = {}) => {
  return await api.get('/analytics/overview', { params });
};

// Get Query Trends
export const getQueryTrends = async (params = {}) => {
  return await api.get('/analytics/query-trends', { params });
};

// Get Documents by Department
export const getDocumentsByDepartment = async () => {
  return await api.get('/analytics/documents/by-department');
};

// Get Most Accessed Documents
export const getMostAccessedDocuments = async (params = {}) => {
  return await api.get('/analytics/documents/most-accessed', { params });
};

// Get Document Status Distribution
export const getDocumentStatusDistribution = async () => {
  return await api.get('/analytics/documents/status-distribution');
};

// Get Activity Heatmap
export const getActivityHeatmap = async (params = {}) => {
  return await api.get('/analytics/activity/heatmap', { params });
};

// Get Users by Department
export const getUsersByDepartment = async () => {
  return await api.get('/analytics/users/by-department');
};
