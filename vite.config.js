import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./src/UI",
  build: {
    outDir: "./dist/UI",
  },
});
