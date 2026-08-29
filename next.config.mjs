import { networkInterfaces } from "node:os";

const lanOrigins = Object.values(networkInterfaces())
  .flatMap((addresses) => addresses || [])
  .filter((address) => address.family === "IPv4" && !address.internal)
  .map((address) => address.address);

const configuredOrigins = (process.env.ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    ...lanOrigins,
    // 当前远程开发服务器通过公网 IP 访问，Next 16 会拦截带 crossorigin 的 _next 脚本。
    "43.139.202.189",
    ...configuredOrigins
  ]
};

export default nextConfig;
