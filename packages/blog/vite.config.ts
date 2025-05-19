import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      generateScopedName:
        process.env.NODE_ENV === "development"
          ? "[local]__[hash:base64:8]"
          : "[hash:base64:8]",
    },
  },
});
