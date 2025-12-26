import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This matches your axios baseURL '/api'
      "/api": {
        target: "http://3.29.249.5:3000", // Your Backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
