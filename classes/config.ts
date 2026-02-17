import type { LogLevel } from "./logger";

export class Config {
  public readonly openai_api_key: string;
  public readonly openai_model: string | undefined;
  public readonly log_level: LogLevel;
  public readonly log_color: boolean = true;
  public readonly log_timestamps: boolean = true;
  public arcade_gateway_url: string | undefined;

  constructor() {
    const openai_api_key = Bun.env.OPENAI_API_KEY;
    if (!openai_api_key) {
      throw new Error("OPENAI_API_KEY key is required");
    }
    this.openai_api_key = openai_api_key;

    const openai_model = Bun.env.OPENAI_MODEL;
    if (!openai_model) {
      throw new Error("OPENAI_MODEL key is required");
    }
    this.openai_model = openai_model;

    const log_level = Bun.env.LOG_LEVEL;
    if (!log_level) {
      throw new Error("LOG_LEVEL key is required");
    }
    this.log_level = log_level as LogLevel;

    this.arcade_gateway_url = Bun.env.ARCADE_GATEWAY_URL;
  }
}
