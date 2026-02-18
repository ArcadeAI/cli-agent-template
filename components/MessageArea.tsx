import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { Message, type MessageData } from "./Message.js";

interface MessageAreaProps {
  messages: MessageData[];
  streamingText: string;
  isStreaming: boolean;
  toolCallCount: number;
  startTime: number | null;
}

export function MessageArea({
  messages,
  streamingText,
  isStreaming,
  toolCallCount,
  startTime,
}: MessageAreaProps) {
  return (
    <Box flexDirection="column">
      {messages.map((msg, i) => (
        <Message key={i} {...msg} />
      ))}

      {isStreaming && (
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color="cyan">
              <Spinner type="dots" />{" "}
            </Text>
            <Text dimColor>
              Thinking...
              {startTime &&
                ` 🕝 ${Math.round((Date.now() - startTime) / 1000)}s`}
              {toolCallCount > 0 &&
                ` | 🛠️ ${toolCallCount} tool call${toolCallCount > 1 ? "s" : ""}`}
            </Text>
          </Box>
          {streamingText && <Text>{streamingText}</Text>}
        </Box>
      )}
    </Box>
  );
}
