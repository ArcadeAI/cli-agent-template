import { Box, Text } from "ink";

export type MessageRole = "user" | "assistant" | "system";

export interface MessageData {
  role: MessageRole;
  content: string;
  timestamp: string;
}

export function Message({ role, content, timestamp }: MessageData) {
  const color =
    role === "user" ? "green" : role === "system" ? "gray" : "white";
  const prefix = role === "user" ? "?> " : "";

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        <Text dimColor>{timestamp} </Text>
        <Text color={color}>
          {prefix}
          {content}
        </Text>
      </Text>
    </Box>
  );
}
