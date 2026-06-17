import { getSuggestedQuestions } from "../services/geminiService.js";

describe("chatbot helpers", () => {
  test("suggests questions from top category", () => {
    const questions = getSuggestedQuestions({ breakdown: { waste: 80, food: 20 } });

    expect(questions[0]).toContain("waste");
  });

  test("suggests default questions when no activity exists", () => {
    const questions = getSuggestedQuestions({ breakdown: {} });

    expect(questions).toHaveLength(4);
  });
});
