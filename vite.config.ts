import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";
import { dbConnection } from "./server/config/database";
import { seedAllData } from "./server/utils/seedData";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [".", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  let databaseInitialized = false;

  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      if (databaseInitialized) return;
      databaseInitialized = true;

      // Connect to MongoDB before starting the server
      try {
        await dbConnection.connect();

        // Seed demo data in development
        if (process.env.NODE_ENV !== "production") {
          console.log("Seeding demo data...");
          await seedAllData();
        }
      } catch (error) {
        console.error("Failed to initialize database:", error);
        throw error;
      }

      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
