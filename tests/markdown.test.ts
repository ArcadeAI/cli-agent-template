import { describe, it, expect } from "bun:test";
import { renderMarkdown, applyHorizontalScroll } from "../utils/markdown.js";

describe("renderMarkdown", () => {
  it("renders bold text", () => {
    const result = renderMarkdown("**bold**");
    expect(result).toContain("bold");
    expect(result).not.toContain("**");
  });

  it("renders inline code", () => {
    const result = renderMarkdown("use `console.log`");
    expect(result).toContain("console.log");
  });

  it("renders code blocks", () => {
    const result = renderMarkdown("```\nconst x = 1;\n```");
    expect(result).toContain("const x = 1");
  });

  it("renders tables", () => {
    const result = renderMarkdown("| A | B |\n|---|---|\n| 1 | 2 |");
    expect(result).toContain("A");
    expect(result).toContain("B");
    expect(result).toContain("1");
    expect(result).toContain("2");
  });

  it("trims trailing newlines", () => {
    const result = renderMarkdown("hello");
    expect(result).not.toMatch(/\n$/);
  });

  it("accepts a custom column width", () => {
    const result = renderMarkdown("hello world", 40);
    expect(result).toContain("hello world");
  });
});

describe("applyHorizontalScroll", () => {
  it("returns text unchanged when scrollX is 0 and viewport is Infinity", () => {
    const text = "hello world";
    expect(applyHorizontalScroll(text, 0, Infinity)).toBe(text);
  });

  it("slices each line by scrollX", () => {
    const text = "abcdefghij\n0123456789";
    const result = applyHorizontalScroll(text, 3, 4);
    expect(result).toBe("defg\n3456");
  });

  it("handles scrollX beyond line length", () => {
    const result = applyHorizontalScroll("short", 10, 20);
    expect(result).toBe("");
  });

  it("handles multi-line text with varying lengths", () => {
    const text = "long line here\nhi";
    const result = applyHorizontalScroll(text, 2, 5);
    const lines = result.split("\n");
    expect(lines[0]).toBe("ng li");
    expect(lines[1]).toBe("");
  });
});
