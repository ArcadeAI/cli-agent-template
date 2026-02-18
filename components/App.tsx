import { useState, useEffect, useCallback, useRef } from "react";
import { Box, useApp } from "ink";
import type { MCPServerStreamableHttp } from "@openai/agents";
import type { GeneralAgent } from "../agents/general.js";
import type { Logger, LogEvent } from "../classes/logger.js";
import type { Config } from "../classes/config.js";
import { MessageArea } from "./MessageArea.js";
import { InputBox } from "./InputBox.js";
import type { MessageData } from "./Message.js";

interface AppProps {
  agent: GeneralAgent;
  mcpServer: MCPServerStreamableHttp;
  logger: Logger;
  config: Config;
  initialMessage?: string;
  onExit: () => Promise<void>;
}

export function App({
  agent,
  mcpServer,
  logger,
  config,
  initialMessage,
  onExit,
}: AppProps) {
  const { exit } = useApp();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCallCount, setToolCallCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const processingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const initialProcessed = useRef(false);

  // Subscribe to logger events
  useEffect(() => {
    const unsubLog = logger.onLog((event: LogEvent) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: event.message,
          timestamp: event.timestamp,
        },
      ]);
    });

    const unsubTool = logger.onToolCall(() => {
      setToolCallCount((prev) => prev + 1);
    });

    return () => {
      unsubLog();
      unsubTool();
    };
  }, [logger]);

  const processOne = useCallback(
    async (input: string) => {
      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: input,
          timestamp: logger.getTimestamp(),
        },
      ]);

      setIsStreaming(true);
      setStreamingText("");
      setToolCallCount(0);
      setStartTime(Date.now());

      try {
        const stream = await agent.chat(input, [mcpServer]);
        const textStream = stream.toTextStream({
          compatibleWithNodeStreams: true,
        });

        let accumulated = "";
        for await (const chunk of textStream) {
          accumulated += chunk;
          setStreamingText(accumulated);
        }

        const finalOutput = await agent.finalizeStream(stream);
        const content = finalOutput || accumulated;

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content,
            timestamp: logger.getTimestamp(),
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `Error: ${err instanceof Error ? err.message : String(err)}`,
            timestamp: logger.getTimestamp(),
          },
        ]);
      } finally {
        setIsStreaming(false);
        setStreamingText("");
        setStartTime(null);
        setToolCallCount(0);
      }
    },
    [agent, mcpServer, logger],
  );

  const drainQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const next = queueRef.current.shift()!;
      setQueueCount(queueRef.current.length);
      await processOne(next);
    }

    processingRef.current = false;
  }, [processOne]);

  const enqueueInput = useCallback(
    (input: string) => {
      queueRef.current.push(input);
      setQueueCount(queueRef.current.length);
      drainQueue();
    },
    [drainQueue],
  );

  const handleSubmit = useCallback(
    (input: string) => {
      const lower = input.toLowerCase();
      if (lower === "quit" || lower === "exit" || lower === "bye") {
        onExit().then(() => exit());
        return;
      }

      if (lower === "clear") {
        setMessages([]);
        agent.history = [];
        setMessages([
          {
            role: "system",
            content: "Conversation history cleared!",
            timestamp: logger.getTimestamp(),
          },
        ]);
        return;
      }

      enqueueInput(input);
    },
    [enqueueInput, onExit, exit, agent, logger],
  );

  // Handle initial message
  useEffect(() => {
    if (initialMessage && !initialProcessed.current) {
      initialProcessed.current = true;
      enqueueInput(initialMessage);
    }
  }, [initialMessage, enqueueInput]);

  return (
    <Box flexDirection="column">
      <MessageArea
        messages={messages}
        streamingText={streamingText}
        isStreaming={isStreaming}
        toolCallCount={toolCallCount}
        startTime={startTime}
      />
      <InputBox
        onSubmit={handleSubmit}
        contextDir={config.context_dir}
        queueCount={queueCount}
      />
    </Box>
  );
}
