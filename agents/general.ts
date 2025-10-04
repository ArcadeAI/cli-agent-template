import { WrappedAgent } from "../classes/wrappedAgent";
import type { Config } from "../classes/config";
import type { Logger } from "../classes/logger";
import chalk from "chalk";

export class GeneralAgent extends WrappedAgent {
  constructor(config: Config, logger: Logger) {
    const instructions = `
You are a general-purpose AI/LLM agent that can assist with a wide range of tasks.
You can take many actions via the toolkits provided to you.
ALWAYS prefer to call tools, but only when you are CERTAIN that you understand the user's request.  Otherwise, ask clarifying questions.
Unless otherwise specified, you should respond in Markdown, and in Table format when you have multiple items to list.
You are in a terminal window, and the size of the terminal is ${Bun.env.COLUMNS}x${Bun.env.LINES}.
`;
    super("GeneralAgent", instructions, config, logger);
  }

  async chat(prompt: string, toolkitNames: string[] = []) {
    this.logger.startSpan(chalk.gray(`Thinking...`));
    const stream = await this.run(prompt, toolkitNames);
    this.logger.endSpan();
    return stream;
  }
}
