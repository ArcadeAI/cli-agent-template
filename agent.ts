#!/usr/bin/env bun

import React from "react";
import { render } from "ink";
import { program } from "@commander-js/extra-typings";
import * as pkg from "./package.json";
import { Config } from "./classes/config";
import { Logger } from "./classes/logger";

import { setOpenAIClient } from "./utils/client";
import { createMcpServer } from "./utils/tools";

import { GeneralAgent } from "./agents/general";
import { App } from "./components/App";

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
  await cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
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

    render(
      React.createElement(App, {
        agent,
        mcpServer: mcpServer!,
        logger,
        config,
        initialMessage: message,
        onExit: async () => {
          await cleanup();
          process.exit(0);
        },
      }),
    );
  });

program.parse();
