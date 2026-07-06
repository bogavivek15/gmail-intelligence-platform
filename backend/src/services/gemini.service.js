import env from '../config/env.js';
import { parseJsonWithRepair } from '../utils/jsonRepair.js';
import { insertAiRun } from './supabase.service.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export async function generateGeminiJson({
  userId,
  feature,
  prompt,
  promptVersion,
  temperature = 0.2
}) {
  const startedAt = Date.now();

  try {
    const text = await generateContent(prompt, {
      model: env.GEMINI_MODEL,
      temperature,
      responseMimeType: 'application/json'
    });

    const parsed = parseJsonWithRepair(text);
    await safeInsertAiRun(userId, {
      feature,
      modelUsed: env.GEMINI_MODEL,
      promptVersion,
      latencyMs: Date.now() - startedAt,
      status: 'success'
    });

    return {
      data: parsed,
      modelUsed: env.GEMINI_MODEL
    };
  } catch (error) {
    await safeInsertAiRun(userId, {
      feature,
      modelUsed: env.GEMINI_MODEL,
      promptVersion,
      latencyMs: Date.now() - startedAt,
      status: 'error',
      errorMessage: error.message
    });
    throw error;
  }
}

export async function generateContent(prompt, options = {}) {
  const model = options.model || env.GEMINI_MODEL;
  const response = await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        responseMimeType: options.responseMimeType
      }
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload.error?.message || 'Gemini generation failed';
    const error = new Error(message);
    error.statusCode = 502;
    error.code = 'GEMINI_GENERATION_FAILED';
    throw error;
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}

export async function embedText(text, taskType = 'RETRIEVAL_DOCUMENT') {
  const response = await fetch(
    `${GEMINI_API_BASE}/models/${env.GEMINI_EMBEDDING_MODEL}:embedContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: `models/${env.GEMINI_EMBEDDING_MODEL}`,
        content: {
          parts: [{ text }]
        },
        taskType,
        outputDimensionality: env.GEMINI_EMBEDDING_DIMENSION
      })
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    const message = payload.error?.message || 'Gemini embedding failed';
    const error = new Error(message);
    error.statusCode = 502;
    error.code = 'GEMINI_EMBEDDING_FAILED';
    throw error;
  }

  const values = payload.embedding?.values;

  if (!Array.isArray(values) || values.length !== env.GEMINI_EMBEDDING_DIMENSION) {
    throw new Error(`Gemini embedding dimension mismatch: expected ${env.GEMINI_EMBEDDING_DIMENSION}`);
  }

  return values;
}

async function safeInsertAiRun(userId, run) {
  try {
    await insertAiRun(userId, run);
  } catch {
    // AI telemetry should not break the user-facing request.
  }
}

