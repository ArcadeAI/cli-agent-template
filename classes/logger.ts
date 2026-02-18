import { EventEmitter } from "events";
import type { Config } from "./config";

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogEvent {
  level: LogLevel;
  message: string;
  timestamp: string;
}

export type ToolCallStatus = "running" | "completed";

export interface ToolCallInfo {
  callId: string;
  name: string;
  args: string;
  status: ToolCallStatus;
  startedAt: number;
  duration?: number;
}

export class Logger extends EventEmitter {
  private level: LogLevel;
  private color: boolean;
  private includeTimestamps: boolean;

  constructor(config: Config) {
    super();
    this.includeTimestamps = config.log_timestamps;
    this.level = config.log_level;
    this.color = config.log_color;
  }

  public getTimestamp() {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return this.includeTimestamps ? `[${timestamp}]` : "";
  }

  private shouldSkip(level: LogLevel) {
    return (
      (this.level === LogLevel.ERROR && level !== LogLevel.ERROR) ||
      (this.level === LogLevel.WARN &&
        (level === LogLevel.INFO || level === LogLevel.DEBUG)) ||
      (this.level === LogLevel.INFO && level === LogLevel.DEBUG)
    );
  }

  private log(message: string, level: LogLevel) {
    if (this.shouldSkip(level)) return;
    const event: LogEvent = {
      level,
      message,
      timestamp: this.getTimestamp(),
    };
    this.emit("log", event);
  }

  info(message: string | undefined) {
    if (!message) return;
    this.log(message, LogLevel.INFO);
  }

  warn(message: string | undefined) {
    if (!message) return;
    this.log(message, LogLevel.WARN);
  }

  error(message: string | undefined) {
    if (!message) return;
    this.log(message, LogLevel.ERROR);
  }

  debug(message: string | undefined) {
    if (!message) return;
    this.log(message, LogLevel.DEBUG);
  }

  toolCallStarted(callId: string, name: string, args: string) {
    const info: ToolCallInfo = {
      callId,
      name,
      args,
      status: "running",
      startedAt: Date.now(),
    };
    this.emit("toolCallUpdate", info);
  }

  toolCallCompleted(callId: string, name: string) {
    const info: ToolCallInfo = {
      callId,
      name,
      args: "",
      status: "completed",
      startedAt: 0,
    };
    this.emit("toolCallUpdate", info);
  }

  onLog(callback: (event: LogEvent) => void) {
    this.on("log", callback);
    return () => this.off("log", callback);
  }

  onToolCallUpdate(callback: (info: ToolCallInfo) => void) {
    this.on("toolCallUpdate", callback);
    return () => this.off("toolCallUpdate", callback);
  }
}
