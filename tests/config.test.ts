import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { LogLevel } from "../classes/logger";

describe("Config", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    for (const key in Bun.env) {
      delete Bun.env[key];
    }
  });

  afterEach(() => {
    Object.keys(originalEnv).forEach((key) => {
      if (originalEnv[key] !== undefined) {
        Bun.env[key] = originalEnv[key];
      }
    });
  });

  describe("constructor", () => {
    it("should load all required environment variables", async () => {
      // Set up all required environment variables
      Bun.env.OPENAI_API_KEY = "test-openai-key";
      Bun.env.OPENAI_MODEL = "gpt-4-turbo";
      Bun.env.LOG_LEVEL = "info";
      Bun.env.ARCADE_API_KEY = "test-arcade-key";
      Bun.env.USER_ID = "test-user-id";

      const { Config } = await import("../classes/config");
      const config = new Config();

      expect(config.openai_api_key).toBe("test-openai-key");
      expect(config.openai_model).toBe("gpt-4-turbo");
      expect(config.log_level).toBe("info" as LogLevel);
      expect(config.arcade_api_key).toBe("test-arcade-key");
      expect(config.user_id).toBe("test-user-id");
    });

    it("should throw error when OPENAI_API_KEY is missing", async () => {
      // Set up all required env vars except OPENAI_API_KEY
      Bun.env.OPENAI_MODEL = "gpt-4-turbo";
      Bun.env.LOG_LEVEL = "info";
      Bun.env.ARCADE_API_KEY = "test-arcade-key";
      Bun.env.USER_ID = "test-user-id";

      const { Config } = await import("../classes/config");
      expect(() => {
        new Config();
      }).toThrow("OPENAI_API_KEY key is required");
    });

    it("should throw error when OPENAI_MODEL is missing", async () => {
      // Set up all required env vars except OPENAI_MODEL
      Bun.env.OPENAI_API_KEY = "test-openai-key";
      Bun.env.LOG_LEVEL = "info";
      Bun.env.ARCADE_API_KEY = "test-arcade-key";
      Bun.env.USER_ID = "test-user-id";

      const { Config } = await import("../classes/config");
      expect(() => {
        new Config();
      }).toThrow("OPENAI_MODEL key is required");
    });

    it("should throw error when LOG_LEVEL is missing", async () => {
      // Set up all required env vars except LOG_LEVEL
      Bun.env.OPENAI_API_KEY = "test-openai-key";
      Bun.env.OPENAI_MODEL = "gpt-4-turbo";
      Bun.env.ARCADE_API_KEY = "test-arcade-key";
      Bun.env.USER_ID = "test-user-id";

      const { Config } = await import("../classes/config");
      expect(() => {
        new Config();
      }).toThrow("LOG_LEVEL key is required");
    });

    it("should throw error when ARCADE_API_KEY is missing", async () => {
      // Set up all required env vars except ARCADE_API_KEY
      Bun.env.OPENAI_API_KEY = "test-openai-key";
      Bun.env.OPENAI_MODEL = "gpt-4-turbo";
      Bun.env.LOG_LEVEL = "info";
      Bun.env.USER_ID = "test-user-id";

      const { Config } = await import("../classes/config");
      expect(() => {
        new Config();
      }).toThrow("ARCADE_API_KEY key is required");
    });

    it("should throw error when USER_ID is missing", async () => {
      // Set up all required env vars except USER_ID
      Bun.env.OPENAI_API_KEY = "test-openai-key";
      Bun.env.OPENAI_MODEL = "gpt-4-turbo";
      Bun.env.LOG_LEVEL = "info";
      Bun.env.ARCADE_API_KEY = "test-arcade-key";

      const { Config } = await import("../classes/config");
      expect(() => {
        new Config();
      }).toThrow("USER_ID key is required");
    });

    it("should have default values for optional properties", async () => {
      // Set up all required environment variables
      Bun.env.OPENAI_API_KEY = "test-openai-key";
      Bun.env.OPENAI_MODEL = "gpt-4-turbo";
      Bun.env.LOG_LEVEL = "info";
      Bun.env.ARCADE_API_KEY = "test-arcade-key";
      Bun.env.USER_ID = "test-user-id";

      const { Config } = await import("../classes/config");
      const config = new Config();

      // Check default values for optional properties
      expect(config.log_color).toBe(true);
      expect(config.log_timestamps).toBe(true);
    });

    it("should accept debug log level", async () => {
      Bun.env.OPENAI_API_KEY = "test-openai-key";
      Bun.env.OPENAI_MODEL = "gpt-4-turbo";
      Bun.env.LOG_LEVEL = "debug";
      Bun.env.ARCADE_API_KEY = "test-arcade-key";
      Bun.env.USER_ID = "test-user-id";

      const { Config } = await import("../classes/config");
      const config = new Config();
      expect(config.log_level).toBe("debug" as LogLevel);
    });

    it("should accept info log level", async () => {
      Bun.env.OPENAI_API_KEY = "test-openai-key";
      Bun.env.OPENAI_MODEL = "gpt-4-turbo";
      Bun.env.LOG_LEVEL = "info";
      Bun.env.ARCADE_API_KEY = "test-arcade-key";
      Bun.env.USER_ID = "test-user-id";

      const { Config } = await import("../classes/config");
      const config = new Config();
      expect(config.log_level).toBe("info" as LogLevel);
    });

    it("should accept warn log level", async () => {
      Bun.env.OPENAI_API_KEY = "test-openai-key";
      Bun.env.OPENAI_MODEL = "gpt-4-turbo";
      Bun.env.LOG_LEVEL = "warn";
      Bun.env.ARCADE_API_KEY = "test-arcade-key";
      Bun.env.USER_ID = "test-user-id";

      const { Config } = await import("../classes/config");
      const config = new Config();
      expect(config.log_level).toBe("warn" as LogLevel);
    });

    it("should accept error log level", async () => {
      Bun.env.OPENAI_API_KEY = "test-openai-key";
      Bun.env.OPENAI_MODEL = "gpt-4-turbo";
      Bun.env.LOG_LEVEL = "error";
      Bun.env.ARCADE_API_KEY = "test-arcade-key";
      Bun.env.USER_ID = "test-user-id";

      const { Config } = await import("../classes/config");
      const config = new Config();
      expect(config.log_level).toBe("error" as LogLevel);
    });
  });

  describe("properties", () => {
    let config: any;

    beforeEach(async () => {
      Bun.env.OPENAI_API_KEY = "test-openai-key";
      Bun.env.OPENAI_MODEL = "gpt-4-turbo";
      Bun.env.LOG_LEVEL = "info";
      Bun.env.ARCADE_API_KEY = "test-arcade-key";
      Bun.env.USER_ID = "test-user-id";

      const { Config } = await import("../classes/config");
      config = new Config();
    });

    it("should have readonly properties", () => {
      expect(config).toHaveProperty("openai_api_key");
      expect(config).toHaveProperty("openai_model");
      expect(config).toHaveProperty("log_level");
      expect(config).toHaveProperty("log_color");
      expect(config).toHaveProperty("log_timestamps");
      expect(config).toHaveProperty("arcade_api_key");
      expect(config).toHaveProperty("user_id");
    });

    it("should have correct property types", () => {
      expect(typeof config.openai_api_key).toBe("string");
      expect(typeof config.openai_model).toBe("string");
      expect(typeof config.log_level).toBe("string");
      expect(typeof config.log_color).toBe("boolean");
      expect(typeof config.log_timestamps).toBe("boolean");
      expect(typeof config.arcade_api_key).toBe("string");
      expect(typeof config.user_id).toBe("string");
    });
  });
});
