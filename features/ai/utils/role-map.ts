import type { UIMessage } from "ai";
import { MessageRole } from "@/lib/generated/prisma/client";

export function toPrismaRole(role: UIMessage["role"]): MessageRole {
  switch (role) {
    case "user":
      return MessageRole.USER;
    case "assistant":
      return MessageRole.ASSISTANT;
    case "system":
      return MessageRole.SYSTEM;
    default:
      return MessageRole.TOOL;
  }
}

export function toUIRole(role: MessageRole): UIMessage["role"] {
  switch (role) {
    case MessageRole.USER:
      return "user";
    case MessageRole.ASSISTANT:
      return "assistant";
    case MessageRole.SYSTEM:
      return "system";
    default:
      return "assistant"; // TOOL has no direct UIMessage role equivalent
  }
}

export function extractPlainText(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}
