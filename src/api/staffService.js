import api from "./axiosInstance";

export const staffService = {
  // List (Corrected to /admin/staff)
  list: async (page = 1, limit = 10, search = "") => {
    try {
      // Backend controller is mounted at /admin/staff
      const response = await api.get("/admin/staff", {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error) {
      console.error("[StaffService] List error:", error);
      throw error;
    }
  },

  // Create
  create: async (data) => {
    try {
      const response = await api.post("/admin/staff", data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Create error:", error);
      throw error;
    }
  },

  // Update
  update: async (id, data) => {
    try {
      const response = await api.put(`/admin/staff/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Update error:", error);
      throw error;
    }
  },

  // Delete
  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/staff/${id}`);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Delete error:", error);
      throw error;
    }
  },
};
