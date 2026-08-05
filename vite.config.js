import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Vercel은 사이트를 최상위 주소(/)로 서비스하므로 base는 "/".
// (GitHub Pages처럼 하위 폴더로 올릴 때만 base를 "/저장소이름/"으로 바꾸면 된다.)
export default defineConfig({
  base: "/",
  plugins: [
    react(),
    VitePWA({
      // 서비스워커 파일과 캐시 이름을 빌드할 때마다 자동으로 새로 만든다.
      // → 예전처럼 sw.js의 캐시명(guitar-theory-v45)을 손으로 고칠 필요가 없다.
      registerType: "prompt",
      includeAssets: ["icon-180.png", "icon-512.png"],
      manifest: {
        name: "기타 이론",
        short_name: "기타 이론",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0E1113",
        theme_color: "#0E1113",
        icons: [
          { src: "/icon-180.png", sizes: "180x180", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        // 예전 sw.js는 "실패한 모든 GET"에 index.html을 돌려줬다(자산 요청에도 HTML이 감).
        // 아래 설정은 화면 이동(navigate) 요청에만 index.html을 돌려준다.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.{js,jsx}"],
  },
});
