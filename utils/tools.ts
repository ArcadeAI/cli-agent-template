import { Arcade } from "@arcadeai/arcadejs";
import type { Config } from "../classes/config";
import { executeOrAuthorizeZodTool, toZod } from "@arcadeai/arcadejs/lib";
import { tool } from "@openai/agents";
import { Logger } from "../classes/logger";
import chalk from "chalk";

export async function prepareTools(
  config: Config,
  logger: Logger,
  toolkitName: string,
  limit = 100,
) {
  const client = new Arcade({ apiKey: config.arcade_api_key });
  const toolkit = await client.tools.list({ toolkit: toolkitName, limit });

  if (toolkit.items.length === 0) {
    throw new Error(`No tools found for toolkit: ${toolkitName}`);
  }

  const executeOrAuthorizeZodToolWithLogging = (tool: any) => {
    return async (input: any) => {
      const toolName = tool.toolDefinition.qualified_name as string;
      logger.incrementToolCalls();
      logger.updateSpan(
        `executing tool \`${toolName}\` ${config.log_color ? chalk.gray(`(${JSON.stringify(input)})`) : `(${JSON.stringify(input)})`}`,
        "⏳",
      );
      const startTime = Date.now();
      try {
        const result = await executeOrAuthorizeZodTool(tool)(input);
        const endTime = Date.now();
        const duration = endTime - startTime;
        logger.updateSpan(
          `completed execution of tool \`${toolName}\` in ${duration}ms`,
          "✔️",
        );
        return result;
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const msg = `failed execution of tool \`${toolName}\` in ${duration}ms: ${error}`;
        logger.updateSpan(config.log_color ? chalk.red(msg) : msg, "❌");
        throw error;
      }
    };
  };

  const tools = toZod({
    tools: toolkit.items,
    client,
    userId: config.user_id,
    executeFactory: executeOrAuthorizeZodToolWithLogging,
  }).map(tool);

  return tools;
}
