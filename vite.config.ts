import reactRefresh from "@vitejs/plugin-react-refresh";
import { defineConfig } from "vite";

export default defineConfig({
    optimizeDeps: {
        exclude: ["agora-electron-sdk"],
    },
    plugins: [reactRefresh()],
});
