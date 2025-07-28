import { describe, it, expect } from "bun:test";
import { $ } from "bun";

describe("CLI Commands", () => {
  // Helper function to run CLI commands using Bun's $ executor
  const runCommand = async (args: string[]) => {
    try {
      const { stdout, stderr, exitCode } = await $`bun agent.ts ${args}`;
      return {
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode
      };
    } catch (error: any) {
      // Handle ShellError when command fails
      return {
        stdout: error.stdout?.toString() || "",
        stderr: error.stderr?.toString() || "",
        exitCode: error.exitCode || 1
      };
    }
  };

  describe("version command", () => {
    it("should display version information", async () => {
      const result = await runCommand(["--version"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("0.0.1");
      expect(result.stderr).toBe("");
    });

    it("should display version information with -V flag", async () => {
      const result = await runCommand(["-V"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("0.0.1");
      expect(result.stderr).toBe("");
    });
  });

  describe("help command", () => {
    it("should display help information", async () => {
      const result = await runCommand(["--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("email-agent-template");
      expect(result.stdout).toContain("Email Agent Template");
      expect(result.stderr).toBe("");
    });

    it("should display help information with -h flag", async () => {
      const result = await runCommand(["-h"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("email-agent-template");
      expect(result.stdout).toContain("Email Agent Template");
      expect(result.stderr).toBe("");
    });

    it("should display help for specific commands", async () => {
      const result = await runCommand(["inbox", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("inbox");
      expect(result.stdout).toContain("Read your inbox and summarize the emails");
      expect(result.stderr).toBe("");
    });

    it("should display help for chat command", async () => {
      const result = await runCommand(["chat", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("chat");
      expect(result.stdout).toContain("Start an interactive chat session with the agent");
      expect(result.stderr).toBe("");
    });

    it("should display help for slack-summary command", async () => {
      const result = await runCommand(["slack-summary", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("slack-summary");
      expect(result.stdout).toContain("Read your inbox and summarize the emails");
      expect(result.stderr).toBe("");
    });
  });

  describe("invalid commands", () => {
    it("should show error for invalid command", async () => {
      const result = await runCommand(["invalid-command"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("error: unknown command");
    });

    it("should show error for invalid option", async () => {
      const result = await runCommand(["--invalid-option"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("error: unknown option");
    });
  });
});