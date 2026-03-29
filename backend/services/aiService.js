const AI_MODEL_MAP = Object.freeze({
  gemini: [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro"
  ],
  openai: [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4.1-mini",
    "gpt-4.1"
  ],
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
  ]
});

function capitalize(text) {
  const value = String(text || "").trim();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function normalizeGeminiModel(model) {
  const value = String(model || "").trim();
  const legacyMap = {
    "gemini-1.5-flash": "gemini-2.5-flash",
    "gemini-1.5-pro": "gemini-2.5-pro",
    "gemini-1.0-pro": "gemini-2.5-flash",
    "gemini-pro": "gemini-2.5-flash"
  };

  return legacyMap[value] || value;
}

function validateAiRequest(config, prompt, options = {}) {
  const provider = String(config?.provider || "").trim().toLowerCase();
  const model = provider === "gemini"
    ? normalizeGeminiModel(config?.model)
    : String(config?.model || "").trim();
  const apiKey = String(config?.apiKey || "").trim();
  const textPrompt = String(prompt || "").trim();
  const imageDataUrl = String(options.imageDataUrl || "").trim();

  if (!provider || !model || !apiKey) {
    throw new Error("AI config is incomplete. Provider, model, and API key are required.");
  }

  if (!AI_MODEL_MAP[provider]) {
    throw new Error("Unsupported AI provider.");
  }

  if (AI_MODEL_MAP[provider].length && !AI_MODEL_MAP[provider].includes(model)) {
    throw new Error(`The selected model was not found for ${provider}. Please choose a different model.`);
  }

  if (!textPrompt) {
    throw new Error("Prompt is required.");
  }

  if (textPrompt.length > 20000) {
    throw new Error("Prompt is too large.");
  }

  if (imageDataUrl && imageDataUrl.length > 8_000_000) {
    throw new Error("Image payload is too large.");
  }

  return {
    provider,
    model,
    apiKey,
    prompt: textPrompt,
    imageDataUrl
  };
}

function extractMimeAndData(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(.*?);base64,(.*)$/);
  if (!match) return null;

  return {
    mimeType: match[1],
    data: match[2]
  };
}

function buildOpenAIContent(prompt, options = {}) {
  if (!options.imageDataUrl) return prompt;

  return [
    { type: "text", text: prompt },
    {
      type: "image_url",
      image_url: {
        url: options.imageDataUrl
      }
    }
  ];
}

function normalizeAIError(payload, status, provider) {
  const message = payload?.error?.message || payload?.message || "The AI request failed.";

  if (status === 401 || status === 403) {
    return `The ${provider} API key was rejected. Please check the key and try again.`;
  }

  if (status === 404) {
    return `The selected model was not found for ${provider}. Please choose a different model.`;
  }

  if (status === 429) {
    return `${capitalize(provider)} rate limit reached. Please wait a moment and try again.`;
  }

  return message;
}

async function callGeminiApi(config, prompt, options = {}) {
  const model = normalizeGeminiModel(config.model);
  const parts = [{ text: prompt }];
  const inlineData = options.imageDataUrl ? extractMimeAndData(options.imageDataUrl) : null;

  if (inlineData) {
    parts.push({
      inline_data: {
        mime_type: inlineData.mimeType,
        data: inlineData.data
      }
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          responseMimeType: options.expectJson ? "application/json" : "text/plain"
        }
      })
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404 && model !== "gemini-2.5-flash") {
      return callGeminiApi(
        {
          ...config,
          model: "gemini-2.5-flash"
        },
        prompt,
        options
      );
    }

    throw new Error(normalizeAIError(payload, response.status, "gemini"));
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
  if (!text.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

async function callOpenAICompatibleApi(config, prompt, provider, endpoint, options = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: options.expectJson
            ? "You are a precise study assistant. Return JSON when asked for JSON."
            : "You are a precise and helpful study assistant."
        },
        {
          role: "user",
          content: buildOpenAIContent(prompt, options)
        }
      ]
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(normalizeAIError(payload, response.status, provider));
  }

  const text = payload?.choices?.[0]?.message?.content || "";
  if (!text.trim()) {
    throw new Error(`${capitalize(provider)} returned an empty response.`);
  }

  return text;
}

async function requestAiText(config, prompt, options = {}) {
  const validated = validateAiRequest(config, prompt, options);

  try {
    if (validated.provider === "gemini") {
      return await callGeminiApi(validated, validated.prompt, options);
    }

    if (validated.provider === "openai") {
      return await callOpenAICompatibleApi(validated, validated.prompt, "openai", "https://api.openai.com/v1/chat/completions", options);
    }

    if (validated.provider === "groq") {
      return await callOpenAICompatibleApi(validated, validated.prompt, "groq", "https://api.groq.com/openai/v1/chat/completions", options);
    }

    throw new Error("Unsupported AI provider.");
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Network error while contacting the AI provider. Please check your connection.");
    }

    throw error;
  }
}

module.exports = {
  AI_MODEL_MAP,
  normalizeGeminiModel,
  requestAiText
};
