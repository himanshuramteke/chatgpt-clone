import {
  loadMessages,
  saveChatMessages,
} from "@/features/ai/actions/chat-actions";
import { getChatModel } from "@/features/ai/llm/model";
import { websearchTool } from "@/features/ai/tools/web-search-tool";
import { requireUser } from "@/features/auth/actions/requireUser";
import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

export async function POST(req: Request) {
  await auth.protect();

  const {
    message,
    id,
    webSearchEnabled = false,
  }: {
    message: UIMessage;
    id: string;
    webSearchEnabled?: boolean;
  } = await req.json();

  if (!message || !id) {
    return new Response("Missing message or conversation id", { status: 400 });
  }

  const user = await requireUser();

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  const previousMessages = await loadMessages(id);

  const alreadySaved = previousMessages.some(
    (storedMessage) => storedMessage.id === message.id,
  );

  const messages = alreadySaved
    ? previousMessages
    : [...previousMessages, message];

  if (!alreadySaved) {
    await saveChatMessages(id, [message]);
  }

  const result = streamText({
    model: getChatModel(conversation.model ?? undefined),
    system: `
You are GPT+, a helpful AI assistant.

Answer using your own knowledge whenever possible.

Only use the webSearch tool if:
- the user explicitly asks you to search
- the question requires recent or live information
- the answer depends on events after your knowledge cutoff
- the user asks for current prices, weather, sports, news or releases
- you are genuinely uncertain
${
  webSearchEnabled
    ? "\nThe user has manually enabled web search for this message. You MUST call webSearch at least once before answering, even if you believe you already know the answer."
    : ""
}

Never use webSearch for math, programming fundamentals, history, science, general concepts, or anything you already know confidently.

When using webSearch:
- search once using a concise query
- use the returned information
- cite sources naturally
- do not mention internal reasoning
`,
    messages: await convertToModelMessages(messages),
    tools: {
      webSearch: websearchTool,
    },
    stopWhen: stepCountIs(webSearchEnabled ? 3 : 5),
    prepareStep: async ({ stepNumber }) => {
      if (webSearchEnabled && stepNumber === 0) {
        return { toolChoice: { type: "tool", toolName: "webSearch" } };
      }
      return {};
    },
  });

  result.consumeStream();

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      onEnd: async ({ messages: finalMessages }) => {
        try {
          await saveChatMessages(id, finalMessages, { updateTitle: false });
        } catch (error) {
          console.error(error);
        }
      },
    }),
  });
}
