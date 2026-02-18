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

  incrementToolCalls() {
    this.emit("toolCall");
  }

  onLog(callback: (event: LogEvent) => void) {
    this.on("log", callback);
    return () => this.off("log", callback);
  }

  onToolCall(callback: () => void) {
    this.on("toolCall", callback);
    return () => this.off("toolCall", callback);
  }
}
