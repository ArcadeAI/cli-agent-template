import {
  Agent,
  type AgentInputItem,
  Handoff,
  Runner,
  type Tool,
  user,
} from "@openai/agents";

import { Config } from "./config";
import type { Logger } from "./logger";
import { prepareTools } from "../utils/tools";
import * as readline from "readline";
import chalk from "chalk";

export abstract class WrappedAgent {
  history: AgentInputItem[] = [];
  name: string;
  instructions: string;
  config: Config;
  logger: Logger;
  agent?: Agent<unknown, "text">;

  constructor(
    name: string,
    instructions: string,
    config: Config,
    logger: Logger,
  ) {
    this.name = name;
    this.instructions = instructions;
    this.config = config;
    this.logger = logger;
  }

  public async run(
    prompt: string,
    toolkitNames: string[] = [],
    handoffs: Handoff[] = [],
    maxTurns = 10,
  ) {
    const tools: Tool[] = [];

    for (const toolkitName of toolkitNames) {
      const toolkitTools = await prepareTools(
        this.config,
        this.logger,
        toolkitName,
      );
      tools.push(...toolkitTools);
    }

    if (!this.agent) {
      this.agent = new Agent<unknown, "text">({
        name: this.name,
        model: this.config.openai_model,
        instructions: this.instructions,
        tools,
        handoffs,
      });
    } else {
      this.agent.tools = tools;
    }

    const runner = new Runner(this.agent);

    this.history.push(user(prompt));

    const stream = await runner.run(this.agent, this.history, {
      maxTurns,
      stream: true,
    });

    stream
      .toTextStream({ compatibleWithNodeStreams: true })
      .pipe(this.logger.stream);
    await stream.completed;

    this.logger.endSpan(stream.finalOutput);

    if (stream.history.length > 0) {
      this.history = stream.history;
    }

    if (stream.finalOutput) {
      this.logger.debug(stream.finalOutput);
    }

    return stream;
  }

  public async interactiveChat(
    execMethod: (input: string) => Promise<void>,
    initialMessage?: string,
    toolkitNames: string[] = [],
    onExit: () => void = () => process.exit(0),
  ) {
    this.logger.info(
      `🤖 Starting chat session with your agent (${this.config.openai_model})`,
    );
    this.logger.info(
      `📦 Available toolkits: ${chalk.cyan(toolkitNames.join(", "))}`,
    );
    this.logger.info("💡 Type 'quit', 'exit', or 'bye' to end the session");
    this.logger.info("💡 Type 'clear' to clear the conversation history");

    const askQuestion = async (
      questionText: string = `${this.logger.getTimestamp()} ` +
        chalk.green("?> "),
    ) => {
      await new Promise((resolve) => {
        // Create a custom output stream that colors user input green
        const mutableStdout = new (require('stream')).Writable({
          write: (chunk: any, encoding: any, callback: any) => {
            // Color the input text green
            process.stdout.write(chalk.green(chunk.toString()), callback);
          }
        });
        mutableStdout.columns = process.stdout.columns;
        mutableStdout.rows = process.stdout.rows;

        const rl = readline.createInterface({
          input: process.stdin,
          output: mutableStdout,
          terminal: true,
        });

        rl.question(questionText, async (answer) => {
          process.stdout.write('\n'); // Add newline after green input
          await handleInput(answer.trim());
          rl.close();
          resolve(true);
        });
      });

      await askQuestion();
    };

    const handleInput = async (input: string) => {
      if (input.toLowerCase() === "quit" || input.toLowerCase() === "exit") {
        console.log("👋 Goodbye!");
        onExit?.();
      }

      if (input === "clear") {
        this.history = [];
        this.logger.info("🧹 Conversation history cleared!");
        return await execMethod("Hello - we are starting a new conversation.  You have access to the following toolkits: " + toolkitNames.join(", "));
      }

      return await execMethod(input);
    };

    if (initialMessage) {
      await handleInput(initialMessage);
    }
    await askQuestion();
  }
}
