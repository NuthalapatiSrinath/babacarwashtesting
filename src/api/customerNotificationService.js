import api from "./axiosInstance";

const customerNotificationService = {
  checkHealth: async () => {
    const response = await api.get("/customer-notifications/health");
    return response.data;
  },

  sendCampaign: async (payload) => {
    const response = await api.post("/customer-notifications/send", payload);
    return response.data;
  },
};

export default customerNotificationService;
