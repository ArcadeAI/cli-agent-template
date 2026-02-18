import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Box, useApp, useStdout } from "ink";
import type { MCPServerStreamableHttp } from "@openai/agents";
import type { GeneralAgent } from "../agents/general.js";
import type { Logger, LogEvent } from "../classes/logger.js";
import type { Config } from "../classes/config.js";
import { renderMarkdown } from "../utils/markdown.js";
import { MessageArea } from "./MessageArea.js";
import { InputBox } from "./InputBox.js";
import type { MessageData } from "./Message.js";

type FocusArea = "input" | "messages";

const SCROLL_STEP = 4;

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
  const { stdout } = useStdout();
  const welcomeMsg =
    "Ready! Type a message to chat. Press Tab to scroll wide content with ← →.";
  const [messages, setMessages] = useState<MessageData[]>([
    {
      role: "system",
      content: welcomeMsg,
      rendered: welcomeMsg,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCallCount, setToolCallCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const processingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const initialProcessed = useRef(false);
  const [focusArea, setFocusArea] = useState<FocusArea>("input");
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Subtract 4 for MessageArea border (2) + paddingX (2)
  const viewportWidth = (stdout?.columns || 80) - 4;
  // Leave room for input box (~5 lines) + border (2) + padding (2)
  const viewportHeight = (stdout?.rows || 24) - 9;

  // Derive the last assistant message's rendered content for scroll viewport
  const lastAssistantRendered = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i].rendered;
    }
    return "";
  }, [messages]);

  const handleToggleFocus = useCallback(() => {
    setFocusArea((prev) => {
      if (prev === "input") {
        setScrollX(0);
        setScrollY(0);
        return "messages";
      }
      return "input";
    });
  }, []);

  const handleScroll = useCallback((direction: "left" | "right") => {
    if (direction === "left") {
      setScrollX((prev) => Math.max(0, prev - SCROLL_STEP));
    } else {
      setScrollX((prev) => prev + SCROLL_STEP);
    }
  }, []);

  const handleScrollVertical = useCallback(
    (direction: "up" | "down") => {
      if (direction === "up") {
        setScrollY((prev) => Math.max(0, prev - SCROLL_STEP));
      } else {
        const maxY = Math.max(
          0,
          lastAssistantRendered.split("\n").length - viewportHeight,
        );
        setScrollY((prev) => Math.min(maxY, prev + SCROLL_STEP));
      }
    },
    [lastAssistantRendered, viewportHeight],
  );

  const handleReturnToInput = useCallback(() => {
    setFocusArea("input");
  }, []);

  // Subscribe to logger events
  useEffect(() => {
    const unsubLog = logger.onLog((event: LogEvent) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: event.message,
          rendered: event.message,
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
          rendered: `?> ${input}`,
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
            rendered: renderMarkdown(content),
            timestamp: logger.getTimestamp(),
          },
        ]);
      } catch (err) {
        const errMsg = `Error: ${err instanceof Error ? err.message : String(err)}`;
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: errMsg,
            rendered: errMsg,
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
            rendered: "Conversation history cleared!",
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
        scrollX={scrollX}
        scrollY={scrollY}
        focused={focusArea === "messages"}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        lastAssistantRendered={lastAssistantRendered}
      />
      <InputBox
        onSubmit={handleSubmit}
        contextDir={config.context_dir}
        queueCount={queueCount}
        focus={focusArea === "input"}
        onToggleFocus={handleToggleFocus}
        onScroll={handleScroll}
        onScrollVertical={handleScrollVertical}
        onReturnToInput={handleReturnToInput}
      />
    </Box>
  );
}
