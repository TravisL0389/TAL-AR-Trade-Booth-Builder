import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 2100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@babylonjs/core")) {
            return "babylon";
          }

          return undefined;
        },
      },
    },
  },
});
