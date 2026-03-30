type MemoryPromptInput = {
  dateTaken: string;
  fallback: {
    placeDescription: string;
    romanticQuote: string;
  };
  imageBase64?: string;
  imageMimeType?: string;
  locationLabel: string;
  note: string;
  seed?: string;
  title: string;
};

type MemoryTextResult = {
  placeDescription: string;
  romanticQuote: string;
  placeLabel?: string;
};

export function getAiProviderStatus() {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return {
      label: "Gemini free vision",
      mode: "gemini" as const
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      label: "OpenAI vision",
      mode: "openai" as const
    };
  }

  return {
    label: "Local fallback quotes",
    mode: "fallback" as const
  };
}

export async function generateGhibliStyledImage(input: {
  imageBase64: string;
  imageMimeType: string;
}) {
  const apiKey = process.env.HF_TOKEN;
  const model = process.env.HF_IMAGE_MODEL ?? "fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA";

  if (!apiKey) {
    throw new Error("Hugging Face token is not configured.");
  }

  const response = await fetch(
    `https://router.huggingface.co/fal-ai/models/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: input.imageBase64,
        parameters: {
          prompt:
            "Transform this couple photo into a whimsical hand-painted Ghibli-inspired storybook frame with soft sunlight, warm earthy colors, expressive faces, gentle cinematic detail, and dreamy natural textures. Keep the same people, pose, composition, and recognizable background landmarks.",
          target_size: {
            height: 1024,
            width: 1024
          }
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      response.status === 402
        ? "Hugging Face image editing through fal-ai requires pre-paid credits on your Hugging Face account."
        : response.status === 404
          ? "This Hugging Face image-edit model is not available through the configured provider."
          : response.status === 429
            ? "Hugging Face free credits or rate limit are exhausted for this token."
            : `Hugging Face image generation failed${errorText ? `: ${errorText}` : "."}`
    );
  }

  return {
    base64: Buffer.from(await response.arrayBuffer()).toString("base64"),
    mimeType: response.headers.get("content-type") ?? "image/png"
  };
}

const memorySystemPrompt =
  "You create memory metadata for a private couples photo website. Return strict JSON with placeLabel, placeDescription, and romanticQuote. If GPS/location text is missing, infer the most likely visible place from the image itself, but stay honest and concise. Prefer specific place names only when visually justifiable; otherwise return a believable nearby-style label like 'Beachfront near Mahabalipuram' or 'Garden setting'. Make every romanticQuote unique to that exact photo and mood. Keep placeDescription under 220 characters and romanticQuote under 140 characters.";

function trimSentence(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function buildFallbackMemoryText(input: {
  dateTaken: string;
  locationLabel: string;
  note: string;
  seed?: string;
  title: string;
}) {
  const date = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long"
  }).format(new Date(input.dateTaken));
  const season = new Intl.DateTimeFormat("en-IN", {
    month: "long"
  }).format(new Date(input.dateTaken));
  const seed = hashString(
    `${input.seed ?? ""}|${input.dateTaken}|${input.locationLabel}|${input.note}|${input.title}`
  );
  const quotes = [
    "Loving you turns even an ordinary frame into something I want to remember forever.",
    "This little moment feels brighter because it carries your smile beside mine.",
    "In every photo with you, the world softens and the day feels kinder.",
    "What I see here is not just a place, but another quiet proof that we belong together.",
    "Some memories stay beautiful because your presence keeps glowing inside them.",
    "Even time seems gentle in moments like this, when I get to share life with you.",
    "If love could be framed, it would look a little like this moment with you.",
    "The best part of any view is knowing I was standing there with you."
  ];
  const moods = [
    "soft and sunlit",
    "warm and peaceful",
    "quietly joyful",
    "gentle and close",
    "playful and tender",
    "bright with affection"
  ];
  const chosenQuote = quotes[seed % quotes.length] ?? quotes[0];
  const chosenMood = moods[seed % moods.length] ?? moods[0];

  return {
    placeDescription: trimSentence(
      `Captured in ${season} on ${date}, this ${chosenMood} memory carries the feeling of ${input.locationLabel.toLowerCase()} and preserves a tender chapter from ${input.title}. ${
        input.note ? `It especially remembers: ${input.note}` : ""
      }`.trim(),
      220
    ),
    romanticQuote: trimSentence(chosenQuote, 140)
  } satisfies MemoryTextResult;
}

function parseMemoryText(payloadText: string | undefined, fallback: MemoryTextResult) {
  if (!payloadText) {
    return fallback;
  }

  const parsed = JSON.parse(payloadText) as {
    placeLabel?: string;
    placeDescription?: string;
    romanticQuote?: string;
  };

  if (!parsed.placeLabel || !parsed.placeDescription || !parsed.romanticQuote) {
    return fallback;
  }

  return {
    placeLabel: trimSentence(parsed.placeLabel, 120),
    placeDescription: trimSentence(parsed.placeDescription, 220),
    romanticQuote: trimSentence(parsed.romanticQuote, 140)
  };
}

async function buildGeminiMemoryText(input: MemoryPromptInput): Promise<MemoryTextResult | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${memorySystemPrompt}\n\nReturn only JSON.\n\n${JSON.stringify({
                    title: input.title,
                    dateTaken: input.dateTaken,
                    locationLabel: input.locationLabel,
                    note: input.note,
                    seed: input.seed
                  })}`
                },
                ...(input.imageBase64 && input.imageMimeType
                  ? [
                      {
                        inlineData: {
                          mimeType: input.imageMimeType,
                          data: input.imageBase64
                        }
                      }
                    ]
                  : [])
              ]
            }
          ],
          generationConfig: {
            temperature: 1,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                placeLabel: {
                  type: "STRING"
                },
                placeDescription: {
                  type: "STRING"
                },
                romanticQuote: {
                  type: "STRING"
                }
              },
              required: ["placeLabel", "placeDescription", "romanticQuote"]
            }
          }
        })
      }
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };
    const outputText = payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;

    return parseMemoryText(outputText, input.fallback);
  } catch {
    return null;
  }
}

async function buildOpenAiMemoryText(input: MemoryPromptInput): Promise<MemoryTextResult | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        temperature: 1,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: memorySystemPrompt
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  title: input.title,
                  dateTaken: input.dateTaken,
                  locationLabel: input.locationLabel,
                  note: input.note
                })
              },
              ...(input.imageBase64 && input.imageMimeType
                ? [
                    {
                      type: "input_image" as const,
                      image_url: `data:${input.imageMimeType};base64,${input.imageBase64}`
                    }
                  ]
                : [])
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "memory_copy",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                placeLabel: {
                  type: "string"
                },
                placeDescription: {
                  type: "string"
                },
                romanticQuote: {
                  type: "string"
                }
              },
              required: ["placeLabel", "placeDescription", "romanticQuote"]
            }
          }
        }
      })
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      output?: Array<{
        content?: Array<{
          text?: string;
          type?: string;
        }>;
      }>;
      output_text?: string;
    };
    const outputText =
      payload.output_text ??
      payload.output
        ?.flatMap((item) => item.content ?? [])
        .find((item) => typeof item.text === "string")
        ?.text;

    return parseMemoryText(outputText, input.fallback);
  } catch {
    return null;
  }
}

export async function buildAiMemoryText(input: MemoryPromptInput): Promise<MemoryTextResult> {
  const geminiResult = await buildGeminiMemoryText(input);

  if (geminiResult) {
    return geminiResult;
  }

  const openAiResult = await buildOpenAiMemoryText(input);

  if (openAiResult) {
    return openAiResult;
  }

  return input.fallback;
}
