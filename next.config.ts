import withSerwist from "@serwist/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
