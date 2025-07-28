#!/usr/bin/env bun

import { program } from "@commander-js/extra-typings";
import * as pkg from "./package.json";
import { Config } from "./classes/config";
import { Logger } from "./classes/logger";

import { setOpenAIClient } from "./utils/client";

import { GeneralAgent } from "./agents/general";
import { InboxAgent } from "./agents/inbox";

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
  .command("inbox")
  .description("Read your inbox and summarize the emails")
  .option(
    "-n, --number_of_emails <number_of_emails>",
    "The number of emails to read",
    parseInt,
    10,
  )
  .option("-r, --include_read", "Include read emails in the summary", false)
  .action(async (options) => {
    const agent = new InboxAgent(config, logger);
    await agent.readInbox(options.number_of_emails, options.include_read);
    process.exit(0);
  });

program
  .command("slack-summary")
  .description("Read your inbox and summarize the emails")
  .argument("<slack_user>", "The slack user to send the summary to")
  .action(async (slack_user) => {
    const agent = new InboxAgent(config, logger);
    await agent.summarizeInboxToSlack(slack_user);
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
