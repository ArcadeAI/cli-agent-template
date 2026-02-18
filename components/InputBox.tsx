import { useState, useCallback, useRef } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "./TextInput.js";
import * as fs from "fs";
import * as path from "path";

interface InputBoxProps {
  onSubmit: (input: string) => void;
  contextDir: string;
  queueCount: number;
  focus: boolean;
  isStreaming: boolean;
  onToggleFocus: () => void;
  onScroll: (direction: "left" | "right") => void;
  onScrollVertical: (direction: "up" | "down") => void;
  onReturnToInput: () => void;
  onCancel: () => void;
}

const DELIM = "\0";

function loadHistory(historyFile: string): string[] {
  try {
    const content = fs.readFileSync(historyFile, "utf-8");
    return content.split(DELIM).filter((entry) => entry.length > 0);
  } catch {
    return [];
  }
}

function saveToHistory(historyFile: string, entry: string) {
  fs.mkdirSync(path.dirname(historyFile), { recursive: true });
  fs.appendFileSync(historyFile, entry + DELIM);
}

export function InputBox({
  onSubmit,
  contextDir,
  queueCount,
  focus,
  isStreaming,
  onToggleFocus,
  onScroll,
  onScrollVertical,
  onReturnToInput,
  onCancel,
}: InputBoxProps) {
  const [value, setValue] = useState("");
  const historyFile = path.join(contextDir, "chat_history.txt");
  const historyRef = useRef<string[]>(loadHistory(historyFile));
  const indexRef = useRef(-1);
  const draftRef = useRef("");

  const handleSubmit = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      historyRef.current.push(trimmed);
      saveToHistory(historyFile, trimmed);
      indexRef.current = -1;
      draftRef.current = "";
      setValue("");
      onSubmit(trimmed);
    },
    [onSubmit, historyFile],
  );

  useInput((input, key) => {
    if (key.escape && isStreaming) {
      onCancel();
      return;
    }

    if (key.tab) {
      onToggleFocus();
      return;
    }

    if (!focus) {
      // In scroll mode: arrows scroll, printable chars return to input
      if (key.upArrow) {
        onScrollVertical("up");
      } else if (key.downArrow) {
        onScrollVertical("down");
      } else if (key.leftArrow) {
        onScroll("left");
      } else if (key.rightArrow) {
        onScroll("right");
      } else if (input && !key.ctrl && !key.meta) {
        onReturnToInput();
      }
      return;
    }

    // In input mode: up/down for history
    const history = historyRef.current;
    if (key.upArrow && history.length > 0) {
      if (indexRef.current === -1) {
        draftRef.current = value;
        indexRef.current = history.length - 1;
      } else if (indexRef.current > 0) {
        indexRef.current--;
      }
      setValue(history[indexRef.current] ?? "");
    } else if (key.downArrow) {
      if (indexRef.current === -1) return;
      if (indexRef.current < history.length - 1) {
        indexRef.current++;
        setValue(history[indexRef.current] ?? "");
      } else {
        indexRef.current = -1;
        setValue(draftRef.current);
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Box
        borderStyle="round"
        borderColor={focus ? "green" : "gray"}
        paddingX={1}
      >
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          focus={focus}
          showCursor={true}
          placeholder="Type your message..."
        />
      </Box>
      {queueCount > 0 && (
        <Text dimColor>
          {" "}
          {queueCount} message{queueCount > 1 ? "s" : ""} queued
        </Text>
      )}
    </Box>
  );
}
