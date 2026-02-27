import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    base: mode === "production" ? (env.VITE_BASE_URL || "/") : "/",
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

