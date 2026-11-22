import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // La web vive en /web dentro de un repo con otro package-lock (Remotion).
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
