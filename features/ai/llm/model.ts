import { createOpenAI } from "@ai-sdk/openai";

export const mesh = createOpenAI({
  apiKey: process.env.MESH_API_KEY!,
  baseURL: process.env.MESH_BASE_URL ?? undefined,
});

export const DEFAULT_CHAT_MODEL = "openai/gpt-4.1-mini";

export function getChatModel(modelId = DEFAULT_CHAT_MODEL) {
  return mesh(modelId);
}
