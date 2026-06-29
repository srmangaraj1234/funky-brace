// Gemini AI Integration Service
// Initializes GoogleGenAI and formats structured prompts for issue analysis

import { GoogleGenAI } from '@google/genai';

let ai = null;

/**
 * Returns the initialized Gemini client.
 * Performs a fast-fail check if the API key is not configured.
 */
function getAIClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please define it in your environment or Settings > Secrets.');
  }

  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

/**
 * Validates the parsed AI response to ensure it strictly conforms to our required schema.
 * Throws a controlled error if any validation check fails.
 */
function validateAIResponse(parsed) {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('AI response is not a valid JSON object');
  }

  // Type and existence checks
  if (typeof parsed.isAppropriate !== 'boolean') {
    throw new Error('AI response is missing or has invalid "isAppropriate" boolean field');
  }
  if (typeof parsed.title !== 'string' || !parsed.title.trim()) {
    throw new Error('AI response is missing or has invalid "title" string field');
  }
  if (typeof parsed.description !== 'string' || !parsed.description.trim()) {
    throw new Error('AI response is missing or has invalid "description" string field');
  }
  if (typeof parsed.category !== 'string' || !parsed.category.trim()) {
    throw new Error('AI response is missing or has invalid "category" string field');
  }
  if (typeof parsed.severity !== 'string' || !parsed.severity.trim()) {
    throw new Error('AI response is missing or has invalid "severity" string field');
  }

  // Enum value checks
  const validCategories = ['Potholes', 'Streetlight Non-Functional', 'Water Leak', 'Others'];
  const validSeverities = ['low', 'medium', 'high'];

  if (!validCategories.includes(parsed.category)) {
    throw new Error(`AI response contains unsupported category: "${parsed.category}"`);
  }
  if (!validSeverities.includes(parsed.severity)) {
    throw new Error(`AI response contains unsupported severity: "${parsed.severity}"`);
  }

  return true;
}

/**
 * Analyzes an uploaded civic issue image using Google's stable production Gemini models.
 * Includes auto-fallback, transient retry logic with rate-limit handling, timeout protection, and response validation.
 */
export async function analyzeImage(fileBuffer, mimeType) {
  const client = getAIClient();

  // Normalize MIME type to standard formats supported by Gemini
  let normalizedMimeType = mimeType || 'image/jpeg';
  if (normalizedMimeType.toLowerCase() === 'image/jpg') {
    normalizedMimeType = 'image/jpeg';
  }

  const prompt = "Analyze this image and identify if it shows a genuine civic or city infrastructure issue (like potholes, non-functional streetlights, water leaks, broken pipes, damaged footpaths, garbage accumulation, or others). Determine if it is appropriate for public reporting (free of offensive content, spam, or safety/privacy violations). Suppress unsafe or irrelevant images by marking isAppropriate to false. Extract the title (maximum 6 words), description, standard category ('Potholes', 'Streetlight Non-Functional', 'Water Leak', 'Others'), and estimated severity ('low', 'medium', 'high').";

  const imagePart = {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType: normalizedMimeType
    }
  };

  const textPart = {
    text: prompt
  };

  const payload = {
    contents: {
      parts: [imagePart, textPart]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          isAppropriate: {
            type: "BOOLEAN",
            description: "True if image is a genuine civic/infrastructure issue suitable for public display. False if offensive, spam, fake, or completely unrelated."
          },
          title: {
            type: "STRING",
            description: "Short, clear title describing the issue (max 6 words)."
          },
          description: {
            type: "STRING",
            description: "A detailed, structured description of the observed issue based on the visual contents."
          },
          category: {
            type: "STRING",
            enum: ['Potholes', 'Streetlight Non-Functional', 'Water Leak', 'Others'],
            description: "The best match category for this issue."
          },
          severity: {
            type: "STRING",
            enum: ['low', 'medium', 'high'],
            description: "Estimated level of urgency / public danger."
          }
        },
        required: ["isAppropriate", "title", "description", "category", "severity"]
      }
    }
  };

  // Prioritize stable production models (gemini-2.5-flash as the primary)
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro"];
  let lastError = null;

  for (const model of modelsToTry) {
    let attempts = 3;
    let delay = 1500; // slightly increased initial delay for stable recovery

    for (let attempt = 1; attempt <= attempts; attempt++) {
      const controller = new AbortController();
      const timeoutMs = 30000; // 30 seconds request timeout limit

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      try {
        console.log(`Invoking ${model} model for multimodal analysis (Attempt ${attempt}/${attempts})...`);
        
        // Wrap request in a Promise.race to guarantee we timeout correctly
        const response = await Promise.race([
          client.models.generateContent({
            model,
            ...payload
          }),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`AI request timed out after ${timeoutMs / 1000} seconds`));
            }, timeoutMs);
          })
        ]);

        let rawText = response.text;
        if (!rawText) {
          throw new Error('Empty response received from Gemini API');
        }

        // Handle markdown code block wrapper robustly
        rawText = rawText.trim();
        if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
        }

        const parsed = JSON.parse(rawText);

        // Perform strict schema validation on AI output before returning it
        validateAIResponse(parsed);

        console.log(`Gemini Analysis result obtained and validated successfully using ${model} on attempt ${attempt}.`);
        return parsed;
      } catch (err) {
        lastError = err;
        const errMsg = typeof err === 'object' && err !== null ? (err.message || JSON.stringify(err)) : String(err);
        
        // Extended transient error check including rate limits (429, RESOURCE_EXHAUSTED)
        const isTransient = errMsg.includes('503') || 
                            errMsg.includes('500') || 
                            errMsg.includes('429') ||
                            errMsg.toUpperCase().includes('RESOURCE_EXHAUSTED') ||
                            errMsg.includes('UNAVAILABLE') || 
                            errMsg.includes('high demand') || 
                            errMsg.includes('temporary') || 
                            errMsg.includes('overloaded') ||
                            errMsg.includes('rate limit') ||
                            errMsg.includes('timeout');

        if (isTransient && attempt < attempts) {
          console.warn(`Transient/Rate-limit error calling ${model}: ${errMsg}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          console.warn(`Failed with model ${model} on attempt ${attempt}:`, errMsg);
          break; // Break attempt loop to move to next model in the fallback chain
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || JSON.stringify(lastError) || lastError}`);
}
