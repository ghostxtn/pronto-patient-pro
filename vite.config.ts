import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => {
  const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:3000";

  return {
    server: {
      host: true,
      port: 5173,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: false,
        },
        "/uploads": {
          target: proxyTarget,
          changeOrigin: false,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
