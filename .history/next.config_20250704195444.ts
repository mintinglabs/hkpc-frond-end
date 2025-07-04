import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["http://192.168.51.35:3000/*"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hkpc-app-service-169749647729.asia-east2.run.app",
      },
    ],
  },
  // 配置端口
  port: 3001,
  // output: "export",
};

export default nextConfig;
