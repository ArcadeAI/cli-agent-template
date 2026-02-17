#!/usr/bin/env bun

import { program } from "@commander-js/extra-typings";
import * as pkg from "./package.json";
import { Config } from "./classes/config";
import { Logger } from "./classes/logger";

import { setOpenAIClient } from "./utils/client";
import { createMcpServer } from "./utils/tools";

import { GeneralAgent } from "./agents/general";

const config = new Config();
const logger = new Logger(config);
setOpenAIClient(config);

program.version(pkg.version).name(pkg.name).description(pkg.description);

let mcpServer: ReturnType<typeof createMcpServer> | undefined;

async function cleanup() {
  if (mcpServer) {
    await mcpServer.close().catch(() => {});
  }
}

process.on("SIGINT", async () => {
  console.log("SIGINT: 👋 Bye!");
  await cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM: 👋 Bye!");
  await cleanup();
  process.exit(0);
});

program
  .command("chat")
  .description("Start an interactive chat session with the agent")
  .argument("[message]", "The message to start the chat session with")
  .option(
    "-g, --gateway-url <url>",
    "Arcade MCP Gateway URL (overrides ARCADE_GATEWAY_URL env var)",
  )
  .action(async (message, options) => {
    if (options.gatewayUrl) {
      config.arcade_gateway_url = options.gatewayUrl;
    }

    if (!config.arcade_gateway_url) {
      console.error(
        "Error: Gateway URL is required. Set ARCADE_GATEWAY_URL env var or pass --gateway-url.",
      );
      process.exit(1);
    }

    mcpServer = createMcpServer(config);
    await mcpServer.connect();

    const agent = new GeneralAgent(config, logger);
    await agent.interactiveChat(
      async (input: string) => {
        await agent.chat(input, [mcpServer!]);
      },
      message,
      async () => {
        await cleanup();
        process.exit(0);
      },
    );
  });

program.parse();
