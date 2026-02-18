import { Box, Static, Text } from "ink";
import type { BoxStyle } from "cli-boxes";
import Spinner from "ink-spinner";
import type { MessageData } from "./Message.js";
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

interface MessageAreaProps {
  messages: MessageData[];
  streamingText: string;
  isStreaming: boolean;
  toolCallCount: number;
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
  toolCallCount,
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
                  {toolCallCount > 0 &&
                    ` | 🛠️ ${toolCallCount} tool call${toolCallCount > 1 ? "s" : ""}`}
                  {" | "}
                </Text>
                <Text color="yellow" dimColor>
                  [esc] to cancel
                </Text>
              </Box>
              {streamingText && <Text>{renderMarkdown(streamingText)}</Text>}
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
