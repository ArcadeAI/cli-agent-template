import { describe, it, expect, beforeEach, afterEach } from "bun:test";

describe("Logger", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    // Set up required environment variables
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.OPENAI_MODEL = "gpt-4-turbo";
    process.env.LOG_LEVEL = "info";
    process.env.ARCADE_API_KEY = "test-arcade-key";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("constructor", () => {
    it("should initialize with config", async () => {
      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      const logger = new Logger(config);

      expect(logger).toBeDefined();
      expect(logger).toHaveProperty("info");
      expect(logger).toHaveProperty("debug");
      expect(logger).toHaveProperty("error");
      expect(logger).toHaveProperty("warn");
    });
  });

  describe("logging methods", () => {
    let logger: any;

    beforeEach(async () => {
      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      logger = new Logger(config);
    });

    it("should have info method", () => {
      expect(typeof logger.info).toBe("function");
      expect(() => logger.info("test message")).not.toThrow();
    });

    it("should have debug method", () => {
      expect(typeof logger.debug).toBe("function");
      expect(() => logger.debug("test message")).not.toThrow();
    });

    it("should have error method", () => {
      expect(typeof logger.error).toBe("function");
      expect(() => logger.error("test message")).not.toThrow();
    });

    it("should have warn method", () => {
      expect(typeof logger.warn).toBe("function");
      expect(() => logger.warn("test message")).not.toThrow();
    });

    it("should handle undefined messages", () => {
      expect(() => logger.info(undefined)).not.toThrow();
      expect(() => logger.debug(undefined)).not.toThrow();
      expect(() => logger.error(undefined)).not.toThrow();
      expect(() => logger.warn(undefined)).not.toThrow();
    });

    it("should emit log events", async () => {
      const events: any[] = [];
      logger.onLog((event: any) => events.push(event));

      logger.info("test info");
      logger.warn("test warn");

      expect(events).toHaveLength(2);
      expect(events[0]?.message).toBe("test info");
      expect(events[0]?.level).toBe("info");
      expect(events[1]?.message).toBe("test warn");
      expect(events[1]?.level).toBe("warn");
    });

    it("should emit events with correct structure", () => {
      const events: any[] = [];
      logger.onLog((event: any) => events.push(event));

      logger.info("test message");

      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty("level");
      expect(events[0]).toHaveProperty("message");
      expect(events[0]).toHaveProperty("timestamp");
      expect(events[0]?.message).toBe("test message");
    });
  });

  describe("getTimestamp method", () => {
    let logger: any;

    beforeEach(async () => {
      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      logger = new Logger(config);
    });

    it("should have getTimestamp method", () => {
      expect(typeof logger.getTimestamp).toBe("function");
    });

    it("should return a timestamp string", () => {
      const timestamp = logger.getTimestamp();
      expect(typeof timestamp).toBe("string");
      expect(timestamp).toMatch(/^\[\d{2}:\d{2}:\d{2}\]$/);
    });

    it("should include timestamp when timestamps are enabled", () => {
      const timestamp = logger.getTimestamp();
      expect(timestamp).toMatch(/^\[\d{2}:\d{2}:\d{2}\]$/);
    });
  });

  describe("tool call events", () => {
    let logger: any;

    beforeEach(async () => {
      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      logger = new Logger(config);
    });

    it("should have toolCallStarted and toolCallCompleted methods", () => {
      expect(typeof logger.toolCallStarted).toBe("function");
      expect(typeof logger.toolCallCompleted).toBe("function");
      expect(() => logger.toolCallStarted("id1", "test", "{}")).not.toThrow();
    });

    it("should emit toolCallUpdate events", () => {
      const updates: any[] = [];
      logger.onToolCallUpdate((info: any) => updates.push(info));

      logger.toolCallStarted("id1", "search", '{"q":"hello"}');
      logger.toolCallCompleted("id1", "search");

      expect(updates.length).toBe(2);
      expect(updates[0].status).toBe("running");
      expect(updates[0].name).toBe("search");
      expect(updates[0].args).toBe('{"q":"hello"}');
      expect(updates[1].status).toBe("completed");
      expect(updates[1].callId).toBe("id1");
    });

    it("should allow unsubscribing from events", () => {
      const updates: any[] = [];
      const unsub = logger.onToolCallUpdate((info: any) => updates.push(info));

      logger.toolCallStarted("id1", "test", "{}");
      unsub();
      logger.toolCallStarted("id2", "test2", "{}");

      expect(updates.length).toBe(1);
    });
  });

  describe("log level filtering", () => {
    it("should respect ERROR log level", async () => {
      process.env.LOG_LEVEL = "error";

      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      const logger = new Logger(config);

      expect(() => logger.debug("debug message")).not.toThrow();
      expect(() => logger.info("info message")).not.toThrow();
      expect(() => logger.warn("warn message")).not.toThrow();
      expect(() => logger.error("error message")).not.toThrow();
    });

    it("should respect WARN log level", async () => {
      process.env.LOG_LEVEL = "warn";

      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      const logger = new Logger(config);

      expect(() => logger.debug("debug message")).not.toThrow();
      expect(() => logger.info("info message")).not.toThrow();
      expect(() => logger.warn("warn message")).not.toThrow();
      expect(() => logger.error("error message")).not.toThrow();
    });

    it("should respect INFO log level", async () => {
      process.env.LOG_LEVEL = "info";

      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      const logger = new Logger(config);

      expect(() => logger.debug("debug message")).not.toThrow();
      expect(() => logger.info("info message")).not.toThrow();
      expect(() => logger.warn("warn message")).not.toThrow();
      expect(() => logger.error("error message")).not.toThrow();
    });

    it("should respect DEBUG log level", async () => {
      process.env.LOG_LEVEL = "debug";

      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      const logger = new Logger(config);

      expect(() => logger.debug("debug message")).not.toThrow();
      expect(() => logger.info("info message")).not.toThrow();
      expect(() => logger.warn("warn message")).not.toThrow();
      expect(() => logger.error("error message")).not.toThrow();
    });
  });
});
