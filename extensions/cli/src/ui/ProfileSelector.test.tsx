import { render } from "ink-testing-library";
import React from "react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import { ProfileSelector } from "./ProfileSelector.js";

// Mock the auth module
vi.mock("../auth/workos.js", () => ({
  loadAuthConfig: vi.fn(() => ({
    userId: "test-user",
    userEmail: "tingwai@continue.dev",
    organizationId: null,
    accessToken: "test-token",
  })),
  isAuthenticatedConfig: vi.fn(() => true),
  getAccessToken: vi.fn(() => "test-token"),
  getOrganizationId: vi.fn(() => null),
  listUserOrganizations: vi.fn(() => Promise.resolve([
    { id: "org-1", name: "Continue", slug: "continue" },
  ])),
  saveAuthConfig: vi.fn(),
  logout: vi.fn(),
}));

// Mock the config module
vi.mock("../config.js", () => ({
  getApiClient: vi.fn(() => ({
    listAssistants: vi.fn(() => Promise.resolve([
      { ownerSlug: "user", packageSlug: "simple" },
    ])),
  })),
}));

describe("ProfileSelector", () => {
  const mockOnSelect = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    const { lastFrame } = render(
      <ProfileSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />
    );

    expect(lastFrame()).toContain("Loading profile...");
  });

  it("displays user email in header", async () => {
    const { lastFrame, rerender } = render(
      <ProfileSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />
    );

    // Wait for async loading to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    rerender(<ProfileSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

    expect(lastFrame()).toContain("tingwai@continue.dev");
  });

  it("shows organization options with personal and continue", async () => {
    const { lastFrame, rerender } = render(
      <ProfileSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />
    );

    // Wait for async loading to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    rerender(<ProfileSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

    const frame = lastFrame();
    expect(frame).toContain("Organization");
    expect(frame).toContain("Personal");
    expect(frame).toContain("Continue");
  });

  it("shows assistant management section", async () => {
    const { lastFrame, rerender } = render(
      <ProfileSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />
    );

    // Wait for async loading to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    rerender(<ProfileSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

    const frame = lastFrame();
    expect(frame).toContain("Assistants");
    expect(frame).toContain("user/simple");
    expect(frame).toContain("+ New Assistant");
    expect(frame).toContain("Reload assistants");
  });

  it("shows log out option", async () => {
    const { lastFrame, rerender } = render(
      <ProfileSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />
    );

    // Wait for async loading to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    rerender(<ProfileSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

    expect(lastFrame()).toContain("Log out");
  });

  it("displays keyboard shortcut hint", async () => {
    const { lastFrame, rerender } = render(
      <ProfileSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />
    );

    // Wait for async loading to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    rerender(<ProfileSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

    expect(lastFrame()).toContain("⌘A to toggle assistant");
  });
});