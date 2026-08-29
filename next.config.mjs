import { networkInterfaces } from "node:os";

const lanOrigins = Object.values(networkInterfaces())
  .flatMap((addresses) => addresses || [])
  .filter((address) => address.family === "IPv4" && !address.internal)
  .map((address) => address.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", ...lanOrigins]
};

export default nextConfig;
