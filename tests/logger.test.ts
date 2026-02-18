import { describe, it, expect, beforeEach, afterEach } from "bun:test";

describe("Logger", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalConsole: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalConsole = { ...console };

    // Set up required environment variables
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.OPENAI_MODEL = "gpt-4-turbo";
    process.env.LOG_LEVEL = "info";
    process.env.ARCADE_API_KEY = "test-arcade-key";

    // Mock console methods to capture output
    console.log = () => {};
    console.error = () => {};
    console.debug = () => {};
  });

  afterEach(() => {
    process.env = originalEnv;
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
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
      expect(logger).toHaveProperty("stream");
    });

    it("should create LoggerStream", async () => {
      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      const logger = new Logger(config);

      expect(logger.stream).toBeDefined();
      expect(typeof logger.stream.write).toBe("function");
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
      // Should match the format [HH:MM:SS] with optional ANSI color codes
      expect(timestamp).toMatch(
        /^(\u001b\[\d+m)?\[\d{2}:\d{2}:\d{2}\](\u001b\[\d+m)?$/,
      );
    });

    it("should include timestamp when timestamps are enabled", () => {
      const timestamp = logger.getTimestamp();
      expect(timestamp).toMatch(
        /^(\u001b\[\d+m)?\[\d{2}:\d{2}:\d{2}\](\u001b\[\d+m)?$/,
      );
    });
  });

  describe("stream property", () => {
    let logger: any;

    beforeEach(async () => {
      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      logger = new Logger(config);
    });

    it("should have a stream property", () => {
      expect(logger).toHaveProperty("stream");
      expect(logger.stream).toBeDefined();
    });

    it("should have write method on stream", () => {
      expect(typeof logger.stream.write).toBe("function");
    });

    it("should handle stream writes", () => {
      expect(() => logger.stream.write("test data")).not.toThrow();
    });
  });

  describe("span methods", () => {
    let logger: any;

    beforeEach(async () => {
      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      logger = new Logger(config);
    });

    it("should have startSpan method", () => {
      expect(typeof logger.startSpan).toBe("function");
      expect(() => logger.startSpan("test span")).not.toThrow();
    });

    it("should have updateSpan method", () => {
      expect(typeof logger.updateSpan).toBe("function");
      expect(() => logger.updateSpan("test update", "🔄")).not.toThrow();
    });

    it("should have endSpan method", () => {
      expect(typeof logger.endSpan).toBe("function");
      expect(() => logger.endSpan("test output")).not.toThrow();
    });

    it("should have streamToSpan method", () => {
      expect(typeof logger.streamToSpan).toBe("function");
      expect(() => logger.streamToSpan("test stream")).not.toThrow();
    });

    it("should have incrementToolCalls method", () => {
      expect(typeof logger.incrementToolCalls).toBe("function");
      expect(() => logger.incrementToolCalls()).not.toThrow();
    });
  });

  describe("log level filtering", () => {
    it("should respect ERROR log level", async () => {
      process.env.LOG_LEVEL = "error";

      const { Config } = await import("../classes/config");
      const { Logger } = await import("../classes/logger");

      const config = new Config();
      const logger = new Logger(config);

      // Should not throw for any log level
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
