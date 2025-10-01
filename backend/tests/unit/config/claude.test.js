import { jest } from "@jest/globals";
import { claude, generateQuizQuestions } from "../../../src/config/claude.js";

describe("generateQuizQuestions", () => {
  beforeEach(() => {
    claude.messages = { create: jest.fn() };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("throws when topic is missing", async () => {
    await expect(generateQuizQuestions({ topic: "" })).rejects.toThrow(
      "Topic is required for quiz generation."
    );
  });

  it("parses fenced JSON responses and normalizes data", async () => {
    const sampleQuestions = [
      {
        id: "q1",
        question: "What is 2 + 2?",
        type: "mcq",
        difficulty: "easy",
        options: ["3", "4", "5"],
        answer: "4",
        explanation: "Basic addition",
        tags: ["math"],
      },
    ];
    const textBlock = ["```json", JSON.stringify(sampleQuestions, null, 2), "```"].join(
      "\n"
    );

    claude.messages.create.mockResolvedValue({
      content: [
        {
          type: "text",
          text: textBlock,
        },
      ],
    });

    const questions = await generateQuizQuestions({
      topic: "Math",
      count: 1,
      difficulty: "easy",
    });

    expect(claude.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
      })
    );
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject(sampleQuestions[0]);
  });

  it("throws when Claude response misses required fields", async () => {
    claude.messages.create.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify([
            {
              id: "q1",
              type: "mcq",
              difficulty: "easy",
              options: ["A", "B"],
              answer: "A",
              explanation: "",
              tags: [],
            },
          ]),
        },
      ],
    });

    await expect(
      generateQuizQuestions({ topic: "History", count: 1 })
    ).rejects.toThrow("Question q1 missing required fields.");
  });
});
