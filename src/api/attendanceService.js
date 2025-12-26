import api from "./axiosInstance";

export const attendanceService = {
  // Get List of All Workers & Staff
  // Backend returns: { statusCode: 200, data: [...] }
  getOrgList: async () => {
    try {
      const response = await api.get("/attendance/org/list");
      return response.data;
    } catch (error) {
      console.error("[Attendance] OrgList error:", error);
      return { data: [] };
    }
  },

  // List Attendance Records
  // Backend returns: { statusCode: 200, data: [...] }
  list: async (params) => {
    try {
      const response = await api.get("/attendance", { params });
      return response.data;
    } catch (error) {
      console.error("[Attendance] List error:", error);
      throw error;
    }
  },

  // Update Attendance
  update: async (payload) => {
    try {
      const response = await api.put("/attendance", payload);
      return response.data;
    } catch (error) {
      console.error("[Attendance] Update error:", error);
      throw error;
    }
  },

  // Export Data
  exportData: async (params) => {
    try {
      const response = await api.get("/attendance/export/list", {
        params,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("[Attendance] Export error:", error);
      throw error;
    }
  },
};
