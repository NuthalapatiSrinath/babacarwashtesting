import api from "./axiosInstance";

export const authService = {
  // Login Function
  login: async (number, password) => {
    try {
      // POST request to /auth/signin
      const response = await api.post("/auth/signin", {
        number, // API expects "number"
        password, // API expects "password"
      });
      return response.data; // Returns the full object { statusCode, message, data: {...} }
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Future: You can add logout or register here
};
