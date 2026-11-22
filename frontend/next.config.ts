import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Stop `next dev` from writing AGENTS.md when it runs inside an AI agent
  agentRules: false,
}

export default nextConfig
