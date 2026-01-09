import api from "./axiosInstance";

export const customerService = {
  // List
  list: async (page = 1, limit = 10, search = "", status = 1) => {
    console.log("📞 [CUSTOMER SERVICE] API Call:", {
      page,
      limit,
      search,
      status,
    });
    const params = {
      pageNo: page - 1,
      pageSize: limit,
      search,
      status, // 1 = Active, 2 = Inactive
    };
    console.log("📦 [CUSTOMER SERVICE] Request params:", params);
    const response = await api.get("/customers", { params });
    console.log("✅ [CUSTOMER SERVICE] Response:", response.data);
    return response.data;
  },

  // Create
  create: async (data) => {
    const response = await api.post("/customers", data);
    return response.data;
  },

  // Update
  update: async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  // Delete Customer
  delete: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  // Toggle Vehicle Status
  toggleVehicle: async (vehicleId, currentStatus, reason = "") => {
    // If active (1) -> deactivate. If inactive (2) -> activate.
    if (currentStatus === 1) {
      const payload = {
        deactivateReason: reason || "Stopped",
        deactivateDate: new Date().toISOString(),
      };
      const response = await api.put(
        `/customers/vehicle/${vehicleId}/deactivate`,
        payload
      );
      return response.data;
    } else {
      const payload = {
        start_date: new Date().toISOString(), // Or user provided date
      };
      const response = await api.put(
        `/customers/vehicle/${vehicleId}/activate`,
        payload
      );
      return response.data;
    }
  },

  // Archive Customer
  archive: async (id) => {
    const response = await api.put(`/customers/${id}/archive`, {});
    return response.data;
  },

  getHistory: async (
    id,
    page = 1,
    limit = 10,
    startDate = "",
    endDate = ""
  ) => {
    const params = {
      pageNo: page - 1,
      pageSize: limit,
      startDate,
      endDate,
    };
    const response = await api.get(`/customers/${id}/history`, { params });
    return response.data;
  },

  // Export History CSV
  exportHistory: async (id, startDate = "", endDate = "") => {
    const params = { startDate, endDate };
    const response = await api.get(`/customers/${id}/history/export/list`, {
      params,
      responseType: "blob", // Important for file download
    });
    return response.data;
  },

  exportData: async (status = 1) => {
    const response = await api.get("/customers/export/list", {
      params: { status },
      responseType: "blob",
    });

    // Create a download link in the browser
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `customers_export_${new Date().getTime()}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    return response.data;
  },
  // Remove the extra 'new FormData()' inside this function
  importData: async (formData) => {
    const response = await api.post("/customers/import/list", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
