import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Dedicated test config — deliberately omits the Cloudflare/TanStack plugins so
// unit tests stay fast and isolated. Server-function/D1 integration tests will
// use the Workers pool in a separate project when first needed (S3).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
