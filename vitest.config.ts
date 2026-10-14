import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": new (require("node:url").URL)("./", import.meta.url).pathname } },
  test: { environment: "node" },
});
