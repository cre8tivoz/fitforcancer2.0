import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── MarkdownMessage smoke test ────────────────────────────
import MarkdownMessage from "../components/MarkdownMessage";

describe("MarkdownMessage.tsx — smoke", () => {
  it("renders without crashing with plain text", () => {
    render(<MarkdownMessage content="Hello, world!" />);
    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
  });

  it("renders markdown headings", () => {
    render(<MarkdownMessage content="### Heading 3" />);
    expect(screen.getByText("Heading 3")).toBeInTheDocument();
  });
});
