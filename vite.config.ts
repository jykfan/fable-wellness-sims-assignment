import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" so the built app works when served from any sub-path
// (GitHub Pages, S3 folder, etc.) as well as from a domain root.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
