import { agent } from "@convex-dev/agent/convex.config";
import { defineConfig } from "convex/server";

export default defineConfig({
  components: {
    agent,
  },
});
