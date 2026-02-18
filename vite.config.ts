import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";

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
  plugins: [tsconfigPaths(), react(), expressPlugin()],
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
    async configureServer(viteServer) {
      if (databaseInitialized) return;
      databaseInitialized = true;

      // Use Vite's ssrLoadModule to load TypeScript files with path alias support
      const { createServer } = await viteServer.ssrLoadModule("/server/index.ts");
      const { dbConnection } = await viteServer.ssrLoadModule("/server/config/database.ts");
      const { seedAllData } = await viteServer.ssrLoadModule("/server/utils/seedData.ts");

      // Connect to MongoDB before starting the server (optional in dev)
      try {
        await dbConnection.connect();

        // Seed demo data in development
        if (process.env.NODE_ENV !== "production") {
          console.log("Seeding demo data...");
          await seedAllData();
        }
      } catch (error) {
        console.error("Failed to initialize database:", error);
        console.log("⚠️  Continuing without database for UI development...");
        // Don't throw error - allow server to start for UI work
      }

      const app = createServer();

      // Add Express app as middleware to Vite dev server
      viteServer.middlewares.use(app);
    },
  };
}
