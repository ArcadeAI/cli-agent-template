import { WrappedAgent } from "../classes/wrappedAgent";
import type { Config } from "../classes/config";
import type { Logger } from "../classes/logger";
import type { MCPServerStreamableHttp } from "@openai/agents";

export class GeneralAgent extends WrappedAgent {
  constructor(config: Config, logger: Logger) {
    const cols = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    const instructions = `
You are a general-purpose AI/LLM agent that can assist with a wide range of tasks.
You can take many actions via the tools provided to you.
ALWAYS prefer to call tools, but only when you are CERTAIN that you understand the user's request.  Otherwise, ask clarifying questions.  Do not rely on any pre-existing knowledge - only use the tools provided to you.
Unless otherwise specified, you should respond in Markdown, and in Table format when you have multiple items to list.
You are in a terminal window that is ${cols} columns wide and ${rows} rows tall. Keep your Markdown output (tables, ASCII art, code blocks, etc.) within ${cols} columns so it renders correctly without wrapping.
`;
    super("GeneralAgent", instructions, config, logger);
  }

  async chat(prompt: string, mcpServers: MCPServerStreamableHttp[] = []) {
    return await this.run(prompt, mcpServers);
  }
}
