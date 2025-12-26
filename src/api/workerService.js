import api from "./axiosInstance";

export const workerService = {
  // List
  list: async (page = 1, limit = 10, search = "", status = 1) => {
    try {
      // Backend expects 'pageNo' (starts at 0) and 'pageSize'
      const params = {
        pageNo: page - 1, // Convert 1-based UI page to 0-based backend page
        pageSize: limit,
        search,
        status,
      };

      const response = await api.get("/workers", { params });
      return response.data;
    } catch (error) {
      console.error("[WorkerService] List error:", error);
      throw error;
    }
  },

  // Create
  create: async (data) => {
    try {
      const response = await api.post("/workers", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update
  update: async (id, data) => {
    try {
      const response = await api.put(`/workers/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete
  delete: async (id) => {
    try {
      const response = await api.delete(`/workers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Deactivate
  deactivate: async (id, payload) => {
    try {
      const response = await api.put(`/workers/${id}/deactivate`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
