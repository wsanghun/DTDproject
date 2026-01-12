import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // ⭐️ 외부 접속 허용 (옆 컴퓨터에서 접속 가능하게)
    host: "0.0.0.0",

    // ⭐️ 프록시 설정 (여기가 핵심!)
    proxy: {
      "/api": {
        target: "http://192.168.0.69:8070", // 백엔드(내 컴퓨터) IP
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
