import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const getApiOrigin = (rawUrl) => {
  try {
    return new URL(rawUrl).origin;
  } catch {
    return "http://localhost:4000";
  }
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = (env.VITE_API_URL || "http://localhost:4000/api").trim();

  return {
    plugins: [react()],
    base: env.VITE_BASE_URL || "/",
    server: {
      proxy: {
        "/api": {
          target: getApiOrigin(apiUrl),
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
