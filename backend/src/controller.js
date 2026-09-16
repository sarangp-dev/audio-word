import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Active current endpoints for new API keys
const CANDIDATE_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.1-pro-preview",
    "gemini-flash-latest",
];

const uploadAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an audio file",
            });
        }

        console.log("Processing audio:", req.file.originalname);

        const audioPart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype || "audio/webm",
            },
        };

        const prompt = `
You are an audio analysis and transcription engine for school mentorship sessions.

Your job is to identify what was ACTUALLY SAID in the audio and score its prominence.

STRICT OPERATING RULES:
1. GROUNDING (NO HALLUCINATIONS):
   - You must ONLY extract words, concepts, and topics that were EXPLICITLY SPOKEN in this specific recording.
   - NEVER guess, invent, or add related words that were not spoken (for example: do NOT add "software", "code", or "computer" just because you heard the word "testing").
   - If the audio only contains 1 or 2 distinct words, return ONLY those 1 or 2 words. Do NOT attempt to reach a minimum word count.

2. NOISE & BACKGROUND FILTERING:
   - Completely ignore background noise, static, mic hums, breaths, throat clearing, and room echo.
   - Ignore unintelligible or muffled sounds.

3. STRIP FILLERS, STOPWORDS & GREETINGS:
   - Remove conversational filler: "um", "uh", "like", "you know", "right", "actually", "basically", "literally".
   - Remove grammatical stopwords: "is", "a", "the", "an", "and", "or", "to", "in", "on", "at", "this", "that", "it".
   - Remove call greetings & sign-offs: "hello", "hi", "hey", "over", "bye", "goodbye", "thank you", "thanks", "can you hear me".

4. NORMALIZATION:
   - Convert all words to lowercase.
   - Normalize plurals and tense variants to the base concept (e.g., merge "tests", "tested", "testing" into "test" or "testing").

5. PROMINENCE WEIGHTING:
   - For long recordings (up to 10 minutes), extract up to 30 of the most prominent spoken topic terms.
   - For short recordings, extract only the concepts present.
   - Assign a weight from 20 to 100 based on how central and frequently emphasized that concept was in the spoken audio.

6. EDGE CASES:
   - If the recording contains ONLY silence, background noise, or filler/greetings with no substantive content, return an empty JSON array: [].

OUTPUT FORMAT:
Return ONLY a valid JSON array matching this exact schema:
[
  {"text": "keyword", "value": 90}
]
`;

        let response = null;
        let lastError = null;

        for (const modelName of CANDIDATE_MODELS) {
            try {
                console.log(`Analyzing audio with ${modelName}...`);
                const result = await ai.models.generateContent({
                    model: modelName,
                    contents: [audioPart, { text: prompt }],
                    config: {
                        responseMimeType: "application/json",
                        temperature: 0.1,
                    },
                });

                if (result && result.text) {
                    console.log(`Successful response from ${modelName}`);
                    response = result;
                    break;
                }
            } catch (err) {
                console.warn(`Model ${modelName} issue (${err.status || err.message}). Trying next...`);
                lastError = err;
            }
        }

        if (!response || !response.text) {
            throw lastError || new Error("All AI models are currently unavailable.");
        }

        const rawJsonText = response.text.replace(/```json\n?|\n?```/g, "").trim();
        let parsedWords = [];

        try {
            parsedWords = JSON.parse(rawJsonText);
        } catch (parseError) {
            console.error("JSON parsing error on model output:", response.text);
            return res.status(500).json({
                success: false,
                message: "Failed to parse topics from AI response. Please try recording again.",
            });
        }

        if (!Array.isArray(parsedWords) || parsedWords.length === 0) {
            return res.status(422).json({
                success: false,
                message: "No distinct words or topics were detected. The audio might be silent or too noisy.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Audio analyzed successfully",
            file: {
                name: req.file.originalname,
                type: req.file.mimetype,
                size: req.file.size,
            },
            words: parsedWords,
        });

    } catch (error) {
        console.error("Audio processing/AI error:", error);

        const isRateLimited = error.status === 503 || error.status === 429;
        return res.status(error.status && error.status >= 400 && error.status < 600 ? error.status : 500).json({
            success: false,
            message: isRateLimited
                ? "The AI service is currently at peak capacity. Please wait a few seconds and retry."
                : "Failed to analyze audio. Please check your recording and try again.",
        });
    }
};

export default uploadAudio;
