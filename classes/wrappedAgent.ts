import {
  Agent,
  type AgentInputItem,
  Handoff,
  run,
  type MCPServerStreamableHttp,
  user,
} from "@openai/agents";

import { Config } from "./config";
import type { Logger } from "./logger";

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
    mcpServers: MCPServerStreamableHttp[] = [],
    handoffs: Handoff[] = [],
    maxTurns = 10,
  ) {
    if (!this.agent) {
      this.agent = new Agent<unknown, "text">({
        name: this.name,
        model: this.config.openai_model,
        instructions: this.instructions,
        mcpServers,
        handoffs,
      });
    } else {
      this.agent.mcpServers = mcpServers;
    }

    this.history.push(user(prompt));

    const stream = await run(this.agent, this.history, {
      maxTurns,
      stream: true,
    });

    return stream;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async finalizeStream(stream: any) {
    await stream.completed;

    if (stream.history.length > 0) {
      this.history = stream.history;
    }

    return stream.finalOutput;
  }
}
