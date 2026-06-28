// Gemini AI Integration Service
// Initializes GoogleGenAI and formats structured prompts for issue analysis

import { GoogleGenAI } from '@google/genai';

let ai = null;

function getAIClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not defined.');
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

export async function analyzeImage(fileBuffer, mimeType) {
  const client = getAIClient();
  if (!client) {
    throw new Error('AI client could not be initialized due to missing credentials');
  }

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
            description: "The best match category for this issue. Must be one of: 'Potholes', 'Streetlight Non-Functional', 'Water Leak', 'Others'."
          },
          severity: {
            type: "STRING",
            description: "Estimated level of urgency / public danger. Must be one of: 'low', 'medium', 'high'."
          }
        },
        required: ["isAppropriate", "title", "description", "category", "severity"]
      }
    }
  };

  const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
  let lastError = null;

  for (const model of modelsToTry) {
    let attempts = 3;
    let delay = 1000;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        console.log(`Invoking ${model} model for multimodal analysis (Attempt ${attempt}/${attempts})...`);
        const response = await client.models.generateContent({
          model,
          ...payload
        });

        let rawText = response.text;
        if (!rawText) {
          throw new Error('Empty response received from Gemini API');
        }

        // Handle markdown code block wrapper robustly
        rawText = rawText.trim();
        if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
        }

        console.log(`Gemini Analysis result obtained successfully using ${model} on attempt ${attempt}.`);
        const parsed = JSON.parse(rawText);
        return parsed;
      } catch (err) {
        lastError = err;
        const errMsg = typeof err === 'object' && err !== null ? (err.message || JSON.stringify(err)) : String(err);
        const isTransient = errMsg.includes('503') || 
                            errMsg.includes('500') || 
                            errMsg.includes('UNAVAILABLE') || 
                            errMsg.includes('high demand') || 
                            errMsg.includes('temporary') || 
                            errMsg.includes('overloaded');

        if (isTransient && attempt < attempts) {
          console.warn(`Transient error calling ${model}: ${errMsg}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          console.warn(`Failed with model ${model} on attempt ${attempt}:`, errMsg);
          break; // Break current attempt loop and move to next model
        }
      }
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || JSON.stringify(lastError) || lastError}`);
}
