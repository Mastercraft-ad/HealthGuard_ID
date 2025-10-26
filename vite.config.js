import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// Import optional plugins only in dev mode. On non-Replit machines we avoid
// importing Replit-specific plugins (like the runtime error overlay) because
// they can pull in packages that assume a different module layout.
const devPlugins = [];
if (process.env.NODE_ENV !== "production") {
    if (process.env.REPL_ID !== undefined) {
        // Only import Replit-specific plugins when running on Replit
        const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default || m);
        const cartographer = await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer());
        const devBanner = await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner());
        devPlugins.push(runtimeErrorOverlay(), cartographer, devBanner);
    }
}
export default defineConfig({
    root: path.resolve(process.cwd(), "client"), // ✅ Points Vite to your client folder
    plugins: [react(), ...devPlugins],
    resolve: {
        alias: {
            "@": path.resolve(process.cwd(), "client", "src"),
            "@shared": path.resolve(process.cwd(), "shared"),
            "@assets": path.resolve(process.cwd(), "attached_assets"),
            // ✅ Ensures react-hook-form uses a compatible build
            "react-hook-form": path.resolve(process.cwd(), "node_modules", "react-hook-form", "dist", "index.cjs.js"),
            // Some Radix packages publish `exports` pointing to an `.mjs` entry
            // that may be missing in some installs. Point Vite at the actual
            // built file to avoid "Failed to resolve entry" during pre-bundle.
            "@radix-ui/react-popper": path.resolve(process.cwd(), "node_modules", "@radix-ui", "react-popper", "dist", "index.js"),
        },
    },
    build: {
        outDir: path.resolve(process.cwd(), "dist/public"), // ✅ Output goes here
        emptyOutDir: true, // Cleans dist before build
    },
    server: {
        host: "0.0.0.0",
        port: 5000,
        strictPort: false,
        hmr: {
            clientPort: 443,
        },
        allowedHosts: true,
        fs: {
            strict: true,
            deny: ["**/.*"],
        },
    },
});
