import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  /* ponytail: framer-motion v12.43 ships ESM .mjs.map but no .mjs — alias to CJS */
  webpack(config) {
    config.resolve.alias["framer-motion"] = path.resolve(
      __dirname,
      "node_modules/framer-motion/dist/cjs/index.js"
    );
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
