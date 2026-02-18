import { memo } from "react";
import { Box, Text } from "ink";
import { applyHorizontalScroll } from "../utils/markdown.js";

export type MessageRole = "user" | "assistant" | "system";

export interface MessageData {
  role: MessageRole;
  content: string;
  rendered: string;
  timestamp: string;
}

interface MessageProps extends MessageData {
  scrollX?: number;
  viewportWidth?: number;
}

export const Message = memo(function Message({
  role,
  rendered,
  timestamp,
  scrollX = 0,
  viewportWidth = Infinity,
}: MessageProps) {
  const color =
    role === "user" ? "green" : role === "system" ? "gray" : "white";

  const display = applyHorizontalScroll(rendered, scrollX, viewportWidth);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text dimColor>
        {applyHorizontalScroll(timestamp, scrollX, viewportWidth)}
      </Text>
      {role === "assistant" ? (
        <Text>{display}</Text>
      ) : (
        <Text color={color}>{display}</Text>
      )}
    </Box>
  );
});
