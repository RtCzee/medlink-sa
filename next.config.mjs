import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack(config) {
    config.resolve.alias["framer-motion"] = path.resolve(
      process.cwd(),
      "node_modules/framer-motion/dist/cjs/index.js"
    );
    return config;
  },
  turbopack: {
    resolveAlias: {
      "framer-motion": path.resolve(
        process.cwd(),
        "node_modules/framer-motion/dist/cjs/index.js"
      ),
    },
  },
  reactStrictMode: false,
};

export default nextConfig;
