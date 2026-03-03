import { describe, it, expect } from "vitest";

describe("Groq API Integration", () => {
  it("should validate Groq API key is set", () => {
    const apiKey = process.env.GROQ_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();
    expect(apiKey).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  it("should be able to make a test request to Groq API", async () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY not set");
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    } catch (error) {
      throw new Error(`Failed to validate Groq API key: ${error}`);
    }
  });
});
