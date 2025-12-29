import api from "./axiosInstance";

export const jobService = {
  // List Jobs with Filters
  list: async (page = 1, limit = 10, search = "", filters = {}) => {
    const params = {
      pageNo: page - 1,
      pageSize: limit,
      search,
      ...filters, // startDate, endDate, worker, status
    };
    const response = await api.get("/jobs", { params });
    return response.data;
  },

  // Create Job
  create: async (data) => {
    const response = await api.post("/jobs", data);
    return response.data;
  },

  // Update Job
  update: async (id, data) => {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data;
  },

  // Delete Job
  delete: async (id) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },

  // Export Data (Excel)
  exportData: async (filters = {}) => {
    const response = await api.get("/jobs/export/list", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  // Monthly Statement
  monthlyStatement: async (year, month) => {
    const response = await api.get("/jobs/export/statement/monthly", {
      params: { year, month },
      responseType: "blob",
    });
    return response.data;
  },
};
