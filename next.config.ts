import withSerwist from "@serwist/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withSerwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
