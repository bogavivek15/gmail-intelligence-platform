import env from '../config/env.js';
import { parseJsonWithRepair } from '../utils/jsonRepair.js';
import { insertAiRun } from './supabase.service.js';

export async function generateNimJson({
  userId,
  feature,
  prompt,
  promptVersion,
  temperature = 0.1
}) {
  const startedAt = Date.now();
  const baseUrl = env.NVIDIA_NIM_BASE_URL.replace(/\/$/, '').replace(/\/v1$/, '');
  const url = `${baseUrl}/v1/chat/completions`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.NVIDIA_NIM_API_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: env.NVIDIA_NIM_MODEL,
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Return strict JSON only. Do not include markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      const message = payload.error?.message || payload.detail || 'NVIDIA NIM request failed';
      const error = new Error(message);
      error.statusCode = 502;
      error.code = 'NIM_GENERATION_FAILED';
      throw error;
    }

    const text = payload.choices?.[0]?.message?.content;
    const parsed = parseJsonWithRepair(text);

    await safeInsertAiRun(userId, {
      feature,
      modelUsed: env.NVIDIA_NIM_MODEL,
      promptVersion,
      latencyMs: Date.now() - startedAt,
      status: 'success'
    });

    return {
      data: parsed,
      modelUsed: env.NVIDIA_NIM_MODEL
    };
  } catch (error) {
    await safeInsertAiRun(userId, {
      feature,
      modelUsed: env.NVIDIA_NIM_MODEL,
      promptVersion,
      latencyMs: Date.now() - startedAt,
      status: 'error',
      errorMessage: error.message
    });
    throw error;
  }
}

async function safeInsertAiRun(userId, run) {
  try {
    await insertAiRun(userId, run);
  } catch {
    // AI telemetry should not break the user-facing request.
  }
}
