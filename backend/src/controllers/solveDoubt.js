const { GoogleGenAI } = require("@google/genai");

const solveDoubt = async (req, res) => {
  try {
    // 1. Extract all the problem context sent from ChatAi.jsx
    const { message, problemTitle, description, testCases, startCode } =
      req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // 2. Initialize the AI client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 3. Construct a highly contextual prompt for the AI
    let prompt = `I am working on a coding problem. `;
    if (problemTitle) prompt += `The problem is called "${problemTitle}".\n`;
    if (description) prompt += `Description: ${description}\n`;

    // Convert the arrays to strings so Gemini can actually read them
    if (startCode) prompt += `Starter Code: ${JSON.stringify(startCode)}\n`;
    if (testCases)
      prompt += `Example Test Cases: ${JSON.stringify(testCases)}\n`;

    prompt += `\nMy question/message is: ${message}`;

    // 4. Call the Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an expert coding instructor. Only answer coding, algorithm, and programming related questions. Instead of just giving the final code, try to explain concepts, mention time/space complexity, and provide hints to help the student learn.",
      },
    });

    // 5. Send the text back to the frontend in a JSON object
    res.status(200).json({ message: response.text });
  } catch (error) {
    console.error("AI Chat Error:", error);
    // MUST send a response so the frontend loader stops spinning
    res.status(500).json({
      message:
        "Failed to connect to the AI assistant. The servers might be busy.",
    });
  }
};

module.exports = solveDoubt;
