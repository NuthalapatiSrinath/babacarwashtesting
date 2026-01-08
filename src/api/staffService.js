import api from "./axiosInstance";

export const staffService = {
  // =========================
  // LIST STAFF
  // =========================
  list: async (page = 1, limit = 10, search = "") => {
    try {
      const response = await api.get("/admin/staff", {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error) {
      console.error("[StaffService] List error:", error);
      throw error;
    }
  },

  // =========================
  // CREATE STAFF
  // =========================
  create: async (data) => {
    try {
      const response = await api.post("/admin/staff", data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Create error:", error);
      throw error;
    }
  },

  // =========================
  // UPDATE STAFF
  // =========================
  update: async (id, data) => {
    try {
      const response = await api.put(`/admin/staff/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Update error:", error);
      throw error;
    }
  },

  // =========================
  // DELETE STAFF
  // =========================
  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/staff/${id}`);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Delete error:", error);
      throw error;
    }
  },

  // =========================
  // UPLOAD DOCUMENT (PDF)
  // ⚠️ DO NOT SET CONTENT-TYPE
  // =========================
  uploadDocument: async (id, file, documentType) => {
    try {
      const formData = new FormData();
      formData.append("file", file); // ✅ must be "file"
      formData.append("documentType", documentType);

      const response = await api.post(
        `/admin/staff/${id}/upload-document`,
        formData
        // ❌ DO NOT add headers here
        // Axios will automatically set multipart boundary
      );

      return response.data;
    } catch (error) {
      console.error("[StaffService] Upload Document error:", error);
      throw error;
    }
  },

  // =========================
  // DELETE DOCUMENT
  // =========================
  deleteDocument: async (id, documentType) => {
    try {
      const response = await api.delete(`/admin/staff/${id}/document`, {
        data: { documentType },
      });
      return response.data;
    } catch (error) {
      console.error("[StaffService] Delete Document error:", error);
      throw error;
    }
  },

  // =========================
  // GET DOCUMENT URL (VIEW)
  // =========================
  getDocumentUrl: (id, documentType) => {
    return `/admin/staff/${id}/document/${documentType}`;
  },

  // =========================
  // DOWNLOAD TEMPLATE
  // =========================
  downloadTemplate: async () => {
    try {
      const response = await api.get("/admin/staff/template", {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("[StaffService] Download Template error:", error);
      throw error;
    }
  },

  // =========================
  // EXPORT DATA (XLSX)
  // =========================
  exportData: async () => {
    try {
      const response = await api.get("/admin/staff/export", {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("[StaffService] Export Data error:", error);
      throw error;
    }
  },

  // =========================
  // IMPORT DATA (XLSX)
  // ⚠️ DO NOT SET CONTENT-TYPE
  // =========================
  importData: async (formData) => {
    try {
      const response = await api.post(
        "/admin/staff/import",
        formData
        // ❌ DO NOT add headers here
      );
      return response.data;
    } catch (error) {
      console.error("[StaffService] Import Data error:", error);
      throw error;
    }
  },

  // =========================
  // EXPIRING DOCUMENTS
  // =========================
  getExpiringDocuments: async () => {
    try {
      const response = await api.get("/admin/staff/expiring");
      return response.data;
    } catch (error) {
      console.error("[StaffService] Get Expiring Documents error:", error);
      throw error;
    }
  },
};
