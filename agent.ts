#!/usr/bin/env bun

import { program } from "@commander-js/extra-typings";
import * as pkg from "./package.json";
import { Config } from "./classes/config";
import { Logger } from "./classes/logger";

import { setOpenAIClient } from "./utils/client";

import { GeneralAgent } from "./agents/general";

const config = new Config();
const logger = new Logger(config);
setOpenAIClient(config);

program.version(pkg.version).name(pkg.name).description(pkg.description);

process.on("SIGINT", () => {
  console.log("SIGINT: 👋 Bye!");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM: 👋 Bye!");
  process.exit(0);
});

program
  .command("chat")
  .description("Start an interactive chat session with the agent")
  .argument("[message]", "The message to start the chat session with")
  .option(
    "-t, --toolkits <toolkits>",
    "Comma-separated list of toolkits to use (e.g., gmail,slack)",
    "gmail,slack",
  )
  .action(async (message, options) => {
    const agent = new GeneralAgent(config, logger);
    const toolkitNames = options.toolkits.split(",").map((t) => t.trim());
    await agent.interactiveChat(
      async (input: string) => {
        await agent.chat(input, toolkitNames);
      },
      message,
      toolkitNames,
    );
  });

program.parse();
