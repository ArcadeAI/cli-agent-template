import { Box, Static, Text } from "ink";
import type { BoxStyle } from "cli-boxes";
import Spinner from "ink-spinner";
import type { MessageData } from "./Message.js";
import type { ToolCallInfo } from "../classes/logger.js";
import { renderMarkdown, applyHorizontalScroll } from "../utils/markdown.js";

const dashedBorder: BoxStyle = {
  topLeft: "┌",
  top: "╌",
  topRight: "┐",
  right: "╎",
  bottomRight: "┘",
  bottom: "╌",
  bottomLeft: "└",
  left: "╎",
};

function ToolCallTree({ toolCalls }: { toolCalls: ToolCallInfo[] }) {
  if (toolCalls.length === 0) return null;
  return (
    <Box flexDirection="column">
      <Text dimColor>🛠️ Tool calls:</Text>
      <Box flexDirection="column" marginLeft={2}>
        {toolCalls.map((tc, i) => {
          const isLast = i === toolCalls.length - 1;
          const prefix = isLast ? "└─" : "├─";
          const truncatedArgs =
            tc.args.length > 80 ? tc.args.slice(0, 80) + "…" : tc.args;
          return (
            <Box key={tc.callId || i} flexDirection="column">
              {tc.status === "running" ? (
                <Text color="yellow">
                  {prefix} ⏳ {tc.name}({truncatedArgs})
                </Text>
              ) : (
                <Text color="green">
                  {prefix} ✓ {tc.name}({truncatedArgs}) (
                  {(tc.duration! / 1000).toFixed(1)}s)
                </Text>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

interface MessageAreaProps {
  messages: MessageData[];
  streamingText: string;
  isStreaming: boolean;
  toolCalls: ToolCallInfo[];
  startTime: number | null;
  scrollX: number;
  scrollY: number;
  focused: boolean;
  viewportWidth: number;
  viewportHeight: number;
  lastAssistantRendered: string;
}

export function MessageArea({
  messages,
  streamingText,
  isStreaming,
  toolCalls,
  startTime,
  scrollX,
  scrollY,
  focused,
  viewportWidth,
  viewportHeight,
  lastAssistantRendered,
}: MessageAreaProps) {
  // Build a clipped viewport of the last assistant message for scroll mode
  let scrollViewport = "";
  if (focused && lastAssistantRendered) {
    const lines = lastAssistantRendered.split("\n");
    const visibleLines = lines.slice(scrollY, scrollY + viewportHeight);
    scrollViewport = applyHorizontalScroll(
      visibleLines.join("\n"),
      scrollX,
      viewportWidth,
    );
  }

  const showDynamicArea = focused || isStreaming;

  return (
    <>
      <Static items={messages}>
        {(msg, i) => (
          <Box key={`msg-${i}`} flexDirection="column" marginBottom={1}>
            <Text dimColor>{msg.timestamp}</Text>
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <Box marginBottom={1}>
                <ToolCallTree toolCalls={msg.toolCalls} />
              </Box>
            )}
            {msg.role === "assistant" ? (
              <Text>{msg.rendered}</Text>
            ) : (
              <Text color={msg.role === "user" ? "green" : "gray"}>
                {msg.rendered}
              </Text>
            )}
          </Box>
        )}
      </Static>

      {showDynamicArea && (
        <Box
          flexDirection="column"
          borderStyle={focused ? "round" : dashedBorder}
          borderColor={focused ? "yellow" : "gray"}
          paddingX={1}
        >
          {focused && scrollViewport && <Text>{scrollViewport}</Text>}

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
                  {" | "}
                </Text>
                <Text color="yellow" dimColor>
                  [esc] to cancel
                </Text>
              </Box>
              <ToolCallTree toolCalls={toolCalls} />
              {streamingText && (
                <Box marginTop={toolCalls.length > 0 ? 1 : 0}>
                  <Text>{renderMarkdown(streamingText)}</Text>
                </Box>
              )}
            </Box>
          )}

          {focused && (
            <Text color="yellow">
              ↑↓ ← → to scroll
              {scrollX > 0 || scrollY > 0
                ? ` (x:${scrollX} y:${scrollY})`
                : ""}{" "}
              | Tab to return to input
            </Text>
          )}
        </Box>
      )}
    </>
  );
}
