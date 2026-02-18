import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";
import sliceAnsi from "slice-ansi";

const marker = new Marked(
  markedTerminal({
    width: 9999,
    reflowText: false,
    tab: 2,
  }),
);

export function renderMarkdown(text: string, columns?: number): string {
  if (columns) {
    const custom = new Marked(
      markedTerminal({
        width: columns,
        reflowText: true,
        tab: 2,
      }),
    );
    return (custom.parse(text) as string).trimEnd();
  }
  return (marker.parse(text) as string).trimEnd();
}

export function applyHorizontalScroll(
  text: string,
  scrollX: number,
  viewportWidth: number,
): string {
  if (scrollX === 0 && viewportWidth === Infinity) return text;
  return text
    .split("\n")
    .map((line) => sliceAnsi(line, scrollX, scrollX + viewportWidth))
    .join("\n");
}
