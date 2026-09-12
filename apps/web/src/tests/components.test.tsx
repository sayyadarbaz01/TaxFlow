import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Input } from "../components/ui/Input";

describe("Web UI Components Suite", () => {
  it("renders Button correctly with text", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("renders StatusBadge with success variant", () => {
    render(<StatusBadge status="FILED" />);
    expect(screen.getByText("FILED")).toBeInTheDocument();
  });

  it("renders Input component with label", () => {
    render(<Input label="Email Address" placeholder="test@example.com" />);
    expect(screen.getByText("Email Address")).toBeInTheDocument();
  });
});
